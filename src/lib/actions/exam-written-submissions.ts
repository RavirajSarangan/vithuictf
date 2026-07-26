"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import { getSessionProfile, requireAcademicsStaff } from "@/lib/actions/auth";
import { actionFailure, type ActionResult } from "@/lib/actions/action-result";
import { safeRevalidatePath } from "@/lib/safe-revalidate";
import { sanitizeFileName, uploadToBucket, validateUpload } from "@/lib/storage-upload";
import { mapExam, mapExamWrittenSubmission } from "@/lib/supabase/mappers";
import type { Exam, ExamWrittenSubmission, ExamWrittenStatus } from "@/types";

function revalidateExamWrittenPaths() {
  safeRevalidatePath("/academics/exams");
  safeRevalidatePath("/exams");
}

/** Student read: the exam plus their own written submission, if any. */
export async function getExamPortal(examId: string): Promise<{
  exam: Exam;
  mySubmission: ExamWrittenSubmission | null;
}> {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "student") {
    throw new Error("Only students can view the exam portal");
  }

  const supabase = await createClient();

  const { data: examRow, error } = await supabase
    .from("exams")
    .select("*, courses(name), course_batches(name)")
    .eq("id", examId)
    .eq("is_online_exam", true)
    .single();
  if (error || !examRow) throw new Error(error?.message ?? "Exam not found or not available");

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("user_id", profile.id)
    .maybeSingle();

  let mySubmission: ExamWrittenSubmission | null = null;
  if (student) {
    const { data: submissionRow } = await supabase
      .from("exam_written_submissions")
      .select("*")
      .eq("exam_id", examId)
      .eq("student_id", student.id)
      .maybeSingle();
    mySubmission = submissionRow ? mapExamWrittenSubmission(submissionRow) : null;
  }

  return { exam: mapExam(examRow), mySubmission };
}

/** Student write: submit or replace a scanned answer PDF. */
export async function submitWrittenAnswer(formData: FormData): Promise<ActionResult> {
  try {
    const profile = await getSessionProfile();
    if (!profile || profile.role !== "student") {
      return { ok: false, error: "Only students can submit exam answers" };
    }

    const supabase = await createClient();
    const examId = String(formData.get("examId") ?? "");
    const note = String(formData.get("note") ?? "").trim();
    const file = formData.get("file");
    if (!examId) return { ok: false, error: "Exam is required" };
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: "Attach your scanned answer PDF to submit" };
    }

    const invalid = validateUpload(file);
    if (invalid) return { ok: false, error: invalid };

    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", profile.id)
      .maybeSingle();
    if (!student) return { ok: false, error: "No student profile linked to this account" };

    // RLS only returns online exams visible to this student's enrolled courses.
    const { data: exam } = await supabase
      .from("exams")
      .select("id, is_online_exam, written_enabled")
      .eq("id", examId)
      .maybeSingle();
    if (!exam || !exam.is_online_exam || !exam.written_enabled) {
      return { ok: false, error: "This exam does not accept written submissions" };
    }

    const { data: existing } = await supabase
      .from("exam_written_submissions")
      .select("id, status")
      .eq("exam_id", examId)
      .eq("student_id", student.id)
      .maybeSingle();
    if (existing && existing.status !== "submitted") {
      return { ok: false, error: "This submission has already been reviewed" };
    }

    const filePath = await uploadToBucket(
      "submissions",
      `exam/${examId}/${student.id}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`,
      file
    );

    if (existing) {
      const { error } = await supabase
        .from("exam_written_submissions")
        .update({
          file_path: filePath,
          file_name: file.name,
          note,
          submitted_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      if (error) return actionFailure(error, "Failed to update submission");
    } else {
      const { error } = await supabase.from("exam_written_submissions").insert({
        exam_id: examId,
        student_id: student.id,
        file_path: filePath,
        file_name: file.name,
        note,
        status: "submitted" as const,
      });
      if (error) return actionFailure(error, "Failed to submit answer");
    }

    revalidateExamWrittenPaths();
    return { ok: true };
  } catch (error) {
    return actionFailure(error, "Failed to submit answer");
  }
}

