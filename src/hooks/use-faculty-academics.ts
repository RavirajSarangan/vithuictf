"use client";

// Faculty portal data hooks — the read-side counterpart to
// src/lib/actions/faculty-academics.ts. These mirror the relevant parts of
// src/hooks/use-academics.ts (useBatches, useEnrollmentOverview) but query
// the faculty_* tables instead of the teacher-side course_batches /
// batch_enrollments. Unlike the teacher hooks there's no client-side
// "teacher scope" filtering here — RLS (faculty_can_access_course/batch,
// see 20260726091000_faculty_academics_batches.sql) already restricts every
// faculty_* query to what the signed-in faculty_staff (or admin) may see.
//
// mapCourseBatch/mapBatchEnrollment (src/lib/supabase/mappers.ts) accept
// generic column-shaped rows rather than a specific table type, so they're
// reused as-is against faculty_batches/faculty_batch_enrollments rows.

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { mapBatchEnrollment, mapClassSession, mapCourseBatch, mapStudent } from "@/lib/supabase/mappers";
import type {
  AttendanceStatus,
  BatchEnrollment,
  ClassSession,
  CourseBatch,
  EnrollmentOverviewRow,
  Student,
  StudentEnrollmentDetail,
} from "@/types";
import type { AttendanceSheetRow, BatchAttendanceSummaryRow } from "@/hooks/use-academics";

export function useFacultyBatches(courseId?: string) {
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
        .from("faculty_batches")
        .select("*, courses(name, cover_image_url)")
        .order("created_at", { ascending: false });

      if (courseId) query = query.eq("course_id", courseId);

      const { data: rows } = await query;
      if (cancelled) return;

      setData((rows ?? []).map((row) => mapCourseBatch(row)));
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [courseId, version]);

  return { data, loading, refresh };
}

export function useFacultyBatchStudents(batchId: string | null) {
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
        .from("faculty_batch_enrollments")
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

type FacultyEnrollmentJoinRow = {
  id: string;
  batch_id: string;
  student_id: string;
  enrollment_code: string;
  joined_at: string;
  active: boolean;
  faculty_batches?: unknown;
};

type FacultyBatchJoin = {
  id: string;
  name: string;
  batch_code: string;
  start_date: string;
  class_days: string[];
  start_time: string;
  end_time: string;
  course_id: string;
  courses?:
    | {
        id: string;
        name: string;
        level: string;
        teacher_name: string;
        duration_months: number | null;
        cover_image_url: string | null;
        category: string | null;
      }
    | {
        id: string;
        name: string;
        level: string;
        teacher_name: string;
        duration_months: number | null;
        cover_image_url: string | null;
        category: string | null;
      }[]
    | null;
};

function mapFacultyEnrollmentRow(
  enrollment: FacultyEnrollmentJoinRow,
  primaryCourseId: string | null
): StudentEnrollmentDetail | null {
  const batchRaw = enrollment.faculty_batches as unknown;
  const batch = (Array.isArray(batchRaw) ? batchRaw[0] : batchRaw) as FacultyBatchJoin | null;

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

const FACULTY_ENROLLMENT_SELECT =
  "id, batch_id, student_id, enrollment_code, joined_at, active, faculty_batches(id, name, batch_code, start_date, class_days, start_time, end_time, course_id, courses(id, name, level, teacher_name, duration_months, cover_image_url, category))";

/** Full student roster (global — needed so faculty can search and enroll students who
 * aren't in any of their batches yet) with faculty-batch enrollment context attached. */
export function useFacultyEnrollmentOverview() {
  const [data, setData] = useState<EnrollmentOverviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    void (async () => {
      const supabase = createClient();
      const { data: studentRows } = await supabase.from("students").select("*").order("display_name");
      const students = (studentRows ?? []).map((row) => mapStudent(row));

      const { data: enrollmentRows } = await supabase
        .from("faculty_batch_enrollments")
        .select(FACULTY_ENROLLMENT_SELECT)
        .eq("active", true);

      const byStudent = new Map<string, StudentEnrollmentDetail[]>();
      for (const enrollment of (enrollmentRows ?? []) as FacultyEnrollmentJoinRow[]) {
        const student = students.find((s) => s.id === enrollment.student_id);
        if (!student) continue;
        const mapped = mapFacultyEnrollmentRow(enrollment, student.courseId);
        if (!mapped) continue;
        const list = byStudent.get(student.id) ?? [];
        if (!list.some((e) => e.enrollmentId === mapped.enrollmentId)) {
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
  }, [version]);

  return { data, loading, refresh };
}

export type FacultyStudentRosterRow = {
  student: Student;
  enrollments: StudentEnrollmentDetail[];
};

/** Roster scoped to students already enrolled in one of the current faculty
 * member's batches (unlike useFacultyEnrollmentOverview, this never loads the
 * full global student list). */
export function useFacultyStudentRoster() {
  const [data, setData] = useState<FacultyStudentRosterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    void (async () => {
      const supabase = createClient();
      const { data: rows } = await supabase
        .from("faculty_batch_enrollments")
        .select(`${FACULTY_ENROLLMENT_SELECT}, students(*)`)
        .eq("active", true);

      const byStudent = new Map<string, FacultyStudentRosterRow>();
      for (const row of (rows ?? []) as Array<FacultyEnrollmentJoinRow & { students?: unknown }>) {
        const studentRaw = row.students as unknown;
        const studentRow = Array.isArray(studentRaw) ? studentRaw[0] : studentRaw;
        if (!studentRow) continue;
        const student = mapStudent(studentRow as Parameters<typeof mapStudent>[0]);
        const mapped = mapFacultyEnrollmentRow(row, student.courseId);
        if (!mapped) continue;

        const entry = byStudent.get(student.id) ?? { student, enrollments: [] };
        if (!entry.enrollments.some((e) => e.enrollmentId === mapped.enrollmentId)) {
          entry.enrollments.push(mapped);
        }
        byStudent.set(student.id, entry);
      }

      if (!cancelled) {
        const rows = [...byStudent.values()].sort((a, b) =>
          a.student.displayName.localeCompare(b.student.displayName)
        );
        setData(rows);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [version]);

  return { data, loading, refresh };
}
