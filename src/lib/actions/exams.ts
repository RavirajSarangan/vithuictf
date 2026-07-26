"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import { requireAcademicsStaff, requireAdmin, requireFeatureAccess } from "@/lib/actions/auth";
import { actionFailure, type ActionResult } from "@/lib/actions/action-result";
import { safeRevalidatePath } from "@/lib/safe-revalidate";
import { notifyBatchStudentsPortal } from "@/lib/academics/batch-notifications";
import { gradeForMarks } from "@/lib/grades";
import { mapExam } from "@/lib/supabase/mappers";
import { sanitizeFileName, uploadToBucket, validateUpload } from "@/lib/storage-upload";
import type { Exam } from "@/types";

function revalidateExamPaths() {
  safeRevalidatePath("/academics/exams");
  safeRevalidatePath("/results");
  safeRevalidatePath("/dashboard");
  safeRevalidatePath("/exams");
}

export type MarkSheetRow = {
  studentId: string;
  studentName: string;
  enrollmentCode: string;
  marks: number | null;
  grade: string | null;
};

export async function getStaffExams(batchId?: string): Promise<Exam[]> {
  await requireAcademicsStaff();
  const supabase = await createClient();

  // Online exams (batch_id NULL, is_online_exam true) are course-wide by
  // design and must still show up in the staff list alongside batch exams.
  const baseQuery = supabase
    .from("exams")
    .select("*, courses(name), course_batches(name)")
    .or("batch_id.not.is.null,is_online_exam.eq.true")
    .order("exam_date", { ascending: false });

  const { data: rows, error } = batchId ? await baseQuery.eq("batch_id", batchId) : await baseQuery;
  if (error) throw new Error(error.message);

  const exams = (rows ?? []).map(mapExam);
  if (!exams.length) return exams;

  const [{ data: resultRows }, { data: enrollmentRows }] = await Promise.all([
    supabase
      .from("results")
      .select("exam_id")
      .in("exam_id", exams.map((e) => e.id)),
    supabase
      .from("batch_enrollments")
      .select("batch_id")
      .in("batch_id", [...new Set(exams.map((e) => e.batchId).filter(Boolean))] as string[])
      .eq("active", true),
  ]);

  const marksCounts = new Map<string, number>();
  for (const row of resultRows ?? []) {
    if (!row.exam_id) continue;
    marksCounts.set(row.exam_id, (marksCounts.get(row.exam_id) ?? 0) + 1);
  }
  const studentCounts = new Map<string, number>();
  for (const row of enrollmentRows ?? []) {
    studentCounts.set(row.batch_id, (studentCounts.get(row.batch_id) ?? 0) + 1);
  }

  return exams.map((e) => ({
    ...e,
    marksEnteredCount: marksCounts.get(e.id) ?? 0,
    studentCount: e.batchId ? studentCounts.get(e.batchId) ?? 0 : 0,
  }));
}

export async function createExam(input: {
  batchId: string;
  title: string;
  subject: string;
  examDate: string;
  startTime?: string;
  totalMarks: number;
  term: string;
  weight: number;
}): Promise<ActionResult> {
  try {
    const profile = await requireFeatureAccess("quizzes_exams");
    const supabase = await createClient();

    const title = input.title.trim();
    const subject = input.subject.trim();
    const term = input.term.trim();
    if (title.length < 3) return { ok: false, error: "Title must be at least 3 characters" };
    if (!subject) return { ok: false, error: "Subject is required" };
    if (!term) return { ok: false, error: "Term is required" };
    if (!input.examDate || Number.isNaN(Date.parse(input.examDate))) {
      return { ok: false, error: "A valid exam date is required" };
    }
    if (!Number.isFinite(input.totalMarks) || input.totalMarks < 1 || input.totalMarks > 1000) {
      return { ok: false, error: "Total marks must be between 1 and 1000" };
    }
    if (!Number.isFinite(input.weight) || input.weight <= 0 || input.weight > 10) {
      return { ok: false, error: "Weight must be between 0 and 10" };
    }

    const { data: batch, error: batchError } = await supabase
      .from("course_batches")
      .select("id, course_id, name")
      .eq("id", input.batchId)
      .single();
    if (batchError || !batch) return actionFailure(batchError, "Batch not found or not accessible");

    const { data: created, error } = await supabase
      .from("exams")
      .insert({
        batch_id: input.batchId,
        course_id: batch.course_id,
        title,
        subject,
        exam_date: input.examDate,
        start_time: input.startTime || null,
        total_marks: Math.round(input.totalMarks),
        term,
        weight: input.weight,
        status: "scheduled" as const,
        created_by: profile.id,
      })
      .select("id")
      .single();
    if (error || !created) return actionFailure(error, "Failed to schedule exam");

    const dateLabel = new Date(input.examDate).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
    });
    await notifyBatchStudentsPortal(
      input.batchId,
      `Exam scheduled — ${title}`,
      `${batch.name}: "${title}" (${subject}) is on ${dateLabel}. Check Results for upcoming exams.`,
      { kind: "exam_scheduled", examId: created.id }
    );

    revalidateExamPaths();
    return { ok: true };
  } catch (error) {
    return actionFailure(error, "Failed to schedule exam");
  }
}

