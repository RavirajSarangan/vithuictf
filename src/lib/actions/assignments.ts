"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import { getSessionProfile, requireAcademicsStaff } from "@/lib/actions/auth";
import { actionFailure, type ActionResult } from "@/lib/actions/action-result";
import { safeRevalidatePath } from "@/lib/safe-revalidate";
import { notifyBatchStudentsPortal } from "@/lib/academics/batch-notifications";
import { mapAssignment, mapAssignmentSubmission } from "@/lib/supabase/mappers";
import type { Assignment, AssignmentSubmission } from "@/types";

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([
  "pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt",
  "png", "jpg", "jpeg", "webp", "zip",
]);

function revalidateAssignmentPaths() {
  safeRevalidatePath("/academics/assignments");
  safeRevalidatePath("/assignments");
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);
}

function validateUpload(file: File): string | null {
  if (file.size <= 0) return "The selected file is empty";
  if (file.size > MAX_FILE_BYTES) return "File must be 20 MB or smaller";
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.has(ext)) return `File type .${ext || "?"} is not supported`;
  return null;
}

async function uploadToBucket(bucket: string, path: string, file: File): Promise<string> {
  if (!isAdminClientConfigured()) throw new Error("File storage is not configured");
  const admin = createAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage.from(bucket).upload(path, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return path;
}

export async function getStaffAssignments(batchId?: string): Promise<Assignment[]> {
  await requireAcademicsStaff();
  const supabase = await createClient();

  let query = supabase
    .from("assignments")
    .select("*, courses(name), course_batches(name)")
    .order("due_at", { ascending: false });
  if (batchId) query = query.eq("batch_id", batchId);

  const { data: rows, error } = await query;
  if (error) throw new Error(error.message);

  const assignments = (rows ?? []).map(mapAssignment);
  if (!assignments.length) return assignments;

  const { data: submissionRows } = await supabase
    .from("assignment_submissions")
    .select("assignment_id, status")
    .in("assignment_id", assignments.map((a) => a.id));

  const counts = new Map<string, { total: number; graded: number }>();
  for (const row of submissionRows ?? []) {
    const entry = counts.get(row.assignment_id) ?? { total: 0, graded: 0 };
    entry.total += 1;
    if (row.status !== "submitted") entry.graded += 1;
    counts.set(row.assignment_id, entry);
  }

  return assignments.map((a) => ({
    ...a,
    submissionCount: counts.get(a.id)?.total ?? 0,
    gradedCount: counts.get(a.id)?.graded ?? 0,
  }));
}

export async function getAssignmentDetail(assignmentId: string): Promise<{
  assignment: Assignment;
  submissions: AssignmentSubmission[];
  enrolledCount: number;
}> {
  await requireAcademicsStaff();
  const supabase = await createClient();

  const { data: row, error } = await supabase
    .from("assignments")
    .select("*, courses(name), course_batches(name)")
    .eq("id", assignmentId)
    .single();
  if (error || !row) throw new Error(error?.message ?? "Assignment not found");

  const [{ data: submissionRows }, { count: enrolledCount }] = await Promise.all([
    supabase
      .from("assignment_submissions")
      .select("*, students(display_name, student_id)")
      .eq("assignment_id", assignmentId)
      .order("submitted_at", { ascending: true }),
    supabase
      .from("batch_enrollments")
      .select("id", { count: "exact", head: true })
      .eq("batch_id", row.batch_id)
      .eq("active", true),
  ]);

  return {
    assignment: mapAssignment(row),
    submissions: (submissionRows ?? []).map(mapAssignmentSubmission),
    enrolledCount: enrolledCount ?? 0,
  };
}

export async function createAssignment(formData: FormData): Promise<ActionResult> {
  try {
    const profile = await requireAcademicsStaff();
    const supabase = await createClient();

    const batchId = String(formData.get("batchId") ?? "");
    const title = String(formData.get("title") ?? "").trim();
    const instructions = String(formData.get("instructions") ?? "").trim();
    const dueAt = String(formData.get("dueAt") ?? "");
    const maxMarks = Number(formData.get("maxMarks") ?? 100);
    const file = formData.get("file");

    if (!batchId) return { ok: false, error: "Batch is required" };
    if (title.length < 3) return { ok: false, error: "Title must be at least 3 characters" };
    if (!dueAt || Number.isNaN(Date.parse(dueAt))) return { ok: false, error: "A valid due date is required" };
    if (!Number.isFinite(maxMarks) || maxMarks < 1 || maxMarks > 1000) {
      return { ok: false, error: "Max marks must be between 1 and 1000" };
    }

    const { data: batch, error: batchError } = await supabase
      .from("course_batches")
      .select("id, course_id, name")
      .eq("id", batchId)
      .single();
    if (batchError || !batch) return actionFailure(batchError, "Batch not found or not accessible");

    let attachmentPath: string | null = null;
    let attachmentName: string | null = null;
    if (file instanceof File && file.size > 0) {
      const invalid = validateUpload(file);
      if (invalid) return { ok: false, error: invalid };
      attachmentName = file.name;
      attachmentPath = await uploadToBucket(
        "assignments",
        `${batchId}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`,
        file
      );
    }

    const { data: created, error } = await supabase
      .from("assignments")
      .insert({
        batch_id: batchId,
        course_id: batch.course_id,
        title,
        instructions,
        attachment_path: attachmentPath,
        attachment_name: attachmentName,
        due_at: new Date(dueAt).toISOString(),
        max_marks: Math.round(maxMarks),
        published: true,
        created_by: profile.id,
      })
      .select("id")
      .single();
    if (error || !created) return actionFailure(error, "Failed to create assignment");

    const dueLabel = new Date(dueAt).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
    });
    await notifyBatchStudentsPortal(
      batchId,
      `New assignment — ${title}`,
      `${batch.name}: "${title}" is due ${dueLabel}. Open Assignments to submit your work.`,
      { kind: "assignment_new", assignmentId: created.id }
    );

    revalidateAssignmentPaths();
    return { ok: true };
  } catch (error) {
    return actionFailure(error, "Failed to create assignment");
  }
}

