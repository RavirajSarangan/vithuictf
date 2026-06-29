"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import {
  getSessionProfile,
  requireAcademicsStaff,
  requireAdmin,
} from "@/lib/actions/auth";
import { sendStudentWelcomeEmail } from "@/lib/actions/email";
import { sendStudentWelcomeWhatsApp } from "@/lib/actions/whatsapp";
import { getAppUrl } from "@/lib/email/resend";
import { revalidateStudentPortalPaths } from "@/lib/revalidation-paths";
import { validateCanvaSlideUrl } from "@/lib/canva/url";
import type { AttendanceStatus, ClassSessionStatus } from "@/types";
import { isValidNic, normalizeNic } from "@/lib/validation/register-student";
import {
  normalizeSriLankaWhatsApp,
  validateSriLankaWhatsApp,
} from "@/lib/validation/sri-lanka-phone";
import {
  buildSessionScheduleFromRow,
  computeTotalClasses,
  countClassDaysInRange,
} from "@/lib/academics/schedule";
import {
  notifyBatchStudentsPortal,
  notifyAbsentStudents,
  sendBatchManualMessage,
  type DeliverySummary,
  type MessageChannels,
} from "@/lib/academics/batch-notifications";

function revalidateAcademicsPaths() {
  revalidatePath("/academics/dashboard");
  revalidatePath("/academics/batches");
  revalidatePath("/academics/students");
  revalidatePath("/academics/enrollments");
  revalidatePath("/academics/attendance");
  revalidatePath("/academics/reports");
  revalidatePath("/academics/calendar");
  revalidatePath("/admin/students");
  revalidateStudentPortalPaths();
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function adjustCourseStudentCounts(
  supabase: SupabaseServerClient,
  previousCourseId: string | null | undefined,
  newCourseId: string | null | undefined
) {
  if (!previousCourseId || !newCourseId || previousCourseId === newCourseId) return;

  const { data: previousCourse } = await supabase
    .from("courses")
    .select("student_count")
    .eq("id", previousCourseId)
    .maybeSingle();
  if (previousCourse && previousCourse.student_count > 0) {
    await supabase
      .from("courses")
      .update({ student_count: previousCourse.student_count - 1 })
      .eq("id", previousCourseId);
  }

  const { data: newCourse } = await supabase
    .from("courses")
    .select("student_count")
    .eq("id", newCourseId)
    .maybeSingle();
  if (newCourse) {
    await supabase
      .from("courses")
      .update({ student_count: newCourse.student_count + 1 })
      .eq("id", newCourseId);
  }
}

async function studentHasActiveBatchForCourse(
  supabase: SupabaseServerClient,
  studentId: string,
  courseId: string
): Promise<boolean> {
  const { data: enrollments } = await supabase
    .from("batch_enrollments")
    .select("id, course_batches!inner(course_id)")
    .eq("student_id", studentId)
    .eq("active", true);

  return (enrollments ?? []).some((row) => {
    const batchRaw = row.course_batches as unknown;
    const batch = (Array.isArray(batchRaw) ? batchRaw[0] : batchRaw) as { course_id: string } | null;
    return batch?.course_id === courseId;
  });
}

function slugifyCourse(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 12) || "COURSE";
}

async function nextBatchCode(courseId: string, courseName: string): Promise<string> {
  const supabase = await createClient();
  const year = new Date().getFullYear();
  const prefix = `${slugifyCourse(courseName)}-${year}-`;
  const { data } = await supabase
    .from("course_batches")
    .select("batch_code")
    .eq("course_id", courseId)
    .like("batch_code", `${prefix}%`)
    .order("batch_code", { ascending: false })
    .limit(1);

  const last = data?.[0]?.batch_code;
  const lastSeq = last ? parseInt(last.split("-").pop() ?? "0", 10) : 0;
  const seq = String(lastSeq + 1).padStart(2, "0");
  return `${prefix}${seq}`;
}

export async function previewBatchCode(courseId: string): Promise<string> {
  await requireAcademicsStaff();
  const supabase = await createClient();
  const { data: course } = await supabase
    .from("courses")
    .select("name")
    .eq("id", courseId)
    .maybeSingle();
  if (!course) throw new Error("Course not found");
  return nextBatchCode(courseId, course.name);
}

export async function previewBatchSchedule(input: {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  classDays: string[];
}) {
  await requireAcademicsStaff();
  const totalClasses = computeTotalClasses({
    startDate: input.startDate,
    endDate: input.endDate,
    startTime: input.startTime,
    endTime: input.endTime,
    classDays: input.classDays,
  });
  const inRange = countClassDaysInRange(input);
  return { totalClasses, daysInRange: inRange };
}

async function nextEnrollmentCode(batchCode: string): Promise<string> {
  const supabase = await createClient();
  const prefix = `${batchCode}-`;
  const { data } = await supabase
    .from("batch_enrollments")
    .select("enrollment_code")
    .like("enrollment_code", `${prefix}%`)
    .order("enrollment_code", { ascending: false })
    .limit(1);

  const last = data?.[0]?.enrollment_code;
  const lastSeq = last ? parseInt(last.split("-").pop() ?? "0", 10) : 0;
  return `${prefix}${String(lastSeq + 1).padStart(3, "0")}`;
}