export async function updateExam(
  examId: string,
  data: {
    title: string;
    subject: string;
    examDate: string;
    startTime?: string;
    totalMarks: number;
    term: string;
    weight: number;
  }
): Promise<ActionResult> {
  try {
    await requireAcademicsStaff();
    const supabase = await createClient();

    if (data.title.trim().length < 3) return { ok: false, error: "Title must be at least 3 characters" };
    if (!data.examDate || Number.isNaN(Date.parse(data.examDate))) {
      return { ok: false, error: "A valid exam date is required" };
    }

    const { data: exam } = await supabase
      .from("exams")
      .select("id, total_marks")
      .eq("id", examId)
      .maybeSingle();
    if (!exam) return { ok: false, error: "Exam not found" };

    if (Math.round(data.totalMarks) !== exam.total_marks) {
      const { count } = await supabase
        .from("results")
        .select("id", { count: "exact", head: true })
        .eq("exam_id", examId);
      if ((count ?? 0) > 0) {
        return { ok: false, error: "Total marks cannot change once marks are entered" };
      }
    }

    const { error } = await supabase
      .from("exams")
      .update({
        title: data.title.trim(),
        subject: data.subject.trim(),
        exam_date: data.examDate,
        start_time: data.startTime || null,
        total_marks: Math.round(data.totalMarks),
        term: data.term.trim(),
        weight: data.weight,
      })
      .eq("id", examId);
    if (error) return actionFailure(error, "Failed to update exam");

    revalidateExamPaths();
    return { ok: true };
  } catch (error) {
    return actionFailure(error, "Failed to update exam");
  }
}

export async function deleteExam(examId: string): Promise<ActionResult> {
  try {
    await requireAcademicsStaff();
    const supabase = await createClient();

    const { error } = await supabase.from("exams").delete().eq("id", examId);
    if (error) return actionFailure(error, "Failed to delete exam");

    revalidateExamPaths();
    return { ok: true };
  } catch (error) {
    return actionFailure(error, "Failed to delete exam");
  }
}

export async function getMarkSheet(examId: string): Promise<{
  exam: Exam;
  rows: MarkSheetRow[];
}> {
  await requireAcademicsStaff();
  const supabase = await createClient();

  const { data: examRow, error } = await supabase
    .from("exams")
    .select("*, courses(name), course_batches(name)")
    .eq("id", examId)
    .single();
  if (error || !examRow) throw new Error(error?.message ?? "Exam not found");
  if (!examRow.batch_id) throw new Error("This exam has no batch, so it has no mark sheet");

  const [{ data: enrollments }, { data: resultRows }] = await Promise.all([
    supabase
      .from("batch_enrollments")
      .select("student_id, enrollment_code, students(display_name)")
      .eq("batch_id", examRow.batch_id)
      .eq("active", true),
    supabase.from("results").select("student_id, marks, grade").eq("exam_id", examId),
  ]);

  const resultByStudent = new Map(
    (resultRows ?? []).map((r) => [r.student_id, { marks: r.marks, grade: r.grade }])
  );

  const rows: MarkSheetRow[] = (enrollments ?? [])
    .map((e) => {
      const studentRaw = e.students as unknown;
      const student = (Array.isArray(studentRaw) ? studentRaw[0] : studentRaw) as {
        display_name: string;
      } | null;
      const existing = resultByStudent.get(e.student_id);
      return {
        studentId: e.student_id,
        studentName: student?.display_name ?? "Student",
        enrollmentCode: e.enrollment_code,
        marks: existing?.marks ?? null,
        grade: existing?.grade ?? null,
      };
    })
    .sort((a, b) => a.studentName.localeCompare(b.studentName));

  return { exam: mapExam(examRow), rows };
}

