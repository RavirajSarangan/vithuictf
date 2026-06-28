"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  mapBatchEnrollment,
  mapClassSession,
  mapCourseBatch,
} from "@/lib/supabase/mappers";
import { filterBatchesForTeacher, filterStudentsForTeacher } from "@/lib/teacher-scope";
import type {
  AttendanceStatus,
  BatchEnrollment,
  ClassSession,
  ClassSessionStatus,
  CourseBatch,
  Student,
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

export function useBatchAttendanceSummary(batchId: string | null) {
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

      const [{ data: sessions }, { data: enrollments }] = await Promise.all([
        supabase.from("class_sessions").select("id, status").eq("batch_id", batchId),
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

      let attendance: { student_id: string; status: string }[] = [];
      if (sessionIds.length) {
        const { data: records } = await supabase
          .from("attendance_records")
          .select("student_id, status")
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
  }, [batchId]);

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
  }, [batchId, weekStartDate, user?.role, teacher]);

  return { data, loading, weekStart: weekStartDate };
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

export type StudentEnrollment = {
  enrollmentId: string;
  courseId: string;
  courseName: string;
  batchId: string;
  batchName: string;
  batchCode: string;
};

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
      const { data: enrollments } = await supabase
        .from("batch_enrollments")
        .select(
          "id, batch_id, course_batches(name, batch_code, course_id, courses(id, name))"
        )
        .eq("student_id", studentId)
        .eq("active", true);

      const results: StudentEnrollment[] = [];

      for (const enrollment of enrollments ?? []) {
        const batchRaw = enrollment.course_batches as unknown;
        const batch = (Array.isArray(batchRaw) ? batchRaw[0] : batchRaw) as {
          name: string;
          batch_code: string;
          course_id: string;
          courses?: { id: string; name: string } | { id: string; name: string }[] | null;
        } | null;
        const courseRaw = batch?.courses;
        const course = Array.isArray(courseRaw) ? courseRaw[0] : courseRaw;
        if (!batch?.course_id || !course) continue;

        results.push({
          enrollmentId: enrollment.id,
          courseId: course.id,
          courseName: course.name,
          batchId: enrollment.batch_id,
          batchName: batch.name,
          batchCode: batch.batch_code,
        });
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
