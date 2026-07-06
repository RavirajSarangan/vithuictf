"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import { requireAcademicsStaff, requireAdmin } from "@/lib/actions/auth";
import { actionFailure, type ActionResult } from "@/lib/actions/action-result";
import { safeRevalidatePath } from "@/lib/safe-revalidate";
import { notifyBatchStudentsPortal } from "@/lib/academics/batch-notifications";
import { gradeForMarks } from "@/lib/grades";
import { mapExam } from "@/lib/supabase/mappers";
import type { Exam } from "@/types";

function revalidateExamPaths() {
  safeRevalidatePath("/academics/exams");
  safeRevalidatePath("/results");
  safeRevalidatePath("/dashboard");
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

  let query = supabase
    .from("exams")
    .select("*, courses(name), course_batches(name)")
    .not("batch_id", "is", null)
    .order("exam_date", { ascending: false });
  if (batchId) query = query.eq("batch_id", batchId);

  const { data: rows, error } = await query;
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
    const profile = await requireAcademicsStaff();
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