export async function saveMarks(
  examId: string,
  entries: { studentId: string; marks: number | null }[]
): Promise<ActionResult> {
  try {
    const profile = await requireAcademicsStaff();
    const supabase = await createClient();

    const { data: exam } = await supabase
      .from("exams")
      .select("id, title, subject, term, total_marks, batch_id, status, exam_date")
      .eq("id", examId)
      .maybeSingle();
    if (!exam) return { ok: false, error: "Exam not found" };
    if (!exam.batch_id) return { ok: false, error: "This exam has no batch" };

    for (const entry of entries) {
      if (entry.marks === null) continue;
      if (!Number.isFinite(entry.marks) || entry.marks < 0 || entry.marks > exam.total_marks) {
        return { ok: false, error: `Marks must be between 0 and ${exam.total_marks}` };
      }
    }

    const subject = exam.subject || exam.title;
    const { data: existingRows } = await supabase
      .from("results")
      .select("student_id, marks")
      .eq("exam_id", examId);

    // Merge existing marks with this save, then dense-rank the final set so
    // ranks stay correct even when only a few students are edited.
    const finalMarks = new Map<string, number>(
      (existingRows ?? []).map((r) => [r.student_id, r.marks])
    );
    const cleared: string[] = [];
    for (const entry of entries) {
      if (entry.marks === null) {
        if (finalMarks.delete(entry.studentId)) cleared.push(entry.studentId);
      } else {
        finalMarks.set(entry.studentId, Math.round(entry.marks));
      }
    }

    const sortedMarks = [...new Set(finalMarks.values())].sort((a, b) => b - a);
    const rankByMarks = new Map(sortedMarks.map((m, i) => [m, i + 1]));

    if (cleared.length) {
      const { error } = await supabase
        .from("results")
        .delete()
        .eq("exam_id", examId)
        .in("student_id", cleared);
      if (error) return actionFailure(error, "Failed to clear marks");
    }

    if (finalMarks.size) {
      const rows = [...finalMarks.entries()].map(([studentId, marks]) => ({
        exam_id: examId,
        student_id: studentId,
        exam_title: exam.title,
        subject,
        grade: gradeForMarks(marks, exam.total_marks),
        marks,
        max_marks: exam.total_marks,
        rank: rankByMarks.get(marks) ?? 0,
        term: exam.term,
        result_date: exam.exam_date,
        entered_by: profile.id,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("results")
        .upsert(rows, { onConflict: "exam_id,student_id,subject" });
      if (error) return actionFailure(error, "Failed to save marks");
    }

    if (exam.status === "scheduled") {
      await supabase.from("exams").update({ status: "grading" as const }).eq("id", examId);
    }

    revalidateExamPaths();
    return { ok: true };
  } catch (error) {
    return actionFailure(error, "Failed to save marks");
  }
}

export async function publishExamResults(examId: string): Promise<ActionResult> {
  try {
    await requireAcademicsStaff();
    const supabase = await createClient();

    const { data: exam } = await supabase
      .from("exams")
      .select("id, title, subject, total_marks, status")
      .eq("id", examId)
      .maybeSingle();
    if (!exam) return { ok: false, error: "Exam not found" };

    const { data: resultRows } = await supabase
      .from("results")
      .select("student_id, marks, students(user_id)")
      .eq("exam_id", examId);
    if (!resultRows?.length) {
      return { ok: false, error: "Enter marks before publishing results" };
    }

    const { error } = await supabase
      .from("exams")
      .update({ status: "published" as const, published_at: new Date().toISOString() })
      .eq("id", examId);
    if (error) return actionFailure(error, "Failed to publish results");

    const notifyClient = isAdminClientConfigured() ? createAdminClient() : supabase;
    const notifications = resultRows.flatMap((row) => {
      const studentRaw = row.students as unknown;
      const student = (Array.isArray(studentRaw) ? studentRaw[0] : studentRaw) as {
        user_id: string | null;
      } | null;
      if (!student?.user_id) return [];
      return [{
        user_id: student.user_id,
        title: `Results published — ${exam.title}`,
        body: `You scored ${row.marks}/${exam.total_marks} in ${exam.subject || exam.title}. Open Results to see details.`,
        type: "result" as const,
        metadata: { kind: "exam_results_published", examId },
      }];
    });
    if (notifications.length) {
      await notifyClient.from("notifications").insert(notifications);
    }

    revalidateExamPaths();
    return { ok: true };
  } catch (error) {
    return actionFailure(error, "Failed to publish results");
  }
}

export async function unpublishExamResults(examId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { error } = await supabase
      .from("exams")
      .update({ status: "grading" as const, published_at: null })
      .eq("id", examId);
    if (error) return actionFailure(error, "Failed to unpublish results");

    revalidateExamPaths();
    return { ok: true };
  } catch (error) {
    return actionFailure(error, "Failed to unpublish results");
  }
}

// --- Online exam portal (Part 1 MCQ + Part 2 written) -----------------
//
// Kept as separate functions from createExam/updateExam/getMarkSheet above
// rather than threading optional fields through them: those are the
// already-shipped batch-required marks/report-card flow, and online exams
// are deliberately course-wide (batch optional) with a stricter
// super-admin-only write gate — mixing the two risks regressing the
// existing flow for no benefit.

export async function getExamById(examId: string): Promise<Exam> {
  await requireAcademicsStaff();
  const supabase = await createClient();

  const { data: row, error } = await supabase
    .from("exams")
    .select("*, courses(name), course_batches(name)")
    .eq("id", examId)
    .single();
  if (error || !row) throw new Error(error?.message ?? "Exam not found");

  return mapExam(row);
}

type DraftQuestionInput = {
  prompt: string;
  options: string[];
  correctIndex: number;
  points: number;
};

function parseDraftQuestions(raw: string): DraftQuestionInput[] | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(
      (q): q is DraftQuestionInput =>
        typeof q === "object" &&
        q !== null &&
        typeof (q as DraftQuestionInput).prompt === "string" &&
        Array.isArray((q as DraftQuestionInput).options)
    );
  } catch {
    return null;
  }
}

