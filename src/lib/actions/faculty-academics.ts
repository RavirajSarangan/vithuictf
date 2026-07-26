"use server";

// Faculty portal clone of the batch/enrollment/class-session backbone in
// src/lib/actions/academics.ts. Every query targets the faculty_* tables
// (faculty_batches, faculty_batch_enrollments, faculty_class_sessions)
// instead of their teacher-side equivalents, and every gate is
// requireFacultyStaff() instead of requireAcademicsStaff()/requireStaff().
// RLS (faculty_can_access_course/batch/session, see the
// 20260726091000_faculty_academics_batches.sql migration) does the actual
// per-staff scoping; these actions just need to target the right tables.
//
// Deliberately NOT cloned (out of scope for this phase — see the Phase 3
// brief): updateStudent, setStudentActive, enrollStudentInCourse(s),
// setStudentPrimaryCourse, setStudentActiveCourse, transferStudentBatch,
// approveStudentRegistration, rejectStudentRegistration. These either belong
// to later phases or operate on the shared/global `students` table fields
// (course_id/course_name) that aren't part of the faculty-scoped data model.
//
// markFacultyAttendance (Phase 4) IS cloned below — see its own comment for
// the faculty-specific deviations (billing sync skipped, notifications
// scoped to faculty_batch_enrollments).

import { createClient } from "@/lib/supabase/server";
import { requireAdmin, requireFacultyFeatureAccess, requireFacultyStaff } from "@/lib/actions/auth";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import { getActionFailureMessage, runDataAction, type DataActionResult } from "@/lib/actions/action-result";
import { safeRevalidatePath } from "@/lib/safe-revalidate";
import { revalidateStudentPortalPaths } from "@/lib/revalidation-paths";
import { validateCanvaSlideUrl } from "@/lib/canva/url";
import type { AttendanceStatus, ClassSessionStatus } from "@/types";
import { normalizeSriLankaWhatsApp } from "@/lib/validation/sri-lanka-phone";
import { sendWhatsAppBatch, sendWhatsAppTemplate } from "@/lib/whatsapp/client";
import type { DeliverySummary } from "@/lib/academics/batch-notifications";
import {
  buildSessionScheduleFromRow,
  computeTotalClasses,
  countClassDaysInRange,
  deriveEndDateFromCount,
} from "@/lib/academics/schedule";