/** Staff read: all written submissions for one exam, for the review panel. */
export async function getExamWrittenSubmissions(examId: string): Promise<ExamWrittenSubmission[]> {
  await requireAcademicsStaff();
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("exam_written_submissions")
    .select("*, students(display_name, student_id)")
    .eq("exam_id", examId)
    .order("submitted_at", { ascending: true });
  if (error) throw new Error(error.message);

  return (rows ?? []).map(mapExamWrittenSubmission);
}

/** Staff write: mark reviewed or grade a written submission. */
export async function reviewWrittenSubmission(
  submissionId: string,
  data: { status: ExamWrittenStatus; marks?: number | null; feedback?: string }
): Promise<ActionResult> {
  try {
    const profile = await requireAcademicsStaff();
    const supabase = await createClient();

    const { data: submission, error: fetchError } = await supabase
      .from("exam_written_submissions")
      .select("id, exam_id, students(user_id), exams:exam_id(title, total_marks)")
      .eq("id", submissionId)
      .single();
    if (fetchError || !submission) return actionFailure(fetchError, "Submission not found");

    const examRaw = submission.exams as unknown;
    const exam = (Array.isArray(examRaw) ? examRaw[0] : examRaw) as {
      title: string;
      total_marks: number;
    } | null;

    if (data.status === "graded") {
      const maxMarks = exam?.total_marks ?? 100;
      if (
        data.marks === undefined ||
        data.marks === null ||
        !Number.isFinite(data.marks) ||
        data.marks < 0 ||
        data.marks > maxMarks
      ) {
        return { ok: false, error: `Marks must be between 0 and ${maxMarks}` };
      }
    }

    const { error } = await supabase
      .from("exam_written_submissions")
      .update({
        status: data.status,
        marks: data.status === "graded" ? Math.round(data.marks ?? 0) : null,
        feedback: data.feedback?.trim() || null,
        reviewed_by: profile.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", submissionId);
    if (error) return actionFailure(error, "Failed to update submission");

    if (data.status === "graded") {
      const studentRaw = submission.students as unknown;
      const student = (Array.isArray(studentRaw) ? studentRaw[0] : studentRaw) as {
        user_id: string | null;
      } | null;
      if (student?.user_id) {
        const notifyClient = isAdminClientConfigured() ? createAdminClient() : supabase;
        await notifyClient.from("notifications").insert({
          user_id: student.user_id,
          title: `Written answer graded — ${exam?.title ?? "Exam"}`,
          body: `You scored ${Math.round(data.marks ?? 0)}/${exam?.total_marks ?? 100} on the written section. Open Exams to see the feedback.`,
          type: "result" as const,
          metadata: { kind: "exam_written_graded", examId: submission.exam_id, submissionId },
        });
      }
    }

    revalidateExamWrittenPaths();
    return { ok: true };
  } catch (error) {
    return actionFailure(error, "Failed to update submission");
  }
}

/**
 * Bulk mark-reviewed only — bulk *grading* isn't automated since marks are
 * a per-student input, not a single value that could apply to a whole batch.
 */
export async function bulkReviewWrittenSubmissions(submissionIds: string[]): Promise<ActionResult> {
  try {
    const profile = await requireAcademicsStaff();
    if (!submissionIds.length) return { ok: false, error: "No submissions selected" };

    const supabase = await createClient();
    const { error } = await supabase
      .from("exam_written_submissions")
      .update({
        status: "reviewed" as const,
        reviewed_by: profile.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .in("id", submissionIds)
      .eq("status", "submitted");
    if (error) return actionFailure(error, "Failed to update submissions");

    revalidateExamWrittenPaths();
    return { ok: true };
  } catch (error) {
    return actionFailure(error, "Failed to update submissions");
  }
}