export async function updateAssignment(
  assignmentId: string,
  data: { title: string; instructions: string; dueAt: string; maxMarks: number; published: boolean }
): Promise<ActionResult> {
  try {
    await requireAcademicsStaff();
    const supabase = await createClient();

    if (data.title.trim().length < 3) return { ok: false, error: "Title must be at least 3 characters" };
    if (!data.dueAt || Number.isNaN(Date.parse(data.dueAt))) {
      return { ok: false, error: "A valid due date is required" };
    }

    const { error } = await supabase
      .from("assignments")
      .update({
        title: data.title.trim(),
        instructions: data.instructions.trim(),
        due_at: new Date(data.dueAt).toISOString(),
        max_marks: Math.round(data.maxMarks),
        published: data.published,
        updated_at: new Date().toISOString(),
      })
      .eq("id", assignmentId);
    if (error) return actionFailure(error, "Failed to update assignment");

    revalidateAssignmentPaths();
    return { ok: true };
  } catch (error) {
    return actionFailure(error, "Failed to update assignment");
  }
}

export async function deleteAssignment(assignmentId: string): Promise<ActionResult> {
  try {
    await requireAcademicsStaff();
    const supabase = await createClient();

    const { data: row } = await supabase
      .from("assignments")
      .select("attachment_path")
      .eq("id", assignmentId)
      .maybeSingle();

    const { error } = await supabase.from("assignments").delete().eq("id", assignmentId);
    if (error) return actionFailure(error, "Failed to delete assignment");

    if (row?.attachment_path && isAdminClientConfigured()) {
      await createAdminClient().storage.from("assignments").remove([row.attachment_path]);
    }

    revalidateAssignmentPaths();
    return { ok: true };
  } catch (error) {
    return actionFailure(error, "Failed to delete assignment");
  }
}