function revalidateFacultyAcademicsPaths() {
  safeRevalidatePath("/faculty/dashboard");
  safeRevalidatePath("/faculty/enrollments");
  safeRevalidatePath("/faculty/students");
  safeRevalidatePath("/faculty/attendance");
  revalidateStudentPortalPaths();
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

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
    .from("faculty_batches")
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
  await requireFacultyStaff();
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
  await requireFacultyStaff();
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
    .from("faculty_batch_enrollments")
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
    .from("faculty_batches")
    .select("start_date, end_date, start_time, end_time, class_days, total_classes, zoom_link")
    .eq("id", batchId)
    .maybeSingle();
  if (!batch) throw new Error("Batch not found");

  const targetSessions = buildSessionSchedule(batch);
  if (targetSessions.length === 0) {
    throw new Error("No class sessions could be scheduled with the selected days and date range");
  }

  const { data: existing } = await supabase
    .from("faculty_class_sessions")
    .select("id, session_number, scheduled_date, start_time, end_time, status")
    .eq("batch_id", batchId)
    .order("session_number");

  const existingSessions = existing ?? [];
  const existingSessionIds = existingSessions.map((s) => s.id);

  // Mirrors the teacher-side guard: sessions with recorded attendance keep
  // their scheduled_date and are never deleted by the resync below.
  let sessionsWithAttendance = new Set<string>();
  if (existingSessionIds.length) {
    const { data: attendanceRows } = await supabase
      .from("faculty_attendance_records")
      .select("session_id")
      .in("session_id", existingSessionIds);
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
      const { error } = await supabase.from("faculty_class_sessions").update(updates).eq("id", current.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("faculty_class_sessions").insert({
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
    const { error } = await supabase.from("faculty_class_sessions").delete().eq("id", current.id);
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
  /** Optional explicit end date. When omitted it is derived from startDate + totalClasses. */
  endDate?: string;
  startTime: string;
  endTime: string;
  classDays: string[];
  totalClasses?: number;
  zoomLink?: string;
  studentIds?: string[];
}): Promise<
  DataActionResult<{
    id: string;
    batchCode: string;
    sessionsCreated: number;
    enrolled: number;
  }>
> {
  return runDataAction(async () => {
    const profile = await requireFacultyStaff();
    if (!data.name.trim()) throw new Error("Batch name is required");
    if (!data.classDays.length) throw new Error("Select at least one class day");

    const requestedTotal = data.totalClasses ?? 10;
    const endDate =
      data.endDate ??
      deriveEndDateFromCount({
        startDate: data.startDate,
        classDays: data.classDays,
        totalClasses: requestedTotal,
      });
    if (!endDate) {
      throw new Error("Could not schedule classes — select at least one class day");
    }

    const start = parseDateOnly(data.startDate);
    const end = parseDateOnly(endDate);
    if (end < start) throw new Error("End date must be on or after start date");

    const totalClasses = computeTotalClasses({
      startDate: data.startDate,
      endDate,
      startTime: data.startTime,
      endTime: data.endTime,
      classDays: data.classDays,
      totalClasses: data.totalClasses,
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
      .from("faculty_batches")
      .insert({
        course_id: data.courseId,
        name: data.name.trim(),
        batch_code: batchCode,
        start_date: data.startDate,
        end_date: endDate,
        start_time: data.startTime,
        end_time: data.endTime,
        class_days: data.classDays,
        total_classes: totalClasses,
        zoom_link: zoomLink,
        created_by: profile.id,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message || "Failed to create batch");

    const sessionResult = await generateClassSessions(batch.id, { skipRevalidate: true });
    let enrolled = 0;
    if (data.studentIds?.length) {
      // Unlike the teacher-side createBatch, there's no setAsCurrentCourse
      // path here — enrollStudentInCourse (which writes students.course_id)
      // isn't cloned for faculty this phase, so faculty batch enrollment
      // never touches the student's global primary course.
      const result = await enrollStudentsInBatch(batch.id, data.studentIds, { skipRevalidate: true });
      enrolled = result.enrolled;
    }

    revalidateFacultyAcademicsPaths();
    return {
      id: batch.id,
      batchCode,
      sessionsCreated: sessionResult.created,
      enrolled,
    };
  }, "Failed to create batch");
}

/**
 * Resolve the single batch for a course, creating a sensible default one if
 * none exists yet. Enforces the "one batch per course" model at the app layer.
 */
export async function getOrCreateCourseBatch(
  courseId: string
): Promise<DataActionResult<{ batchId: string; created: boolean }>> {
  return runDataAction(async () => {
    await requireFacultyStaff();
    const supabase = await createClient();

    const { data: existing } = await supabase
      .from("faculty_batches")
      .select("id, active, created_at")
      .eq("course_id", courseId)
      .order("active", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (existing) return { batchId: existing.id, created: false };

    const { data: course } = await supabase
      .from("courses")
      .select("name")
      .eq("id", courseId)
      .maybeSingle();
    if (!course) throw new Error("Course not found");

    const today = new Date();
    const startDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
      today.getDate()
    ).padStart(2, "0")}`;

    const result = await createBatch({
      courseId,
      name: course.name,
      startDate,
      startTime: "09:00",
      endTime: "12:00",
      classDays: ["mon", "wed", "fri"],
      totalClasses: 10,
    });
    if (!result.ok) throw new Error(result.error);
    return { batchId: result.data.id, created: true };
  }, "Failed to resolve course batch");
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
  await requireFacultyStaff();
  const supabase = await createClient();

  const { data: before } = await supabase
    .from("faculty_batches")
    .select("start_date, end_date, start_time, end_time, class_days, total_classes")
    .eq("id", batchId)
    .maybeSingle();
  if (!before) throw new Error("Batch not found");

  const nextStart = data.startDate ?? before.start_date;
  const nextClassDays = data.classDays ?? before.class_days;
  const nextStartTime = data.startTime ?? before.start_time;
  const nextEndTime = data.endTime ?? before.end_time;

  const scheduleChanged =
    data.startDate !== undefined ||
    data.endDate !== undefined ||
    data.classDays !== undefined ||
    data.startTime !== undefined ||
    data.endTime !== undefined ||
    data.totalClasses !== undefined;

  let computedTotal = before.total_classes;
  let nextEnd = data.endDate ?? before.end_date;
  if (scheduleChanged) {
    const requestedTotal = data.totalClasses ?? before.total_classes;
    if (data.endDate === undefined) {
      const derived = deriveEndDateFromCount({
        startDate: nextStart,
        classDays: nextClassDays,
        totalClasses: requestedTotal,
      });
      if (!derived) {
        throw new Error("Select at least one class day for the schedule");
      }
      nextEnd = derived;
    }
    computedTotal = computeTotalClasses({
      startDate: nextStart,
      endDate: nextEnd,
      startTime: nextStartTime,
      endTime: nextEndTime,
      classDays: nextClassDays,
      totalClasses: requestedTotal,
    });
    if (computedTotal === 0) {
      throw new Error("No class days in the selected date range");
    }
  }

  const updates: Record<string, unknown> = {};
  if (data.name !== undefined) updates.name = data.name.trim();
  if (data.startDate !== undefined) updates.start_date = data.startDate;
  if (data.startTime !== undefined) updates.start_time = data.startTime;
  if (data.endTime !== undefined) updates.end_time = data.endTime;
  if (data.classDays !== undefined) updates.class_days = data.classDays;
  if (scheduleChanged) {
    updates.end_date = nextEnd;
    updates.total_classes = computedTotal;
  }
  if (data.active !== undefined) updates.active = data.active;
  if (data.zoomLink !== undefined) updates.zoom_link = data.zoomLink.trim() || null;

  const { error } = await supabase.from("faculty_batches").update(updates).eq("id", batchId);
  if (error) throw new Error(error.message);

  let syncResult: { synced: number; preservedWithAttendance: number } | null = null;
  if (scheduleFieldsChanged(before, { ...data, endDate: nextEnd, totalClasses: computedTotal })) {
    syncResult = await syncClassSessionsToSchedule(batchId);
  }

  if (data.zoomLink !== undefined) {
    await supabase
      .from("faculty_class_sessions")
      .update({ zoom_link: data.zoomLink.trim() || null })
      .eq("batch_id", batchId)
      .eq("status", "scheduled");
  }

  revalidateFacultyAcademicsPaths();
  return syncResult;
}

export async function archiveBatch(batchId: string) {
  await updateBatchSchedule(batchId, { active: false });
}

export async function generateClassSessions(
  batchId: string,
  options?: { skipRevalidate?: boolean }
) {
  await requireFacultyStaff();
  const supabase = await createClient();

  const { data: batch } = await supabase
    .from("faculty_batches")
    .select("*")
    .eq("id", batchId)
    .maybeSingle();
  if (!batch) throw new Error("Batch not found");

  const { count } = await supabase
    .from("faculty_class_sessions")
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

  const { error } = await supabase.from("faculty_class_sessions").insert(sessions);
  if (error) throw new Error(error.message || "Failed to create class sessions");

  if (!options?.skipRevalidate) {
    revalidateFacultyAcademicsPaths();
  }
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
  await requireFacultyStaff();
  const supabase = await createClient();
  const updates: Record<string, unknown> = {};
  if (data.scheduledDate !== undefined) updates.scheduled_date = data.scheduledDate;
  if (data.startTime !== undefined) updates.start_time = data.startTime;
  if (data.endTime !== undefined) updates.end_time = data.endTime;
  if (data.status !== undefined) updates.status = data.status;
  if (data.zoomLink !== undefined) updates.zoom_link = data.zoomLink.trim() || null;

  const { error } = await supabase.from("faculty_class_sessions").update(updates).eq("id", sessionId);
  if (error) throw new Error(error.message);
  revalidateFacultyAcademicsPaths();
}

export async function updateSessionCanvaSlide(
  sessionId: string,
  data: { url: string; title?: string }
) {
  await requireFacultyStaff();
  const canvaSlideUrl = validateCanvaSlideUrl(data.url);
  const canvaSlideTitle = data.title?.trim() || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("faculty_class_sessions")
    .update({
      canva_slide_url: canvaSlideUrl,
      canva_slide_title: canvaSlideTitle,
    })
    .eq("id", sessionId);
  if (error) throw new Error(error.message);
  revalidateFacultyAcademicsPaths();
}

export async function clearSessionCanvaSlide(sessionId: string) {
  await requireFacultyStaff();
  const supabase = await createClient();
  const { error } = await supabase
    .from("faculty_class_sessions")
    .update({
      canva_slide_url: null,
      canva_slide_title: null,
    })
    .eq("id", sessionId);
  if (error) throw new Error(error.message);
  revalidateFacultyAcademicsPaths();
}

// Faculty batches don't yet have a dedicated WhatsApp delivery log table —
// batch_whatsapp_log's batch_id/session_id foreign keys point at
// course_batches/class_sessions, so faculty ids can't be logged there without
// violating the FK. Portal notifications still go out; a faculty-scoped log
// table is left for a future phase if delivery auditing is needed.
async function notifyFacultyBatchStudentsPortal(
  supabase: SupabaseServerClient,
  batchId: string,
  title: string,
  body: string,
  metadata?: Record<string, unknown>,
  /** Restrict to specific enrolled students (e.g. only newly-absent ones for
   * markFacultyAttendance) instead of the whole active batch roster. */
  studentIds?: string[]
): Promise<number> {
  const { data: enrollments } = await supabase
    .from("faculty_batch_enrollments")
    .select("student_id, students(user_id)")
    .eq("batch_id", batchId)
    .eq("active", true);

  const filterSet = studentIds ? new Set(studentIds) : null;
  const userIds: string[] = [];
  for (const row of enrollments ?? []) {
    if (filterSet && !filterSet.has(row.student_id)) continue;
    const studentRaw = row.students as unknown;
    const student = (Array.isArray(studentRaw) ? studentRaw[0] : studentRaw) as { user_id: string } | null;
    if (student?.user_id) userIds.push(student.user_id);
  }
  if (!userIds.length) return 0;

  const rows = userIds.map((userId) => ({
    user_id: userId,
    title,
    body,
    type: "class" as const,
    metadata: metadata ?? null,
  }));

  // Mirrors insertPortalNotifications in lib/academics/batch-notifications.ts:
  // use the admin client when configured so this insert isn't blocked by the
  // notifications table's staff-role RLS check (which doesn't list
  // faculty_staff — see the migration comment for why that wasn't widened).
  const notifyClient = isAdminClientConfigured() ? createAdminClient() : supabase;
  const { error } = await notifyClient.from("notifications").insert(rows);
  if (error) throw new Error(error.message);
  return rows.length;
}

export async function cancelClassSession(sessionId: string, reason: string) {
  const profile = await requireFacultyStaff();
  const supabase = await createClient();
  const trimmed = reason.trim();
  if (!trimmed) throw new Error("Cancel message is required");

  const { data: session } = await supabase
    .from("faculty_class_sessions")
    .select("id, batch_id, session_number, scheduled_date, start_time, status")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) throw new Error("Session not found");
  if (session.status === "cancelled") throw new Error("Session is already cancelled");

  const { data: batch } = await supabase
    .from("faculty_batches")
    .select("name, batch_code")
    .eq("id", session.batch_id)
    .maybeSingle();

  const { error } = await supabase
    .from("faculty_class_sessions")
    .update({
      status: "cancelled",
      cancel_reason: trimmed,
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", sessionId);
  if (error) throw new Error(error.message);

  const title = `Class cancelled — ${batch?.name ?? "Batch"}`;
  const body = `Class ${session.session_number} on ${session.scheduled_date} (${session.start_time.slice(0, 5)}) is cancelled. ${trimmed}`;

  await notifyFacultyBatchStudentsPortal(supabase, session.batch_id, title, body, {
    sessionId,
    batchId: session.batch_id,
    batchCode: batch?.batch_code,
    kind: "class_cancel",
  });

  revalidateFacultyAcademicsPaths();
  return { notifiedBy: profile.id };
}

export async function sendBatchMessage(
  batchId: string,
  input: { title: string; body: string; sendPortal: boolean; sendWhatsApp: boolean }
): Promise<DeliverySummary> {
  await requireFacultyStaff();
  const supabase = await createClient();
  const summary: DeliverySummary = {
    portalSent: 0,
    whatsappSent: 0,
    whatsappSkipped: 0,
    whatsappFailed: 0,
  };

  if (input.sendPortal) {
    summary.portalSent = await notifyFacultyBatchStudentsPortal(supabase, batchId, input.title, input.body, {
      batchId,
      kind: "manual_batch",
    });
  }

  if (input.sendWhatsApp) {
    const { data: enrollments } = await supabase
      .from("faculty_batch_enrollments")
      .select("students(display_name, phone, notify_whatsapp)")
      .eq("batch_id", batchId)
      .eq("active", true);

    const recipients = (enrollments ?? [])
      .map((row) => {
        const studentRaw = row.students as unknown;
        return (Array.isArray(studentRaw) ? studentRaw[0] : studentRaw) as {
          display_name: string;
          phone: string | null;
          notify_whatsapp: boolean;
        } | null;
      })
      .filter((s): s is { display_name: string; phone: string | null; notify_whatsapp: boolean } => Boolean(s));

    // See notifyFacultyBatchStudentsPortal above — WhatsApp sends here are
    // not persisted to batch_whatsapp_log (its FKs target the teacher-side
    // tables), so delivery isn't auditable from the DB yet. Best-effort send
    // only, matching the summary counts returned to the caller.
    await sendWhatsAppBatch(recipients, async (recipient) => {
      const normalized = recipient.phone ? normalizeSriLankaWhatsApp(recipient.phone) : null;
      if (recipient.notify_whatsapp === false || !normalized) {
        summary.whatsappSkipped += 1;
        return;
      }

      const result = await sendWhatsAppTemplate({
        to: normalized,
        template: "announcement",
        variables: { title: input.title, body: input.body, studentName: recipient.display_name },
      });

      if (result.ok) summary.whatsappSent += 1;
      else if (result.skipped) summary.whatsappSkipped += 1;
      else summary.whatsappFailed += 1;
    });
  }

  revalidateFacultyAcademicsPaths();
  return summary;
}

export async function enrollStudentInBatch(
  batchId: string,
  studentId: string,
  options?: { skipRevalidate?: boolean }
) {
  await requireFacultyStaff();
  const supabase = await createClient();

  const { data: batch } = await supabase
    .from("faculty_batches")
    .select("batch_code, active")
    .eq("id", batchId)
    .maybeSingle();
  if (!batch) throw new Error("Batch not found");
  if (!batch.active) throw new Error("Cannot enroll in an inactive batch");

  const enrollmentCode = await nextEnrollmentCode(batch.batch_code);

  const { data, error } = await supabase
    .from("faculty_batch_enrollments")
    .insert({
      batch_id: batchId,
      student_id: studentId,
      enrollment_code: enrollmentCode,
    })
    .select("id, enrollment_code")
    .single();

  if (error) {
    if (error.code === "23505") throw new Error("Student is already enrolled in this batch");
    throw new Error(error.message || "Failed to enroll student");
  }

  if (!options?.skipRevalidate) {
    revalidateFacultyAcademicsPaths();
  }
  return { id: data.id, enrollmentCode: data.enrollment_code };
}

export async function removeStudentFromBatch(enrollmentId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("faculty_batch_enrollments").delete().eq("id", enrollmentId);
  if (error) throw new Error(error.message);
  revalidateFacultyAcademicsPaths();
}

export async function setEnrollmentActive(enrollmentId: string, active: boolean) {
  await requireFacultyStaff();
  const supabase = await createClient();
  const { error } = await supabase
    .from("faculty_batch_enrollments")
    .update({ active })
    .eq("id", enrollmentId);
  if (error) throw new Error(error.message);
  revalidateFacultyAcademicsPaths();
}

export async function enrollStudentsInBatch(
  batchId: string,
  studentIds: string[],
  options?: { skipRevalidate?: boolean }
) {
  await requireFacultyStaff();
  const uniqueIds = [...new Set(studentIds.filter(Boolean))];
  if (!uniqueIds.length) throw new Error("Select at least one student");

  let enrolled = 0;
  const errors: string[] = [];

  for (const studentId of uniqueIds) {
    try {
      await enrollStudentInBatch(batchId, studentId, { skipRevalidate: true });
      enrolled += 1;
    } catch (e) {
      errors.push(getActionFailureMessage(e, "Enrollment failed"));
    }
  }

  if (enrolled === 0) {
    throw new Error(errors[0] ?? "No students were enrolled");
  }

  if (!options?.skipRevalidate) {
    revalidateFacultyAcademicsPaths();
  }

  return { enrolled, failed: uniqueIds.length - enrolled, errors };
}

export async function regenerateClassSessions(batchId: string) {
  await requireAdmin();
  const supabase = await createClient();

  // Mirrors the teacher-side regenerateClassSessions: refuse to delete
  // sessions once faculty_attendance_records exist for them.
  const { data: sessions } = await supabase
    .from("faculty_class_sessions")
    .select("id")
    .eq("batch_id", batchId);

  if (sessions?.length) {
    const sessionIds = sessions.map((s) => s.id);
    const { count } = await supabase
      .from("faculty_attendance_records")
      .select("id", { count: "exact", head: true })
      .in("session_id", sessionIds);

    if ((count ?? 0) > 0) {
      throw new Error("Cannot regenerate sessions while attendance records exist");
    }

    const { error: deleteError } = await supabase
      .from("faculty_class_sessions")
      .delete()
      .eq("batch_id", batchId);
    if (deleteError) throw new Error(deleteError.message);
  }

  return generateClassSessions(batchId);
}

/**
 * Faculty portal equivalent of markAttendance (src/lib/actions/academics.ts
 * ~L1069). Writes to faculty_attendance_records instead of attendance_records
 * and notifies via notifyFacultyBatchStudentsPortal (faculty_batch_enrollments)
 * instead of notifyAbsentStudents (which is hardcoded to the teacher-side
 * batch_enrollments table and would silently find zero recipients for a
 * faculty batch).
 *
 * Judgment call: the teacher-side markAttendance also calls
 * syncChargesForSession to keep public.session_charges in sync with
 * attendance. session_charges' FKs point at class_sessions/course_batches
 * (teacher-side only), so calling it with a faculty_class_sessions id would
 * violate those FKs. Faculty billing is out of scope for this build, so that
 * sync is intentionally skipped — a faculty_session_charges table + its own
 * sync helper would be the right follow-up if faculty billing is ever added.
 */
export async function markFacultyAttendance(
  sessionId: string,
  records: { studentId: string; status: AttendanceStatus }[]
) {
  const profile = await requireFacultyFeatureAccess("attendance_students");
  const supabase = await createClient();

  if (!records.length) throw new Error("No attendance records provided");

  const { data: existing } = await supabase
    .from("faculty_attendance_records")
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
    .from("faculty_attendance_records")
    .upsert(rows, { onConflict: "session_id,student_id" });
  if (error) throw new Error(error.message);

  const newlyAbsent = records.filter((r) => {
    if (r.status !== "absent") return false;
    const prev = previousByStudent.get(r.studentId);
    return prev !== "absent";
  });

  if (newlyAbsent.length > 0) {
    const { data: sessionRow } = await supabase
      .from("faculty_class_sessions")
      .select("session_number, scheduled_date, batch_id, faculty_batches(name)")
      .eq("id", sessionId)
      .maybeSingle();

    if (sessionRow?.batch_id) {
      const batchRaw = sessionRow.faculty_batches as unknown;
      const batch = (Array.isArray(batchRaw) ? batchRaw[0] : batchRaw) as { name: string } | null;
      const title = `Absent — ${batch?.name ?? "Your batch"}`;
      const body = `You were marked absent for Class ${sessionRow.session_number} on ${sessionRow.scheduled_date}. Contact your faculty if this is incorrect.`;
      try {
        await notifyFacultyBatchStudentsPortal(
          supabase,
          sessionRow.batch_id,
          title,
          body,
          { sessionId, batchId: sessionRow.batch_id, kind: "absent" },
          newlyAbsent.map((r) => r.studentId)
        );
      } catch (notifyError) {
        console.error("Faculty absent notification failed:", notifyError);
      }
    }
  }

  revalidateFacultyAcademicsPaths();
}
