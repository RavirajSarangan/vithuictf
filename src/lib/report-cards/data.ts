import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { gradeForPercent } from "@/lib/grades";

type Supabase = SupabaseClient<Database>;

export type ReportCardExam = {
  id: string;
  title: string;
  subject: string;
  totalMarks: number;
  weight: number;
};

export type ReportCardStudent = {
  studentId: string;
  studentName: string;
  enrollmentCode: string;
  /** One entry per published exam, in the same order as `exams`. */
  marks: (number | null)[];
  grades: (string | null)[];
  averagePercent: number;
  overallGrade: string;
  rank: number;
  attendancePercent: number;
};

export type BatchReportCards = {
  batchId: string;
  batchName: string;
  courseName: string;
  term: string;
  exams: ReportCardExam[];
  students: ReportCardStudent[];
};

/**
 * Assembles report-card data for every active student of a batch/term from
 * published exams only. The weighted average uses all published exams as the
 * denominator (missing marks count as zero) so ranks are comparable, and the
 * batch rank is a dense rank over those averages. Attendance replicates
 * useBatchAttendanceSummary: (present + late) / non-cancelled sessions.
 *
 * Callers must pass a client that can read the whole batch (staff RLS client
 * or the admin client) — a student-scoped client would only see its own rows.
 */
export async function assembleBatchReportCards(
  supabase: Supabase,
  batchId: string,
  term: string
): Promise<BatchReportCards | null> {
  const { data: batch } = await supabase
    .from("course_batches")
    .select("id, name, courses(name)")
    .eq("id", batchId)
    .maybeSingle();
  if (!batch) return null;
  const courseRaw = batch.courses as unknown;
  const course = (Array.isArray(courseRaw) ? courseRaw[0] : courseRaw) as { name: string } | null;

  const [{ data: examRows }, { data: enrollments }, { data: sessions }] = await Promise.all([
    supabase
      .from("exams")
      .select("id, title, subject, total_marks, weight, exam_date")
      .eq("batch_id", batchId)
      .eq("term", term)
      .eq("status", "published")
      .order("exam_date", { ascending: true }),
    supabase
      .from("batch_enrollments")
      .select("student_id, enrollment_code, students(display_name)")
      .eq("batch_id", batchId)
      .eq("active", true),
    supabase.from("class_sessions").select("id, status").eq("batch_id", batchId),
  ]);

  const exams: ReportCardExam[] = (examRows ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    subject: e.subject || e.title,
    totalMarks: e.total_marks,
    weight: Number(e.weight),
  }));

  const examIds = exams.map((e) => e.id);
  const sessionIds = (sessions ?? []).filter((s) => s.status !== "cancelled").map((s) => s.id);
  const totalSessions = sessionIds.length;

  const [{ data: resultRows }, { data: attendanceRows }] = await Promise.all([
    examIds.length
      ? supabase.from("results").select("exam_id, student_id, marks").in("exam_id", examIds)
      : Promise.resolve({ data: [] as { exam_id: string | null; student_id: string; marks: number }[] }),
    sessionIds.length
      ? supabase.from("attendance_records").select("student_id, status").in("session_id", sessionIds)
      : Promise.resolve({ data: [] as { student_id: string; status: string }[] }),
  ]);

  const marksByStudent = new Map<string, Map<string, number>>();
  for (const row of resultRows ?? []) {
    if (!row.exam_id) continue;
    const perExam = marksByStudent.get(row.student_id) ?? new Map<string, number>();
    perExam.set(row.exam_id, row.marks);
    marksByStudent.set(row.student_id, perExam);
  }

  const attendedByStudent = new Map<string, number>();
  for (const row of attendanceRows ?? []) {
    if (row.status === "present" || row.status === "late") {
      attendedByStudent.set(row.student_id, (attendedByStudent.get(row.student_id) ?? 0) + 1);
    }
  }

  const totalWeight = exams.reduce((sum, e) => sum + e.weight, 0);

  const students = (enrollments ?? []).map((e) => {
    const studentRaw = e.students as unknown;
    const student = (Array.isArray(studentRaw) ? studentRaw[0] : studentRaw) as {
      display_name: string;
    } | null;
    const perExam = marksByStudent.get(e.student_id);

    const marks = exams.map((exam) => perExam?.get(exam.id) ?? null);
    const grades = exams.map((exam, i) => {
      const m = marks[i];
      return m === null ? null : gradeForPercent((m / exam.totalMarks) * 100);
    });
    const weightedSum = exams.reduce((sum, exam, i) => {
      const m = marks[i];
      return m === null ? sum : sum + exam.weight * (m / exam.totalMarks);
    }, 0);
    const averagePercent = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;

    return {
      studentId: e.student_id,
      studentName: student?.display_name ?? "Student",
      enrollmentCode: e.enrollment_code,
      marks,
      grades,
      averagePercent: Math.round(averagePercent * 10) / 10,
      overallGrade: gradeForPercent(averagePercent),
      rank: 0,
      attendancePercent:
        totalSessions > 0
          ? Math.round(((attendedByStudent.get(e.student_id) ?? 0) / totalSessions) * 100)
          : 0,
    };
  });

  const distinctAverages = [...new Set(students.map((s) => s.averagePercent))].sort((a, b) => b - a);
  const rankByAverage = new Map(distinctAverages.map((avg, i) => [avg, i + 1]));
  for (const student of students) {
    student.rank = rankByAverage.get(student.averagePercent) ?? 0;
  }
  students.sort((a, b) => a.rank - b.rank || a.studentName.localeCompare(b.studentName));

  return {
    batchId,
    batchName: batch.name,
    courseName: course?.name ?? "",
    term,
    exams,
    students,
  };
}