function parseDateOnly(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

type BatchScheduleRow = {
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  class_days: string[];
  total_classes: number;
};

function buildSessionSchedule(batch: BatchScheduleRow) {
  return buildSessionScheduleFromRow(batch);
}

function normalizeTime(value: string): string {
  return value.slice(0, 5);
}

function scheduleFieldsChanged(
  before: BatchScheduleRow,
  updates: {
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    classDays?: string[];
    totalClasses?: number;
  }
): boolean {
  if (updates.startDate !== undefined && updates.startDate !== before.start_date) return true;
  if (updates.endDate !== undefined && updates.endDate !== before.end_date) return true;
  if (updates.startTime !== undefined && normalizeTime(updates.startTime) !== normalizeTime(before.start_time)) {
    return true;
  }
  if (updates.endTime !== undefined && normalizeTime(updates.endTime) !== normalizeTime(before.end_time)) {
    return true;
  }
  if (updates.totalClasses !== undefined && updates.totalClasses !== before.total_classes) {
    return true;
  }
  if (updates.classDays !== undefined) {
    const beforeDays = [...before.class_days].sort().join(",");
    const afterDays = [...updates.classDays].sort().join(",");
    if (beforeDays !== afterDays) return true;
  }
  return false;
}

async function syncClassSessionsToSchedule(batchId: string) {
  const supabase = await createClient();

  const { data: batch } = await supabase
    .from("course_batches")
    .select("start_date, end_date, start_time, end_time, class_days, total_classes, zoom_link")
    .eq("id", batchId)
    .maybeSingle();
  if (!batch) throw new Error("Batch not found");

  const targetSessions = buildSessionSchedule(batch);
  if (targetSessions.length === 0) {
    throw new Error("No class sessions could be scheduled with the selected days and date range");
  }

  const { data: existing } = await supabase
    .from("class_sessions")
    .select("id, session_number, scheduled_date, start_time, end_time, status")
    .eq("batch_id", batchId)
    .order("session_number");

  const existingSessions = existing ?? [];
  const sessionIds = existingSessions.map((s) => s.id);

  let sessionsWithAttendance = new Set<string>();
  if (sessionIds.length) {
    const { data: attendanceRows } = await supabase
      .from("attendance_records")
      .select("session_id")
      .in("session_id", sessionIds);
    sessionsWithAttendance = new Set((attendanceRows ?? []).map((r) => r.session_id));
  }

  const targetByNumber = new Map(targetSessions.map((s) => [s.session_number, s]));
  const existingByNumber = new Map(existingSessions.map((s) => [s.session_number, s]));

  for (const target of targetSessions) {
    const current = existingByNumber.get(target.session_number);
    if (current) {
      const hasAttendance = sessionsWithAttendance.has(current.id);
      const updates: Record<string, unknown> = {
        start_time: target.start_time,
        end_time: target.end_time,
      };
      if (!hasAttendance) {
        updates.scheduled_date = target.scheduled_date;
      }
      const { error } = await supabase.from("class_sessions").update(updates).eq("id", current.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("class_sessions").insert({
        batch_id: batchId,
        session_number: target.session_number,
        scheduled_date: target.scheduled_date,
        start_time: target.start_time,
        end_time: target.end_time,
        status: "scheduled",
        zoom_link: batch.zoom_link ?? null,
      });
      if (error) throw new Error(error.message);
    }
  }

  for (const current of existingSessions) {
    if (targetByNumber.has(current.session_number)) continue;
    if (sessionsWithAttendance.has(current.id)) continue;
    const { error } = await supabase.from("class_sessions").delete().eq("id", current.id);
    if (error) throw new Error(error.message);
  }

  return {
    synced: targetSessions.length,
    preservedWithAttendance: existingSessions.filter(
      (s) => sessionsWithAttendance.has(s.id) && !targetByNumber.has(s.session_number)
    ).length,
  };
}

export async function createBatch(data: {
  courseId: string;
  name: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  classDays: string[];
  totalClasses?: number;
  zoomLink?: string;
  studentIds?: string[];
  setAsCurrentCourse?: boolean;
}) {
  const profile = await requireAcademicsStaff();
  if (!data.name.trim()) throw new Error("Batch name is required");
  if (!data.classDays.length) throw new Error("Select at least one class day");

  const start = parseDateOnly(data.startDate);
  const end = parseDateOnly(data.endDate);
  if (end < start) throw new Error("End date must be on or after start date");

  const totalClasses = computeTotalClasses({
    startDate: data.startDate,
    endDate: data.endDate,
    startTime: data.startTime,
    endTime: data.endTime,
    classDays: data.classDays,
  });
  if (totalClasses === 0) {
    throw new Error("No class days in the selected date range");
  }

  const supabase = await createClient();
  const { data: course } = await supabase
    .from("courses")
    .select("name")
    .eq("id", data.courseId)
    .maybeSingle();
  if (!course) throw new Error("Course not found");

  const batchCode = await nextBatchCode(data.courseId, course.name);
  const zoomLink = data.zoomLink?.trim() || null;

  const { data: batch, error } = await supabase
    .from("course_batches")
    .insert({
      course_id: data.courseId,
      name: data.name.trim(),
      batch_code: batchCode,
      start_date: data.startDate,
      end_date: data.endDate,
      start_time: data.startTime,
      end_time: data.endTime,
      class_days: data.classDays,
      total_classes: totalClasses,
      zoom_link: zoomLink,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  const sessionResult = await generateClassSessions(batch.id);
  let enrolled = 0;
  if (data.studentIds?.length) {
    const enrollFn = data.setAsCurrentCourse ? enrollStudentsInCourse : enrollStudentsInBatch;
    const result = await enrollFn(batch.id, data.studentIds, {
      deactivateOtherCourses: data.setAsCurrentCourse,
    });
    enrolled = result.enrolled;
  }

  revalidateAcademicsPaths();
  return {
    id: batch.id,
    batchCode,
    sessionsCreated: sessionResult.created,
    enrolled,
  };
}

export async function updateBatchSchedule(
  batchId: string,
  data: {
    name?: string;
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    classDays?: string[];
    totalClasses?: number;
    active?: boolean;
    zoomLink?: string;
  }
) {
  await requireAcademicsStaff();
  const supabase = await createClient();

  const { data: before } = await supabase
    .from("course_batches")
    .select("start_date, end_date, start_time, end_time, class_days, total_classes")
    .eq("id", batchId)
    .maybeSingle();
  if (!before) throw new Error("Batch not found");

  const nextStart = data.startDate ?? before.start_date;
  const nextEnd = data.endDate ?? before.end_date;
  const nextClassDays = data.classDays ?? before.class_days;
  const nextStartTime = data.startTime ?? before.start_time;
  const nextEndTime = data.endTime ?? before.end_time;

  const scheduleChanged =
    data.startDate !== undefined ||
    data.endDate !== undefined ||
    data.classDays !== undefined ||
    data.startTime !== undefined ||
    data.endTime !== undefined;

  let computedTotal = before.total_classes;
  if (scheduleChanged) {
    computedTotal = computeTotalClasses({
      startDate: nextStart,
      endDate: nextEnd,
      startTime: nextStartTime,
      endTime: nextEndTime,
      classDays: nextClassDays,
    });
    if (computedTotal === 0) {
      throw new Error("No class days in the selected date range");
    }
  }

  const updates: Record<string, unknown> = {};
  if (data.name !== undefined) updates.name = data.name.trim();
  if (data.startDate !== undefined) updates.start_date = data.startDate;
  if (data.endDate !== undefined) updates.end_date = data.endDate;
  if (data.startTime !== undefined) updates.start_time = data.startTime;
  if (data.endTime !== undefined) updates.end_time = data.endTime;
  if (data.classDays !== undefined) updates.class_days = data.classDays;
  if (scheduleChanged) updates.total_classes = computedTotal;
  else if (data.totalClasses !== undefined) updates.total_classes = data.totalClasses;
  if (data.active !== undefined) updates.active = data.active;
  if (data.zoomLink !== undefined) updates.zoom_link = data.zoomLink.trim() || null;

  const { error } = await supabase.from("course_batches").update(updates).eq("id", batchId);
  if (error) throw new Error(error.message);

  let syncResult: { synced: number; preservedWithAttendance: number } | null = null;
  if (scheduleFieldsChanged(before, { ...data, totalClasses: computedTotal })) {
    syncResult = await syncClassSessionsToSchedule(batchId);
  }

  if (data.zoomLink !== undefined) {
    await supabase
      .from("class_sessions")
      .update({ zoom_link: data.zoomLink.trim() || null })
      .eq("batch_id", batchId)
      .eq("status", "scheduled");
  }

  revalidateAcademicsPaths();
  return syncResult;
}

export async function archiveBatch(batchId: string) {
  await updateBatchSchedule(batchId, { active: false });
}

export async function generateClassSessions(batchId: string) {
  await requireAcademicsStaff();
  const supabase = await createClient();

  const { data: batch } = await supabase
    .from("course_batches")
    .select("*")
    .eq("id", batchId)
    .maybeSingle();
  if (!batch) throw new Error("Batch not found");

  const { count } = await supabase
    .from("class_sessions")
    .select("id", { count: "exact", head: true })
    .eq("batch_id", batchId);
  if ((count ?? 0) > 0) {
    throw new Error("Sessions already exist for this batch. Delete them first to regenerate.");
  }

  const sessions = buildSessionSchedule(batch).map((s) => ({
    batch_id: batchId,
    session_number: s.session_number,
    scheduled_date: s.scheduled_date,
    start_time: s.start_time,
    end_time: s.end_time,
    status: "scheduled" as ClassSessionStatus,
    zoom_link: batch.zoom_link ?? null,
  }));

  if (sessions.length === 0) {
    throw new Error("No class sessions could be scheduled with the selected days and date range");
  }

  const { error } = await supabase.from("class_sessions").insert(sessions);
  if (error) throw new Error(error.message);

  revalidateAcademicsPaths();
  return { created: sessions.length };
}

export async function updateSessionTimes(
  sessionId: string,
  data: {
    scheduledDate?: string;
    startTime?: string;
    endTime?: string;
    status?: ClassSessionStatus;
    zoomLink?: string;
  }
) {
  await requireAcademicsStaff();
  const supabase = await createClient();
  const updates: Record<string, unknown> = {};
  if (data.scheduledDate !== undefined) updates.scheduled_date = data.scheduledDate;
  if (data.startTime !== undefined) updates.start_time = data.startTime;
  if (data.endTime !== undefined) updates.end_time = data.endTime;
  if (data.status !== undefined) updates.status = data.status;
  if (data.zoomLink !== undefined) updates.zoom_link = data.zoomLink.trim() || null;

  const { error } = await supabase.from("class_sessions").update(updates).eq("id", sessionId);
  if (error) throw new Error(error.message);
  revalidateAcademicsPaths();
}

export async function updateSessionCanvaSlide(
  sessionId: string,
  data: { url: string; title?: string }
) {
  await requireAcademicsStaff();
  const canvaSlideUrl = validateCanvaSlideUrl(data.url);
  const canvaSlideTitle = data.title?.trim() || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("class_sessions")
    .update({
      canva_slide_url: canvaSlideUrl,
      canva_slide_title: canvaSlideTitle,
    })
    .eq("id", sessionId);
  if (error) throw new Error(error.message);
  revalidateAcademicsPaths();
}

export async function clearSessionCanvaSlide(sessionId: string) {
  await requireAcademicsStaff();
  const supabase = await createClient();
  const { error } = await supabase
    .from("class_sessions")
    .update({
      canva_slide_url: null,
      canva_slide_title: null,
    })
    .eq("id", sessionId);
  if (error) throw new Error(error.message);
  revalidateAcademicsPaths();
}

export async function cancelClassSession(sessionId: string, reason: string) {
  const profile = await requireAcademicsStaff();
  const supabase = await createClient();
  const trimmed = reason.trim();
  if (!trimmed) throw new Error("Cancel message is required");

  const { data: session } = await supabase
    .from("class_sessions")
    .select("id, batch_id, session_number, scheduled_date, start_time, status")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) throw new Error("Session not found");
  if (session.status === "cancelled") throw new Error("Session is already cancelled");

  const { data: batch } = await supabase
    .from("course_batches")
    .select("name, batch_code")
    .eq("id", session.batch_id)
    .maybeSingle();

  const { error } = await supabase
    .from("class_sessions")
    .update({
      status: "cancelled",
      cancel_reason: trimmed,
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", sessionId);
  if (error) throw new Error(error.message);

  const title = `Class cancelled — ${batch?.name ?? "Batch"}`;
  const body = `Class ${session.session_number} on ${session.scheduled_date} (${session.start_time.slice(0, 5)}) is cancelled. ${trimmed}`;

  await notifyBatchStudentsPortal(session.batch_id, title, body, {
    sessionId,
    batchId: session.batch_id,
    batchCode: batch?.batch_code,
    kind: "class_cancel",
  });

  revalidateAcademicsPaths();
  return { notifiedBy: profile.id };
}

export async function sendBatchMessage(
  batchId: string,
  input: { title: string; body: string; sendPortal: boolean; sendWhatsApp: boolean }
): Promise<DeliverySummary> {
  const profile = await requireAcademicsStaff();
  const channels: MessageChannels = {
    sendPortal: input.sendPortal,
    sendWhatsApp: input.sendWhatsApp,
  };
  const summary = await sendBatchManualMessage(batchId, {
    title: input.title,
    body: input.body,
    channels,
    sentBy: profile.id,
  });
  revalidateAcademicsPaths();
  return summary;
}

export type { DeliverySummary, MessageChannels };

export async function enrollStudentInBatch(batchId: string, studentId: string) {
  await requireAcademicsStaff();
  const supabase = await createClient();

  const { data: batch } = await supabase
    .from("course_batches")
    .select("batch_code, active")
    .eq("id", batchId)
    .maybeSingle();
  if (!batch) throw new Error("Batch not found");
  if (!batch.active) throw new Error("Cannot enroll in an inactive batch");

  const enrollmentCode = await nextEnrollmentCode(batch.batch_code);

  const { data, error } = await supabase
    .from("batch_enrollments")
    .insert({
      batch_id: batchId,
      student_id: studentId,
      enrollment_code: enrollmentCode,
    })
    .select("id, enrollment_code")
    .single();

  if (error) {
    if (error.code === "23505") throw new Error("Student is already enrolled in this batch");
    throw new Error(error.message);
  }

  revalidateAcademicsPaths();
  return { id: data.id, enrollmentCode: data.enrollment_code };
}

export async function removeStudentFromBatch(enrollmentId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("batch_enrollments").delete().eq("id", enrollmentId);
  if (error) throw new Error(error.message);
  revalidateAcademicsPaths();
}

export async function setEnrollmentActive(enrollmentId: string, active: boolean) {
  await requireAcademicsStaff();
  const supabase = await createClient();
  const { error } = await supabase
    .from("batch_enrollments")
    .update({ active })
    .eq("id", enrollmentId);
  if (error) throw new Error(error.message);
  revalidateAcademicsPaths();
}

export async function enrollStudentsInBatch(batchId: string, studentIds: string[]) {
  await requireAcademicsStaff();
  const uniqueIds = [...new Set(studentIds.filter(Boolean))];
  if (!uniqueIds.length) throw new Error("Select at least one student");

  let enrolled = 0;
  const errors: string[] = [];

  for (const studentId of uniqueIds) {
    try {
      await enrollStudentInBatch(batchId, studentId);
      enrolled += 1;
    } catch (e) {
      errors.push(e instanceof Error ? e.message : "Enrollment failed");
    }
  }

  if (enrolled === 0) {
    throw new Error(errors[0] ?? "No students were enrolled");
  }

  return { enrolled, failed: uniqueIds.length - enrolled, errors };
}

export async function enrollStudentInCourse(
  batchId: string,
  studentId: string,
  options?: { deactivateOtherCourses?: boolean }
) {
  await requireAcademicsStaff();
  const supabase = await createClient();

  const { data: batch } = await supabase
    .from("course_batches")
    .select("batch_code, active, course_id, courses(name)")
    .eq("id", batchId)
    .maybeSingle();
  if (!batch) throw new Error("Batch not found");
  if (!batch.active) throw new Error("Cannot enroll in an inactive batch");

  const courseRaw = batch.courses as unknown;
  const course = (Array.isArray(courseRaw) ? courseRaw[0] : courseRaw) as { name: string } | null;
  const courseId = batch.course_id;
  const courseName = course?.name ?? "";

  const { data: student } = await supabase
    .from("students")
    .select("id, course_id")
    .eq("id", studentId)
    .maybeSingle();
  if (!student) throw new Error("Student not found");

  const { data: existingEnrollment } = await supabase
    .from("batch_enrollments")
    .select("id, active")
    .eq("batch_id", batchId)
    .eq("student_id", studentId)
    .maybeSingle();

  let enrollmentId: string;
  let enrollmentCode: string;

  if (existingEnrollment) {
    if (!existingEnrollment.active) {
      const { error: reactivateError } = await supabase
        .from("batch_enrollments")
        .update({ active: true })
        .eq("id", existingEnrollment.id);
      if (reactivateError) throw new Error(reactivateError.message);
    }
    const { data: row } = await supabase
      .from("batch_enrollments")
      .select("id, enrollment_code")
      .eq("id", existingEnrollment.id)
      .single();
    if (!row) throw new Error("Enrollment not found");
    enrollmentId = row.id;
    enrollmentCode = row.enrollment_code;
  } else {
    const result = await enrollStudentInBatch(batchId, studentId);
    enrollmentId = result.id;
    enrollmentCode = result.enrollmentCode;
  }

  const previousCourseId = student.course_id;
  const { error: studentError } = await supabase
    .from("students")
    .update({ course_id: courseId, course_name: courseName })
    .eq("id", studentId);
  if (studentError) throw new Error(studentError.message);

  await adjustCourseStudentCounts(supabase, previousCourseId, courseId);

  if (options?.deactivateOtherCourses) {
    const { data: otherEnrollments } = await supabase
      .from("batch_enrollments")
      .select("id, batch_id, course_batches!inner(course_id)")
      .eq("student_id", studentId)
      .eq("active", true)
      .neq("id", enrollmentId);

    for (const enrollment of otherEnrollments ?? []) {
      const batchInfoRaw = enrollment.course_batches as unknown;
      const batchInfo = (Array.isArray(batchInfoRaw) ? batchInfoRaw[0] : batchInfoRaw) as {
        course_id: string;
      } | null;
      if (batchInfo?.course_id !== courseId) {
        await supabase
          .from("batch_enrollments")
          .update({ active: false })
          .eq("id", enrollment.id);
      }
    }
  }

  revalidateAcademicsPaths();
  return { enrollmentId, enrollmentCode, courseId, courseName };
}

export async function enrollStudentsInCourse(
  batchId: string,
  studentIds: string[],
  options?: { deactivateOtherCourses?: boolean }
) {
  await requireAcademicsStaff();
  const uniqueIds = [...new Set(studentIds.filter(Boolean))];
  if (!uniqueIds.length) throw new Error("Select at least one student");

  let enrolled = 0;
  const errors: string[] = [];

  for (const studentId of uniqueIds) {
    try {
      await enrollStudentInCourse(batchId, studentId, options);
      enrolled += 1;
    } catch (e) {
      errors.push(e instanceof Error ? e.message : "Enrollment failed");
    }
  }

  if (enrolled === 0) {
    throw new Error(errors[0] ?? "No students were enrolled");
  }

  return { enrolled, failed: uniqueIds.length - enrolled, errors };
}

export async function setStudentPrimaryCourse(studentId: string, courseId: string) {
  await requireAcademicsStaff();
  const supabase = await createClient();

  const hasEnrollment = await studentHasActiveBatchForCourse(supabase, studentId, courseId);
  if (!hasEnrollment) {
    throw new Error("Student is not enrolled in an active batch for this course");
  }

  const { data: course } = await supabase
    .from("courses")
    .select("name")
    .eq("id", courseId)
    .maybeSingle();
  if (!course) throw new Error("Course not found");

  const { data: student } = await supabase
    .from("students")
    .select("course_id")
    .eq("id", studentId)
    .maybeSingle();
  if (!student) throw new Error("Student not found");

  const { error } = await supabase
    .from("students")
    .update({ course_id: courseId, course_name: course.name })
    .eq("id", studentId);
  if (error) throw new Error(error.message);

  await adjustCourseStudentCounts(supabase, student.course_id, courseId);
  revalidateAcademicsPaths();
}

export async function setStudentActiveCourse(courseId: string) {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "student") {
    throw new Error("Unauthorized: student access required");
  }

  const supabase = await createClient();
  const { data: student } = await supabase
    .from("students")
    .select("id, course_id")
    .eq("user_id", profile.id)
    .maybeSingle();
  if (!student) throw new Error("Student profile not found");

  const hasEnrollment = await studentHasActiveBatchForCourse(supabase, student.id, courseId);
  if (!hasEnrollment) {
    throw new Error("You are not enrolled in this course");
  }

  const { data: course } = await supabase
    .from("courses")
    .select("name")
    .eq("id", courseId)
    .maybeSingle();
  if (!course) throw new Error("Course not found");

  const { error } = await supabase
    .from("students")
    .update({ course_id: courseId, course_name: course.name })
    .eq("id", student.id);
  if (error) throw new Error(error.message);

  await adjustCourseStudentCounts(supabase, student.course_id, courseId);
  revalidateStudentPortalPaths();
}

export async function regenerateClassSessions(batchId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { data: sessions } = await supabase
    .from("class_sessions")
    .select("id")
    .eq("batch_id", batchId);

  if (sessions?.length) {
    const sessionIds = sessions.map((s) => s.id);
    const { count } = await supabase
      .from("attendance_records")
      .select("id", { count: "exact", head: true })
      .in("session_id", sessionIds);

    if ((count ?? 0) > 0) {
      throw new Error("Cannot regenerate sessions while attendance records exist");
    }

    const { error: deleteError } = await supabase
      .from("class_sessions")
      .delete()
      .eq("batch_id", batchId);
    if (deleteError) throw new Error(deleteError.message);
  }

  return generateClassSessions(batchId);
}

export async function markAttendance(
  sessionId: string,
  records: { studentId: string; status: AttendanceStatus }[]
) {
  const profile = await requireAcademicsStaff();
  const supabase = await createClient();

  if (!records.length) throw new Error("No attendance records provided");

  const { data: existing } = await supabase
    .from("attendance_records")
    .select("student_id, status")
    .eq("session_id", sessionId);

  const previousByStudent = new Map(
    (existing ?? []).map((r) => [r.student_id, r.status as AttendanceStatus])
  );

  const rows = records.map((r) => ({
    session_id: sessionId,
    student_id: r.studentId,
    status: r.status,
    marked_by: profile.id,
    marked_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("attendance_records")
    .upsert(rows, { onConflict: "session_id,student_id" });
  if (error) throw new Error(error.message);

  const newlyAbsent = records.filter((r) => {
    if (r.status !== "absent") return false;
    const prev = previousByStudent.get(r.studentId);
    return prev !== "absent";
  });

  if (newlyAbsent.length > 0) {
    const { data: sessionRow } = await supabase
      .from("class_sessions")
      .select("session_number, scheduled_date, batch_id, course_batches(name)")
      .eq("id", sessionId)
      .maybeSingle();

    if (sessionRow?.batch_id) {
      const batchRaw = sessionRow.course_batches as unknown;
      const batch = (Array.isArray(batchRaw) ? batchRaw[0] : batchRaw) as { name: string } | null;
      try {
        await notifyAbsentStudents({
          batchId: sessionRow.batch_id,
          sessionId,
          batchName: batch?.name ?? "Your batch",
          classDate: sessionRow.scheduled_date,
          classNumber: sessionRow.session_number,
          studentIds: newlyAbsent.map((r) => r.studentId),
          sentBy: profile.id,
        });
      } catch (notifyError) {
        console.error("Absent notification failed:", notifyError);
      }
    }
  }

  // DB trigger syncs session_charges; re-sync here as a safety net for edge cases.
  const { syncChargesForSession } = await import("@/lib/billing/session-charges");
  await syncChargesForSession(supabase, sessionId, records);

  revalidateAcademicsPaths();
  revalidatePath("/admin/finance");
  revalidatePath("/admin/finance/students");
  revalidatePath("/admin/finance/ledger");
}

export async function updateStudent(
  studentId: string,
  data: {
    displayName?: string;
    email?: string;
    courseId?: string;
    courseName?: string;
    whatsapp?: string;
    schoolName?: string;
    nicNumber?: string;
    examYear?: string;
    ictGrade?: string;
  }
) {
  await requireAcademicsStaff();
  const supabase = await createClient();

  const { data: before } = await supabase
    .from("students")
    .select("course_id, user_id")
    .eq("id", studentId)
    .maybeSingle();
  if (!before) throw new Error("Student not found");

  if (data.whatsapp !== undefined) {
    const whatsappError = validateSriLankaWhatsApp(data.whatsapp);
    if (whatsappError) throw new Error(whatsappError);
  }

  if (data.schoolName !== undefined) {
    const schoolName = data.schoolName.trim();
    if (schoolName.length < 2) throw new Error("School name is required");
  }

  let normalizedNic: string | null | undefined;
  if (data.nicNumber !== undefined) {
    const nicRaw = data.nicNumber.trim();
    if (!nicRaw) {
      normalizedNic = null;
    } else {
      normalizedNic = normalizeNic(nicRaw);
      if (!isValidNic(normalizedNic)) {
        throw new Error("Enter a valid NIC number (e.g. 123456789V or 200012345678)");
      }
      const { data: byNic } = await supabase
        .from("students")
        .select("id")
        .eq("nic_number", normalizedNic)
        .neq("id", studentId)
        .maybeSingle();
      if (byNic) throw new Error("This NIC number is already registered.");
    }
  }

  const updates: Record<string, unknown> = {};
  if (data.displayName !== undefined) updates.display_name = data.displayName.trim();
  if (data.email !== undefined) updates.email = data.email.trim().toLowerCase();
  if (data.courseId !== undefined) updates.course_id = data.courseId;
  if (data.courseName !== undefined) updates.course_name = data.courseName;
  if (data.whatsapp !== undefined) {
    updates.phone = normalizeSriLankaWhatsApp(data.whatsapp);
  }
  if (data.schoolName !== undefined) updates.school_name = data.schoolName.trim();
  if (normalizedNic !== undefined) updates.nic_number = normalizedNic;
  if (data.examYear !== undefined) updates.exam_year = data.examYear;
  if (data.ictGrade !== undefined) updates.ict_grade = data.ictGrade;

  const { error } = await supabase.from("students").update(updates).eq("id", studentId);
  if (error) throw new Error(error.message);

  if (data.courseId !== undefined && data.courseId !== before.course_id) {
    await adjustCourseStudentCounts(supabase, before.course_id, data.courseId);
  }

  revalidateAcademicsPaths();
}

export async function setStudentActive(studentId: string, active: boolean) {
  await requireAdmin();
  const supabase = await createClient();

  const { data: student, error } = await supabase
    .from("students")
    .update({
      active,
      disabled_at: active ? null : new Date().toISOString(),
    })
    .eq("id", studentId)
    .select("user_id")
    .single();

  if (error) throw new Error(error.message);

  if (!isAdminClientConfigured()) {
    if (!active) {
      throw new Error("Cannot deactivate student: auth service is not configured.");
    }
  } else {
    const admin = createAdminClient();
    const { error: banError } = await admin.auth.admin.updateUserById(student.user_id, {
      ban_duration: active ? "none" : "876000h",
    });
    if (banError) {
      throw new Error(active ? "Failed to restore student login access." : "Failed to revoke student login access.");
    }
  }

  revalidateAcademicsPaths();
}

export async function transferStudentBatch(enrollmentId: string, targetBatchId: string) {
  await requireAcademicsStaff();
  const supabase = await createClient();

  const { data: enrollment } = await supabase
    .from("batch_enrollments")
    .select("id, student_id, batch_id, active")
    .eq("id", enrollmentId)
    .maybeSingle();
  if (!enrollment) throw new Error("Enrollment not found");

  const { data: targetBatch } = await supabase
    .from("course_batches")
    .select("id, batch_code, active, course_id")
    .eq("id", targetBatchId)
    .maybeSingle();
  if (!targetBatch) throw new Error("Target batch not found");
  if (!targetBatch.active) throw new Error("Cannot transfer to an inactive batch");

  const { data: sourceBatch } = await supabase
    .from("course_batches")
    .select("course_id")
    .eq("id", enrollment.batch_id)
    .maybeSingle();
  if (sourceBatch?.course_id !== targetBatch.course_id) {
    throw new Error("Target batch must belong to the same course");
  }
  if (enrollment.batch_id === targetBatchId) {
    throw new Error("Student is already in this batch");
  }

  await supabase.from("batch_enrollments").update({ active: false }).eq("id", enrollmentId);

  const { data: existingTarget } = await supabase
    .from("batch_enrollments")
    .select("id, active")
    .eq("batch_id", targetBatchId)
    .eq("student_id", enrollment.student_id)
    .maybeSingle();

  if (existingTarget) {
    const { error } = await supabase
      .from("batch_enrollments")
      .update({ active: true })
      .eq("id", existingTarget.id);
    if (error) throw new Error(error.message);
  } else {
    const enrollmentCode = await nextEnrollmentCode(targetBatch.batch_code);
    const { error } = await supabase.from("batch_enrollments").insert({
      batch_id: targetBatchId,
      student_id: enrollment.student_id,
      enrollment_code: enrollmentCode,
    });
    if (error) throw new Error(error.message);
  }

  revalidateAcademicsPaths();
}

export type CourseBatchPair = { courseId: string; batchId: string };

export async function enrollStudentInCourses(
  studentId: string,
  pairs: CourseBatchPair[],
  options?: { setPrimaryCourseId?: string }
) {
  await requireAcademicsStaff();
  if (!pairs.length) throw new Error("Select at least one course");

  const uniquePairs = pairs.filter(
    (p, i, arr) => arr.findIndex((x) => x.courseId === p.courseId) === i
  );

  for (const { batchId } of uniquePairs) {
    await enrollStudentInCourse(batchId, studentId);
  }

  if (options?.setPrimaryCourseId) {
    await setStudentPrimaryCourse(studentId, options.setPrimaryCourseId);
  }

  return { enrolled: uniquePairs.length };
}

export async function approveStudentRegistration(
  studentId: string,
  batchSelections?: CourseBatchPair[]
) {
  const profile = await requireAdmin();
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select(
      "id, course_id, exam_year, ict_grade, registration_status, display_name, email, student_id, course_name, phone, username, index_number"
    )
    .eq("id", studentId)
    .maybeSingle();
  if (!student) throw new Error("Student not found");
  if (student.registration_status === "approved") {
    throw new Error("Registration is already approved");
  }

  const admin = isAdminClientConfigured() ? createAdminClient() : supabase;

  if (batchSelections?.length) {
    for (const { batchId } of batchSelections) {
      await enrollStudentInCourse(batchId, studentId);
    }
  } else if (student.course_id) {
    const { autoEnrollStudentForAdmin } = await import("@/lib/academics/registration-enrollment");
    await autoEnrollStudentForAdmin(admin, studentId, student.course_id, undefined, {
      examYear: student.exam_year,
      ictGrade: student.ict_grade,
      studyTrack: student.exam_year ? "al" : student.ict_grade ? "grade" : undefined,
    });
  }

  const { error } = await supabase
    .from("students")
    .update({
      registration_status: "approved",
      registration_reviewed_at: new Date().toISOString(),
      registration_reviewed_by: profile.id,
      active: true,
      disabled_at: null,
    })
    .eq("id", studentId);
  if (error) throw new Error(error.message);

  try {
    await sendStudentWelcomeEmail({
      displayName: student.display_name,
      studentId: student.student_id,
      username: student.username ?? undefined,
      indexNumber: student.index_number ?? undefined,
      email: student.email,
      courseName: student.course_name ?? "ICT Program",
      examYear: student.exam_year ?? undefined,
      ictGrade: student.ict_grade ?? undefined,
      selfRegistered: true,
      registrationApproved: true,
    });

    const normalizedPhone = student.phone ? normalizeSriLankaWhatsApp(student.phone) : null;
    if (normalizedPhone) {
      await sendStudentWelcomeWhatsApp({
        phone: normalizedPhone,
        displayName: student.display_name,
        studentId: student.student_id,
        username: student.username ?? undefined,
        indexNumber: student.index_number ?? undefined,
        courseName: student.course_name ?? "ICT Program",
        loginUrl: `${getAppUrl()}/login`,
        selfRegistered: true,
      });
    }
  } catch (notifyError) {
    console.error("[approveStudentRegistration] Welcome notification failed:", notifyError);
  }

  revalidateAcademicsPaths();
  return { approved: true };
}

export async function rejectStudentRegistration(studentId: string, reason?: string) {
  const profile = await requireAdmin();
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("id, registration_status")
    .eq("id", studentId)
    .maybeSingle();
  if (!student) throw new Error("Student not found");

  const { error } = await supabase
    .from("students")
    .update({
      registration_status: "rejected",
      registration_reviewed_at: new Date().toISOString(),
      registration_reviewed_by: profile.id,
      active: false,
      disabled_at: new Date().toISOString(),
    })
    .eq("id", studentId);
  if (error) throw new Error(error.message);

  if (reason?.trim()) {
    console.info(`Registration rejected for ${studentId}: ${reason.trim()}`);
  }

  revalidateAcademicsPaths();
  return { rejected: true };
}
