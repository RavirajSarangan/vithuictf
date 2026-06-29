"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  mapBatchEnrollment,
  mapBatchWhatsAppLog,
  mapClassSession,
  mapCourseBatch,
} from "@/lib/supabase/mappers";
import { filterBatchesForTeacher, filterStudentsForTeacher } from "@/lib/teacher-scope";
import type {
  AttendanceStatus,
  BatchEnrollment,
  BatchWhatsAppLogEntry,
  ClassSession,
  ClassSessionStatus,
  CourseBatch,
  EnrollmentOverviewRow,
  Student,
  StudentEnrollmentDetail,
} from "@/types";
import { useAuth } from "@/providers/auth-provider";
import { useCurrentTeacher } from "@/hooks/use-data";
import { mapStudent } from "@/lib/supabase/mappers";

export function useBatches(courseId?: string) {
  const { user } = useAuth();
  const teacher = useCurrentTeacher();
  const [data, setData] = useState<CourseBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    void (async () => {
      const supabase = createClient();
      let query = supabase
        .from("course_batches")
        .select("*, courses(name, cover_image_url)")
        .order("created_at", { ascending: false });

      if (courseId) query = query.eq("course_id", courseId);

      const { data: rows } = await query;
      if (cancelled) return;

      let batches = (rows ?? []).map((row) => mapCourseBatch(row));
      batches = filterBatchesForTeacher(batches, user?.role, teacher);
      setData(batches);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [courseId, version, user?.role, teacher]);

  return { data, loading, refresh };
}

export function useBatchDetail(batchId: string | null) {
  const [batch, setBatch] = useState<CourseBatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (!batchId) {
      setBatch(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("course_batches")
        .select("*, courses(name, cover_image_url)")
        .eq("id", batchId)
        .maybeSingle();

      if (cancelled) return;
      setBatch(data ? mapCourseBatch(data) : null);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [batchId, version]);

  return { batch, loading, refresh };
}

export function useBatchStudents(batchId: string | null) {
  const [data, setData] = useState<BatchEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (!batchId) {
      setData([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      const supabase = createClient();
      const { data: rows } = await supabase
        .from("batch_enrollments")
        .select("*, students(display_name, email)")
        .eq("batch_id", batchId)
        .order("joined_at", { ascending: false });

      if (cancelled) return;
      setData((rows ?? []).map((row) => mapBatchEnrollment(row)));
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [batchId, version]);

  return { data, loading, refresh };
}

export function useBatchSessions(batchId: string | null) {
  const [data, setData] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (!batchId) {
      setData([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      const supabase = createClient();
      const { data: rows } = await supabase
        .from("class_sessions")
        .select("*")
        .eq("batch_id", batchId)
        .order("session_number");

      if (cancelled) return;
      setData((rows ?? []).map((row) => mapClassSession(row)));
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [batchId, version]);

  return { data, loading, refresh };
}

export type AttendanceSheetRow = {
  studentId: string;
  studentName: string;
  enrollmentCode: string;
  status: AttendanceStatus | null;
};

export function useAttendanceSheet(sessionId: string | null) {
  const [rows, setRows] = useState<AttendanceSheetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (!sessionId) {
      setRows([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      const supabase = createClient();

      const { data: session } = await supabase
        .from("class_sessions")
        .select("batch_id")
        .eq("id", sessionId)
        .maybeSingle();
      if (!session) {
        if (!cancelled) {
          setRows([]);
          setLoading(false);
        }
        return;
      }

      const [{ data: enrollments }, { data: attendance }] = await Promise.all([
        supabase
          .from("batch_enrollments")
          .select("student_id, enrollment_code, students(display_name)")
          .eq("batch_id", session.batch_id)
          .eq("active", true),
        supabase.from("attendance_records").select("student_id, status").eq("session_id", sessionId),
      ]);

      if (cancelled) return;

      const statusByStudent = new Map(
        (attendance ?? []).map((a) => [a.student_id, a.status as AttendanceStatus])
      );

      setRows(
        (enrollments ?? []).map((e) => {
          const student = e.students as { display_name: string } | { display_name: string }[] | null;
          const name = Array.isArray(student) ? student[0]?.display_name : student?.display_name;
          return {
            studentId: e.student_id,
            studentName: name ?? "Student",
            enrollmentCode: e.enrollment_code,
            status: statusByStudent.get(e.student_id) ?? null,
          };
        })
      );
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId, version]);

  return { rows, loading, refresh };
}

export function useAcademicsStudents() {
  const { user } = useAuth();
  const teacher = useCurrentTeacher();
  const [data, setData] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    void (async () => {
      const supabase = createClient();
      const { data: rows } = await supabase.from("students").select("*").order("display_name");
      if (cancelled) return;

      let students = (rows ?? []).map((row) => mapStudent(row));
      students = filterStudentsForTeacher(students, user?.role, teacher);
      setData(students);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [version, user?.role, teacher]);

  return { data, loading, refresh };
}

export type BatchAttendanceSummaryRow = {
  id: string;
  studentId: string;
  studentName: string;
  enrollmentCode: string;
  present: number;
  absent: number;
  late: number;
  unmarked: number;
  totalSessions: number;
  attendancePercent: number;
};

export function useBatchAttendanceSummary(
  batchId: string | null,
  options?: { fromDate?: string; toDate?: string }
) {
  const [data, setData] = useState<BatchAttendanceSummaryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!batchId) {
      setData([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      const supabase = createClient();

      let sessionQuery = supabase.from("class_sessions").select("id, status, scheduled_date").eq("batch_id", batchId);
      if (options?.fromDate) sessionQuery = sessionQuery.gte("scheduled_date", options.fromDate);
      if (options?.toDate) sessionQuery = sessionQuery.lte("scheduled_date", options.toDate);

      const [{ data: sessions }, { data: enrollments }] = await Promise.all([
        sessionQuery,
        supabase
          .from("batch_enrollments")
          .select("student_id, enrollment_code, students(display_name)")
          .eq("batch_id", batchId)
          .eq("active", true),
      ]);

      const sessionIds = (sessions ?? [])
        .filter((s) => s.status !== "cancelled")
        .map((s) => s.id);
      const totalSessions = sessionIds.length;

      let attendance: { student_id: string; status: string; session_id: string }[] = [];
      if (sessionIds.length) {
        const { data: records } = await supabase
          .from("attendance_records")
          .select("student_id, status, session_id")
          .in("session_id", sessionIds);
        attendance = records ?? [];
      }

      if (cancelled) return;

      const rows: BatchAttendanceSummaryRow[] = (enrollments ?? []).map((e) => {
        const student = e.students as { display_name: string } | { display_name: string }[] | null;
        const name = Array.isArray(student) ? student[0]?.display_name : student?.display_name;
        const studentRecords = attendance.filter((a) => a.student_id === e.student_id);
        const present = studentRecords.filter((r) => r.status === "present").length;
        const absent = studentRecords.filter((r) => r.status === "absent").length;
        const late = studentRecords.filter((r) => r.status === "late").length;
        const marked = present + absent + late;
        const unmarked = Math.max(0, totalSessions - marked);
        const attendancePercent =
          totalSessions > 0 ? Math.round(((present + late) / totalSessions) * 100) : 0;

        return {
          id: e.student_id,
          studentId: e.student_id,
          studentName: name ?? "Student",
          enrollmentCode: e.enrollment_code,
          present,
          absent,
          late,
          unmarked,
          totalSessions,
          attendancePercent,
        };
      });

      setData(rows);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [batchId, options?.fromDate, options?.toDate]);

  return { data, loading };
}

export type StudentAttendanceHistoryRow = {
  sessionId: string;
  sessionNumber: number;
  scheduledDate: string;
  status: AttendanceStatus | null;
  sessionStatus: ClassSessionStatus;
};

export function useStudentAttendanceHistory(studentId: string | null, batchId: string | null) {
  const [data, setData] = useState<StudentAttendanceHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId || !batchId) {
      setData([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      const supabase = createClient();
      const { data: sessions } = await supabase
        .from("class_sessions")
        .select("id, session_number, scheduled_date, status")
        .eq("batch_id", batchId)
        .order("session_number");

      const sessionIds = (sessions ?? []).map((s) => s.id);
      let records: { session_id: string; status: AttendanceStatus }[] = [];
      if (sessionIds.length) {
        const { data: attendance } = await supabase
          .from("attendance_records")
          .select("session_id, status")
          .eq("student_id", studentId)
          .in("session_id", sessionIds);
        records = (attendance ?? []) as { session_id: string; status: AttendanceStatus }[];
      }

      if (cancelled) return;

      const bySession = new Map(records.map((r) => [r.session_id, r.status]));
      setData(
        (sessions ?? []).map((s) => ({
          sessionId: s.id,
          sessionNumber: s.session_number,
          scheduledDate: s.scheduled_date,
          status: bySession.get(s.id) ?? null,
          sessionStatus: s.status as ClassSessionStatus,
        }))
      );
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [studentId, batchId]);

  return { data, loading };
}

export type AcademicsOverviewStats = {
  activeEnrollments: number;
  upcomingSessions: number;
  attendanceRate: number;
};

export function useAcademicsOverviewStats() {
  const { user } = useAuth();
  const teacher = useCurrentTeacher();
  const [stats, setStats] = useState<AcademicsOverviewStats>({
    activeEnrollments: 0,
    upcomingSessions: 0,
    attendanceRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    void (async () => {
      const supabase = createClient();
      const { data: batchRows } = await supabase
        .from("course_batches")
        .select("id, course_id, active")
        .eq("active", true);

      let batches = (batchRows ?? []).map((b) => ({
        id: b.id,
        courseId: b.course_id,
        active: b.active,
      }));
      batches = filterBatchesForTeacher(
        batches.map((b) => ({ ...b, courseId: b.courseId } as CourseBatch)),
        user?.role,
        teacher
      );

      const batchIds = batches.map((b) => b.id);
      if (!batchIds.length) {
        if (!cancelled) {
          setStats({ activeEnrollments: 0, upcomingSessions: 0, attendanceRate: 0 });
          setLoading(false);
        }
        return;
      }

      const today = new Date();
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const todayStr = today.toISOString().slice(0, 10);
      const weekEndStr = weekEnd.toISOString().slice(0, 10);

      const [{ count: enrollmentCount }, { data: upcoming }, { data: sessions }] = await Promise.all([
        supabase
          .from("batch_enrollments")
          .select("id", { count: "exact", head: true })
          .in("batch_id", batchIds)
          .eq("active", true),
        supabase
          .from("class_sessions")
          .select("id")
          .in("batch_id", batchIds)
          .gte("scheduled_date", todayStr)
          .lte("scheduled_date", weekEndStr)
          .eq("status", "scheduled"),
        supabase
          .from("class_sessions")
          .select("id, status")
          .in("batch_id", batchIds)
          .neq("status", "cancelled"),
      ]);

      const sessionIds = (sessions ?? []).map((s) => s.id);
      let attendanceRate = 0;
      if (sessionIds.length) {
        const { data: records } = await supabase
          .from("attendance_records")
          .select("status")
          .in("session_id", sessionIds);
        const presentLate = (records ?? []).filter(
          (r) => r.status === "present" || r.status === "late"
        ).length;
        const totalMarked = records?.length ?? 0;
        if (totalMarked > 0) {
          attendanceRate = Math.round((presentLate / totalMarked) * 100);
        }
      }

      if (!cancelled) {
        setStats({
          activeEnrollments: enrollmentCount ?? 0,
          upcomingSessions: upcoming?.length ?? 0,
          attendanceRate,
        });
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.role, teacher]);

  return { stats, loading };
}

export type AcademicsCalendarSession = ClassSession & {
  batchName: string;
  batchCode: string;
  courseName?: string;
};

function formatWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export function useAcademicsCalendarSessions(batchId?: string, weekStart?: string) {
  const { user } = useAuth();
  const teacher = useCurrentTeacher();
  const [data, setData] = useState<AcademicsCalendarSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const weekStartDate = weekStart ?? formatWeekStart(new Date());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    void (async () => {
      const supabase = createClient();
      const start = new Date(weekStartDate);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      const startStr = start.toISOString().slice(0, 10);
      const endStr = end.toISOString().slice(0, 10);

      let query = supabase
        .from("class_sessions")
        .select("*, course_batches(name, batch_code, course_id, courses(name))")
        .gte("scheduled_date", startStr)
        .lte("scheduled_date", endStr)
        .order("scheduled_date")
        .order("start_time");

      if (batchId) {
        query = query.eq("batch_id", batchId);
      }

      const { data: rows } = await query;
      if (cancelled) return;

      let sessions: AcademicsCalendarSession[] = (rows ?? []).map((row) => {
        const batchRaw = row.course_batches as unknown;
        const batch = (Array.isArray(batchRaw) ? batchRaw[0] : batchRaw) as {
          name: string;
          batch_code: string;
          course_id: string;
          courses?: { name: string } | { name: string }[] | null;
        } | null;
        const courseRaw = batch?.courses;
        const courseName = Array.isArray(courseRaw) ? courseRaw[0]?.name : courseRaw?.name;
        const mapped = mapClassSession(row);
        return {
          ...mapped,
          batchName: batch?.name ?? "Batch",
          batchCode: batch?.batch_code ?? "",
          courseName,
        };
      });

      if (!batchId) {
        const batchIds = [...new Set(sessions.map((s) => s.batchId))];
        const { data: batchRows } = await supabase
          .from("course_batches")
          .select("id, course_id")
          .in("id", batchIds.length ? batchIds : ["00000000-0000-0000-0000-000000000000"]);
        const allowed = new Set(
          filterBatchesForTeacher(
            (batchRows ?? []).map((b) => ({ id: b.id, courseId: b.course_id } as CourseBatch)),
            user?.role,
            teacher
          ).map((b) => b.id)
        );
        sessions = sessions.filter((s) => allowed.has(s.batchId));
      }

      setData(sessions);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [batchId, weekStartDate, user?.role, teacher, version]);

  return { data, loading, weekStart: weekStartDate, refresh };
}

export function useAcademicsCalendarSessionsForMonth(batchId?: string, monthKey?: string) {
  const { user } = useAuth();
  const teacher = useCurrentTeacher();
  const [data, setData] = useState<AcademicsCalendarSession[]>([]);
  const [loading, setLoading] = useState(true);

  const resolvedMonth = monthKey ?? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    void (async () => {
      const supabase = createClient();
      const [year, month] = resolvedMonth.split("-").map(Number);
      const startStr = `${year}-${String(month).padStart(2, "0")}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endStr = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

      let query = supabase
        .from("class_sessions")
        .select("*, course_batches(name, batch_code, course_id, courses(name))")
        .gte("scheduled_date", startStr)
        .lte("scheduled_date", endStr)
        .order("scheduled_date")
        .order("start_time");

      if (batchId) {
        query = query.eq("batch_id", batchId);
      }

      const { data: rows } = await query;
      if (cancelled) return;

      let sessions = (rows ?? []).map((row) => {
        const batchRaw = row.course_batches as unknown;
        const batch = (Array.isArray(batchRaw) ? batchRaw[0] : batchRaw) as {
          name: string;
          batch_code: string;
          course_id: string;
          courses?: { name: string } | { name: string }[] | null;
        } | null;
        const courseRaw = batch?.courses;
        const courseName = Array.isArray(courseRaw) ? courseRaw[0]?.name : courseRaw?.name;
        const mapped = mapClassSession(row);
        return {
          ...mapped,
          batchName: batch?.name ?? "Batch",
          batchCode: batch?.batch_code ?? "",
          courseName,
        };
      });

      if (!batchId) {
        const batchIds = [...new Set(sessions.map((s) => s.batchId))];
        const { data: batchRows } = await supabase
          .from("course_batches")
          .select("id, course_id")
          .in("id", batchIds.length ? batchIds : ["00000000-0000-0000-0000-000000000000"]);
        const allowed = new Set(
          filterBatchesForTeacher(
            (batchRows ?? []).map((b) => ({ id: b.id, courseId: b.course_id } as CourseBatch)),
            user?.role,
            teacher
          ).map((b) => b.id)
        );
        sessions = sessions.filter((s) => allowed.has(s.batchId));
      }

      setData(sessions);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [batchId, resolvedMonth, user?.role, teacher]);

  return { data, loading };
}

export type StudentBatchAttendance = {
  batchId: string;
  batchName: string;
  batchCode: string;
  courseName?: string;
  present: number;
  absent: number;
  late: number;
  unmarked: number;
  totalSessions: number;
  attendancePercent: number;
  history: StudentAttendanceHistoryRow[];
};

export function useStudentBatchAttendance(studentId: string | null) {
  const [data, setData] = useState<StudentBatchAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) {
      setData([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      const supabase = createClient();
      const { data: enrollments } = await supabase
        .from("batch_enrollments")
        .select("batch_id, course_batches(name, batch_code, courses(name))")
        .eq("student_id", studentId)
        .eq("active", true);

      const results: StudentBatchAttendance[] = [];

      for (const enrollment of enrollments ?? []) {
        const batchRaw = enrollment.course_batches as unknown;
        const batch = (Array.isArray(batchRaw) ? batchRaw[0] : batchRaw) as {
          name: string;
          batch_code: string;
          courses?: { name: string } | { name: string }[] | null;
        } | null;
        const courseRaw = batch?.courses;
        const courseName = Array.isArray(courseRaw) ? courseRaw[0]?.name : courseRaw?.name;
        const batchId = enrollment.batch_id;

        const { data: sessions } = await supabase
          .from("class_sessions")
          .select("id, session_number, scheduled_date, status")
          .eq("batch_id", batchId)
          .neq("status", "cancelled")
          .order("session_number");

        const sessionIds = (sessions ?? []).map((s) => s.id);
        let records: { session_id: string; status: AttendanceStatus }[] = [];
        if (sessionIds.length) {
          const { data: attendance } = await supabase
            .from("attendance_records")
            .select("session_id, status")
            .eq("student_id", studentId)
            .in("session_id", sessionIds);
          records = (attendance ?? []) as { session_id: string; status: AttendanceStatus }[];
        }

        const bySession = new Map(records.map((r) => [r.session_id, r.status]));
        const present = records.filter((r) => r.status === "present").length;
        const absent = records.filter((r) => r.status === "absent").length;
        const late = records.filter((r) => r.status === "late").length;
        const totalSessions = sessionIds.length;
        const unmarked = Math.max(0, totalSessions - records.length);

        results.push({
          batchId,
          batchName: batch?.name ?? "Batch",
          batchCode: batch?.batch_code ?? "",
          courseName,
          present,
          absent,
          late,
          unmarked,
          totalSessions,
          attendancePercent:
            totalSessions > 0 ? Math.round(((present + late) / totalSessions) * 100) : 0,
          history: (sessions ?? []).map((s) => ({
            sessionId: s.id,
            sessionNumber: s.session_number,
            scheduledDate: s.scheduled_date,
            status: bySession.get(s.id) ?? null,
            sessionStatus: s.status as ClassSessionStatus,
          })),
        });
      }

      if (!cancelled) {
        setData(results);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [studentId]);

  return { data, loading };
}

export type StudentEnrollment = StudentEnrollmentDetail;

function mapEnrollmentRow(
  enrollment: {
    id: string;
    batch_id: string;
    enrollment_code: string;
    joined_at: string;
    active: boolean;
    course_batches?: unknown;
  },
  primaryCourseId: string | null
): StudentEnrollmentDetail | null {
  const batchRaw = enrollment.course_batches as unknown;
  const batch = (Array.isArray(batchRaw) ? batchRaw[0] : batchRaw) as {
    id: string;
    name: string;
    batch_code: string;
    start_date: string;
    class_days: string[];
    start_time: string;
    end_time: string;
    course_id: string;
    courses?: {
      id: string;
      name: string;
      level: string;
      teacher_name: string;
      duration_months: number | null;
      cover_image_url: string | null;
      category: string | null;
    } | {
      id: string;
      name: string;
      level: string;
      teacher_name: string;
      duration_months: number | null;
      cover_image_url: string | null;
      category: string | null;
    }[] | null;
  } | null;

  const courseRaw = batch?.courses;
  const course = Array.isArray(courseRaw) ? courseRaw[0] : courseRaw;
  if (!batch?.course_id || !course) return null;

  return {
    enrollmentId: enrollment.id,
    courseId: course.id,
    course: {
      name: course.name,
      level: course.level as StudentEnrollmentDetail["course"]["level"],
      teacherName: course.teacher_name,
      durationMonths: course.duration_months ?? undefined,
      coverImageUrl: course.cover_image_url ?? undefined,
      category: course.category ?? undefined,
    },
    batch: {
      id: batch.id,
      name: batch.name,
      batchCode: batch.batch_code,
      startDate: batch.start_date,
      classDays: batch.class_days ?? [],
      startTime: batch.start_time,
      endTime: batch.end_time,
    },
    enrollmentCode: enrollment.enrollment_code,
    joinedAt: enrollment.joined_at,
    active: enrollment.active,
    isPrimary: primaryCourseId === course.id,
  };
}

export function useEnrollmentOverview() {
  const { user } = useAuth();
  const teacher = useCurrentTeacher();
  const [data, setData] = useState<EnrollmentOverviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    void (async () => {
      const supabase = createClient();
      const { data: studentRows } = await supabase
        .from("students")
        .select("*")
        .order("display_name");

      let students = (studentRows ?? []).map((row) => mapStudent(row));
      students = filterStudentsForTeacher(students, user?.role, teacher);

      const { data: enrollmentRows } = await supabase
        .from("batch_enrollments")
        .select(
          "id, batch_id, student_id, enrollment_code, joined_at, active, course_batches(id, name, batch_code, start_date, class_days, start_time, end_time, course_id, courses(id, name, level, teacher_name, duration_months, cover_image_url, category))"
        )
        .eq("active", true);

      const byStudent = new Map<string, StudentEnrollmentDetail[]>();
      for (const enrollment of enrollmentRows ?? []) {
        const student = students.find((s) => s.id === enrollment.student_id);
        if (!student) continue;
        const mapped = mapEnrollmentRow(enrollment, student.courseId);
        if (!mapped) continue;
        const list = byStudent.get(student.id) ?? [];
        if (!list.some((e) => e.courseId === mapped.courseId)) {
          list.push(mapped);
        }
        byStudent.set(student.id, list);
      }

      const overview: EnrollmentOverviewRow[] = students.map((student) => {
        const enrollments = byStudent.get(student.id) ?? [];
        return {
          student,
          enrollments,
          enrollmentCount: enrollments.length,
        };
      });

      if (!cancelled) {
        setData(overview);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [version, user?.role, teacher]);

  return { data, loading, refresh };
}

export function useStudentEnrollments(studentId: string | null) {
  const [data, setData] = useState<StudentEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) {
      setData([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      const supabase = createClient();
      const { data: studentRow } = await supabase
        .from("students")
        .select("course_id")
        .eq("id", studentId)
        .maybeSingle();

      const { data: enrollments } = await supabase
        .from("batch_enrollments")
        .select(
          "id, batch_id, enrollment_code, joined_at, active, course_batches(id, name, batch_code, start_date, class_days, start_time, end_time, course_id, courses(id, name, level, teacher_name, duration_months, cover_image_url, category))"
        )
        .eq("student_id", studentId)
        .eq("active", true);

      const results: StudentEnrollment[] = [];
      for (const enrollment of enrollments ?? []) {
        const mapped = mapEnrollmentRow(enrollment, studentRow?.course_id ?? null);
        if (mapped) results.push(mapped);
      }

      const uniqueByCourse = new Map<string, StudentEnrollment>();
      for (const item of results) {
        if (!uniqueByCourse.has(item.courseId)) {
          uniqueByCourse.set(item.courseId, item);
        }
      }

      if (!cancelled) {
        setData([...uniqueByCourse.values()]);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [studentId]);

  return { data, loading };
}

export function useStudentBatchCalendarSessions(studentId: string | null, courseId?: string | null) {
  const [data, setData] = useState<AcademicsCalendarSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) {
      setData([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      const supabase = createClient();
      const { data: enrollments } = await supabase
        .from("batch_enrollments")
        .select("batch_id, course_batches(course_id)")
        .eq("student_id", studentId)
        .eq("active", true);

      let batchIds = (enrollments ?? []).map((e) => e.batch_id);
      if (courseId) {
        batchIds = (enrollments ?? [])
          .filter((e) => {
            const batchRaw = e.course_batches as unknown;
            const batch = (Array.isArray(batchRaw) ? batchRaw[0] : batchRaw) as { course_id: string } | null;
            return batch?.course_id === courseId;
          })
          .map((e) => e.batch_id);
      }

      if (!batchIds.length) {
        if (!cancelled) {
          setData([]);
          setLoading(false);
        }
        return;
      }

      const { data: rows } = await supabase
        .from("class_sessions")
        .select("*, course_batches(name, batch_code, course_id, courses(name))")
        .in("batch_id", batchIds)
        .order("scheduled_date")
        .order("start_time");

      if (cancelled) return;

      const sessions: AcademicsCalendarSession[] = (rows ?? []).map((row) => {
        const batchRaw = row.course_batches as unknown;
        const batch = (Array.isArray(batchRaw) ? batchRaw[0] : batchRaw) as {
          name: string;
          batch_code: string;
          courses?: { name: string } | { name: string }[] | null;
        } | null;
        const courseRaw = batch?.courses;
        const courseName = Array.isArray(courseRaw) ? courseRaw[0]?.name : courseRaw?.name;
        return {
          ...mapClassSession(row),
          batchName: batch?.name ?? "Batch",
          batchCode: batch?.batch_code ?? "",
          courseName,
        };
      });

      setData(sessions);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [studentId, courseId]);

  return { data, loading };
}

export function useStudentBatchTodaySessions(studentId: string | null, courseId?: string | null) {
  const { data, loading } = useStudentBatchCalendarSessions(studentId, courseId);
  const today = new Date().toISOString().slice(0, 10);
  const todaySessions = useMemo(
    () => data.filter((s) => s.scheduledDate === today && s.status !== "cancelled"),
    [data, today]
  );
  return { data: todaySessions, loading };
}

export function useActiveBatchesOverview() {
  const [data, setData] = useState<
    Array<
      CourseBatch & {
        enrolledCount: number;
        nextSessionDate: string | null;
        nextSessionTime: string | null;
      }
    >
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    void (async () => {
      const supabase = createClient();
      const today = new Date().toISOString().slice(0, 10);
      const { data: batches } = await supabase
        .from("course_batches")
        .select("*, courses(name, cover_image_url)")
        .eq("active", true)
        .order("start_date", { ascending: false });

      const results: Array<
        CourseBatch & {
          enrolledCount: number;
          nextSessionDate: string | null;
          nextSessionTime: string | null;
        }
      > = [];

      for (const row of batches ?? []) {
        const batch = mapCourseBatch(row);
        const [{ count }, { data: nextSession }] = await Promise.all([
          supabase
            .from("batch_enrollments")
            .select("id", { count: "exact", head: true })
            .eq("batch_id", batch.id)
            .eq("active", true),
          supabase
            .from("class_sessions")
            .select("scheduled_date, start_time")
            .eq("batch_id", batch.id)
            .eq("status", "scheduled")
            .gte("scheduled_date", today)
            .order("scheduled_date")
            .order("start_time")
            .limit(1)
            .maybeSingle(),
        ]);

        results.push({
          ...batch,
          enrolledCount: count ?? 0,
          nextSessionDate: nextSession?.scheduled_date ?? null,
          nextSessionTime: nextSession?.start_time ?? null,
        });
      }

      if (!cancelled) {
        setData(results);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading };
}

export function useBatchWhatsAppLog(batchId: string | null) {
  const [data, setData] = useState<BatchWhatsAppLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!batchId) {
      setData([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      const supabase = createClient();
      const { data: rows } = await supabase
        .from("batch_whatsapp_log")
        .select("*, students(full_name)")
        .eq("batch_id", batchId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!cancelled) {
        setData((rows ?? []).map((row) => mapBatchWhatsAppLog(row)));
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [batchId]);

  return { data, loading };
}

export function useStudentSessionSlide(sessionId: string | null) {
  const [session, setSession] = useState<ClassSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setSession(null);
      setNotFound(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    void (async () => {
      const supabase = createClient();
      const { data: row, error } = await supabase
        .from("class_sessions")
        .select("*, course_batches(name, batch_code)")
        .eq("id", sessionId)
        .maybeSingle();

      if (cancelled) return;

      if (error || !row) {
        setSession(null);
        setNotFound(true);
        setLoading(false);
        return;
      }

      const mapped = mapClassSession(row);
      if (!mapped.canvaSlideUrl) {
        setSession(mapped);
        setNotFound(true);
        setLoading(false);
        return;
      }

      setSession(mapped);
      setNotFound(false);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return { session, loading, notFound };
}