export async function gradeSubmission(
  submissionId: string,
  data: { marks: number; feedback: string }
): Promise<ActionResult> {
  try {
    const profile = await requireAcademicsStaff();
    const supabase = await createClient();

    const { data: submission, error: fetchError } = await supabase
      .from("assignment_submissions")
      .select("id, assignment_id, student_id, students(user_id), assignments:assignment_id(title, max_marks)")
      .eq("id", submissionId)
      .single();
    if (fetchError || !submission) return actionFailure(fetchError, "Submission not found");

    const assignmentRaw = submission.assignments as unknown;
    const assignment = (Array.isArray(assignmentRaw) ? assignmentRaw[0] : assignmentRaw) as {
      title: string;
      max_marks: number;
    } | null;
    const maxMarks = assignment?.max_marks ?? 100;
    if (!Number.isFinite(data.marks) || data.marks < 0 || data.marks > maxMarks) {
      return { ok: false, error: `Marks must be between 0 and ${maxMarks}` };
    }

    const { error } = await supabase
      .from("assignment_submissions")
      .update({
        marks: Math.round(data.marks),
        feedback: data.feedback.trim(),
        status: "graded",
        graded_by: profile.id,
        graded_at: new Date().toISOString(),
      })
      .eq("id", submissionId);
    if (error) return actionFailure(error, "Failed to grade submission");

    const studentRaw = submission.students as unknown;
    const student = (Array.isArray(studentRaw) ? studentRaw[0] : studentRaw) as {
      user_id: string | null;
    } | null;
    if (student?.user_id) {
      const notifyClient = isAdminClientConfigured() ? createAdminClient() : supabase;
      await notifyClient.from("notifications").insert({
        user_id: student.user_id,
        title: `Assignment graded — ${assignment?.title ?? "Assignment"}`,
        body: `You scored ${Math.round(data.marks)}/${maxMarks}. Open Assignments to see the feedback.`,
        type: "result" as const,
        metadata: { kind: "assignment_graded", assignmentId: submission.assignment_id, submissionId },
      });
    }

    revalidateAssignmentPaths();
    return { ok: true };
  } catch (error) {
    return actionFailure(error, "Failed to grade submission");
  }
}

export async function submitAssignment(formData: FormData): Promise<ActionResult> {
  try {
    const profile = await getSessionProfile();
    if (!profile || profile.role !== "student") {
      return { ok: false, error: "Only students can submit assignments" };
    }

    const supabase = await createClient();
    const assignmentId = String(formData.get("assignmentId") ?? "");
    const note = String(formData.get("note") ?? "").trim();
    const file = formData.get("file");
    if (!assignmentId) return { ok: false, error: "Assignment is required" };
    if (!(file instanceof File) || file.size === 0) {
      if (!note) return { ok: false, error: "Attach a file or add a note to submit" };
    }

    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", profile.id)
      .maybeSingle();
    if (!student) return { ok: false, error: "No student profile linked to this account" };

    // RLS only returns assignments from the student's active batches.
    const { data: assignment } = await supabase
      .from("assignments")
      .select("id, batch_id, due_at")
      .eq("id", assignmentId)
      .maybeSingle();
    if (!assignment) return { ok: false, error: "Assignment not found or not available" };

    const { data: existing } = await supabase
      .from("assignment_submissions")
      .select("id, status, file_path")
      .eq("assignment_id", assignmentId)
      .eq("student_id", student.id)
      .maybeSingle();
    if (existing && existing.status !== "submitted") {
      return { ok: false, error: "This submission has already been graded" };
    }

    let filePath = existing?.file_path ?? null;
    let fileName: string | null = null;
    if (file instanceof File && file.size > 0) {
      const invalid = validateUpload(file);
      if (invalid) return { ok: false, error: invalid };
      fileName = file.name;
      filePath = await uploadToBucket(
        "submissions",
        `${assignmentId}/${student.id}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`,
        file
      );
    }

    if (existing) {
      const { error } = await supabase
        .from("assignment_submissions")
        .update({
          note,
          ...(fileName ? { file_path: filePath, file_name: fileName } : {}),
          submitted_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      if (error) return actionFailure(error, "Failed to update submission");
    } else {
      const { error } = await supabase.from("assignment_submissions").insert({
        assignment_id: assignmentId,
        student_id: student.id,
        note,
        file_path: filePath,
        file_name: fileName,
        status: "submitted" as const,
      });
      if (error) return actionFailure(error, "Failed to submit assignment");
    }

    revalidateAssignmentPaths();
    return { ok: true };
  } catch (error) {
    return actionFailure(error, "Failed to submit assignment");
  }
}