export async function createOnlineExam(formData: FormData): Promise<ActionResult> {
  try {
    const profile = await requireFeatureAccess("quizzes_exams");
    const supabase = await createClient();

    const courseId = String(formData.get("courseId") ?? "");
    const title = String(formData.get("title") ?? "").trim();
    const subject = String(formData.get("subject") ?? "").trim();
    const term = String(formData.get("term") ?? "").trim();
    const examDate = String(formData.get("examDate") ?? "");
    const totalMarks = Number(formData.get("totalMarks") ?? 100);
    const weight = Number(formData.get("weight") ?? 1);
    const authoringMode = String(formData.get("authoringMode") ?? "link");
    let quizId = String(formData.get("quizId") ?? "") || null;
    const timeLimitRaw = String(formData.get("timeLimitMinutes") ?? "");
    const timeLimitMinutes = timeLimitRaw ? Number(timeLimitRaw) : null;
    const maxAttempts = Math.max(0, Math.round(Number(formData.get("maxAttempts") ?? 0)));
    const writtenEnabled = formData.get("writtenEnabled") === "true";
    const deadlineRaw = String(formData.get("writtenSubmissionDeadline") ?? "");
    const file = formData.get("writtenQuestionPaper");
    const mcqFile = formData.get("mcqQuestionPaper");
    const published = formData.get("published") === "true";

    if (!courseId) return { ok: false, error: "Course is required" };
    if (title.length < 3) return { ok: false, error: "Title must be at least 3 characters" };
    if (!subject) return { ok: false, error: "Subject is required" };
    if (!term) return { ok: false, error: "Term is required" };
    if (!examDate || Number.isNaN(Date.parse(examDate))) {
      return { ok: false, error: "A valid exam date is required" };
    }
    if (!Number.isFinite(totalMarks) || totalMarks < 1 || totalMarks > 1000) {
      return { ok: false, error: "Total marks must be between 1 and 1000" };
    }
    if (!Number.isFinite(weight) || weight <= 0 || weight > 10) {
      return { ok: false, error: "Weight must be between 0 and 10" };
    }

    let draftQuestions: DraftQuestionInput[] = [];
    if (authoringMode === "build") {
      const parsed = parseDraftQuestions(String(formData.get("questions") ?? "[]"));
      if (!parsed) return { ok: false, error: "Invalid question data" };
      draftQuestions = parsed;
    }

    const hasMcq = authoringMode === "build" ? draftQuestions.length > 0 : Boolean(quizId);
    if (!hasMcq && !writtenEnabled) {
      return { ok: false, error: "Enable at least one of Part 1 (MCQ) or Part 2 (written)" };
    }
    if (published && authoringMode === "build" && draftQuestions.length === 0 && !writtenEnabled) {
      return { ok: false, error: "Add at least one question before publishing" };
    }

    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, name")
      .eq("id", courseId)
      .single();
    if (courseError || !course) return actionFailure(courseError, "Course not found or not accessible");

    if (authoringMode === "build") {
      const { data: newQuiz, error: quizError } = await supabase
        .from("quizzes")
        .insert({
          course_id: courseId,
          batch_id: null,
          title,
          description: "",
          time_limit_minutes: timeLimitMinutes,
          max_attempts: maxAttempts,
          published,
          created_by: profile.id,
        })
        .select("id")
        .single();
      if (quizError || !newQuiz) return actionFailure(quizError, "Failed to create quiz for Part 1");
      quizId = newQuiz.id;

      if (draftQuestions.length) {
        const rows = draftQuestions.map((q, index) => ({
          quiz_id: quizId,
          prompt: q.prompt.trim(),
          options: q.options.map((o) => o.trim()).filter(Boolean),
          correct_index: q.correctIndex,
          points: Math.round(q.points) || 1,
          position: index + 1,
        }));
        const { error: questionsError } = await supabase.from("quiz_questions").insert(rows);
        if (questionsError) return actionFailure(questionsError, "Failed to save questions");
      }
    } else if (quizId) {
      const { data: quiz, error: quizError } = await supabase
        .from("quizzes")
        .select("id, course_id")
        .eq("id", quizId)
        .maybeSingle();
      if (quizError || !quiz) return { ok: false, error: "Selected quiz not found" };
      if (quiz.course_id !== courseId) {
        return { ok: false, error: "Selected quiz does not belong to this course" };
      }
      if (published) {
        const { count } = await supabase
          .from("quiz_questions")
          .select("id", { count: "exact", head: true })
          .eq("quiz_id", quizId);
        if (!count && !writtenEnabled) {
          return { ok: false, error: "The linked quiz has no questions yet" };
        }
      }
      await supabase
        .from("quizzes")
        .update({ time_limit_minutes: timeLimitMinutes, max_attempts: maxAttempts, published })
        .eq("id", quizId);
    }

    let writtenQuestionPaperPath: string | null = null;
    let writtenQuestionPaperName: string | null = null;
    if (writtenEnabled && file instanceof File && file.size > 0) {
      const invalid = validateUpload(file);
      if (invalid) return { ok: false, error: invalid };
      writtenQuestionPaperName = file.name;
      writtenQuestionPaperPath = await uploadToBucket(
        "exam-question-papers",
        `${courseId}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`,
        file
      );
    }

    let mcqQuestionPaperPath: string | null = null;
    let mcqQuestionPaperName: string | null = null;
    if (mcqFile instanceof File && mcqFile.size > 0) {
      const invalid = validateUpload(mcqFile);
      if (invalid) return { ok: false, error: invalid };
      mcqQuestionPaperName = mcqFile.name;
      mcqQuestionPaperPath = await uploadToBucket(
        "exam-question-papers",
        `${courseId}/${crypto.randomUUID()}-${sanitizeFileName(mcqFile.name)}`,
        mcqFile
      );
    }

    const { data: created, error } = await supabase
      .from("exams")
      .insert({
        course_id: courseId,
        batch_id: null,
        title,
        subject,
        exam_date: examDate,
        total_marks: Math.round(totalMarks),
        term,
        weight,
        status: "scheduled" as const,
        created_by: profile.id,
        is_online_exam: true,
        published,
        quiz_id: quizId,
        mcq_question_paper_path: mcqQuestionPaperPath,
        mcq_question_paper_name: mcqQuestionPaperName,
        written_enabled: writtenEnabled,
        written_question_paper_path: writtenQuestionPaperPath,
        written_question_paper_name: writtenQuestionPaperName,
        written_submission_deadline: deadlineRaw ? new Date(deadlineRaw).toISOString() : null,
      })
      .select("id")
      .single();
    if (error || !created) return actionFailure(error, "Failed to create online exam");

    revalidateExamPaths();
    return { ok: true };
  } catch (error) {
    return actionFailure(error, "Failed to create online exam");
  }
}

export async function updateOnlineExam(examId: string, formData: FormData): Promise<ActionResult> {
  try {
    await requireAcademicsStaff();
    const supabase = await createClient();

    const { data: exam } = await supabase
      .from("exams")
      .select("id, course_id, written_question_paper_path, mcq_question_paper_path")
      .eq("id", examId)
      .maybeSingle();
    if (!exam) return { ok: false, error: "Exam not found" };

    const quizId = String(formData.get("quizId") ?? "") || null;
    const timeLimitRaw = String(formData.get("timeLimitMinutes") ?? "");
    const timeLimitMinutes = timeLimitRaw ? Number(timeLimitRaw) : null;
    const maxAttempts = Math.max(0, Math.round(Number(formData.get("maxAttempts") ?? 0)));
    const writtenEnabled = formData.get("writtenEnabled") === "true";
    const deadlineRaw = String(formData.get("writtenSubmissionDeadline") ?? "");
    const file = formData.get("writtenQuestionPaper");
    const mcqFile = formData.get("mcqQuestionPaper");
    const published = formData.get("published") === "true";

    if (!quizId && !writtenEnabled) {
      return { ok: false, error: "Enable at least one of Part 1 (MCQ) or Part 2 (written)" };
    }

    if (quizId) {
      const { data: quiz } = await supabase
        .from("quizzes")
        .select("id, course_id")
        .eq("id", quizId)
        .maybeSingle();
      if (!quiz) return { ok: false, error: "Selected quiz not found" };
      if (quiz.course_id !== exam.course_id) {
        return { ok: false, error: "Selected quiz does not belong to this exam's course" };
      }
      if (published) {
        const { count } = await supabase
          .from("quiz_questions")
          .select("id", { count: "exact", head: true })
          .eq("quiz_id", quizId);
        if (!count && !writtenEnabled) {
          return { ok: false, error: "Add at least one question before publishing" };
        }
      }
      await supabase
        .from("quizzes")
        .update({ time_limit_minutes: timeLimitMinutes, max_attempts: maxAttempts, published })
        .eq("id", quizId);
    }

    const update: {
      quiz_id: string | null;
      written_enabled: boolean;
      written_submission_deadline: string | null;
      published: boolean;
      written_question_paper_path?: string;
      written_question_paper_name?: string;
      mcq_question_paper_path?: string;
      mcq_question_paper_name?: string;
    } = {
      quiz_id: quizId,
      written_enabled: writtenEnabled,
      written_submission_deadline: deadlineRaw ? new Date(deadlineRaw).toISOString() : null,
      published,
    };

    if (writtenEnabled && file instanceof File && file.size > 0) {
      const invalid = validateUpload(file);
      if (invalid) return { ok: false, error: invalid };
      const previousPath = exam.written_question_paper_path;
      update.written_question_paper_name = file.name;
      update.written_question_paper_path = await uploadToBucket(
        "exam-question-papers",
        `${exam.course_id}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`,
        file
      );
      if (previousPath && isAdminClientConfigured()) {
        await createAdminClient().storage.from("exam-question-papers").remove([previousPath]);
      }
    }

    if (mcqFile instanceof File && mcqFile.size > 0) {
      const invalid = validateUpload(mcqFile);
      if (invalid) return { ok: false, error: invalid };
      const previousMcqPath = exam.mcq_question_paper_path;
      update.mcq_question_paper_name = mcqFile.name;
      update.mcq_question_paper_path = await uploadToBucket(
        "exam-question-papers",
        `${exam.course_id}/${crypto.randomUUID()}-${sanitizeFileName(mcqFile.name)}`,
        mcqFile
      );
      if (previousMcqPath && isAdminClientConfigured()) {
        await createAdminClient().storage.from("exam-question-papers").remove([previousMcqPath]);
      }
    }

    const { error } = await supabase.from("exams").update(update).eq("id", examId);
    if (error) return actionFailure(error, "Failed to update online exam");

    revalidateExamPaths();
    return { ok: true };
  } catch (error) {
    return actionFailure(error, "Failed to update online exam");
  }
}
