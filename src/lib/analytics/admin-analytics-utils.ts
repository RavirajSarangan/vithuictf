import type { Course, Result, Student } from "@/types";

export type PeriodGranularity = "week" | "month";

export function bucketDate(dateISO: string, granularity: PeriodGranularity): string {
  const d = new Date(dateISO);
  if (granularity === "month") {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }
  const day = d.getDay();
  const diff = (day + 6) % 7; // days since Monday
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - diff);
  return d.toISOString().slice(0, 10);
}

export function buildStudentGrowthTrend(
  students: Student[],
  granularity: PeriodGranularity = "week"
): { period: string; newStudents: number }[] {
  const buckets = new Map<string, number>();
  for (const s of students) {
    if (!s.createdAt) continue;
    const period = bucketDate(s.createdAt, granularity);
    buckets.set(period, (buckets.get(period) ?? 0) + 1);
  }
  return Array.from(buckets.entries())
    .map(([period, newStudents]) => ({ period, newStudents }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

export function buildGrowthRetentionTrend(
  students: Student[],
  granularity: PeriodGranularity = "week"
): { period: string; joined: number; deactivated: number; net: number }[] {
  const buckets = new Map<string, { joined: number; deactivated: number }>();
  for (const s of students) {
    if (s.createdAt) {
      const period = bucketDate(s.createdAt, granularity);
      const bucket = buckets.get(period) ?? { joined: 0, deactivated: 0 };
      bucket.joined += 1;
      buckets.set(period, bucket);
    }
    if (s.active === false && s.disabledAt) {
      const period = bucketDate(s.disabledAt, granularity);
      const bucket = buckets.get(period) ?? { joined: 0, deactivated: 0 };
      bucket.deactivated += 1;
      buckets.set(period, bucket);
    }
  }
  return Array.from(buckets.entries())
    .map(([period, { joined, deactivated }]) => ({ period, joined, deactivated, net: joined - deactivated }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

export function buildDistrictBreakdown(students: Student[], topN = 8): { name: string; value: number }[] {
  const counts = new Map<string, number>();
  for (const s of students) {
    const key = s.district?.trim() || "Unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, topN);
}

export function buildExamYearBreakdown(students: Student[]): { name: string; value: number }[] {
  const counts = new Map<string, number>();
  for (const s of students) {
    const key = s.examYear?.trim() || "Unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export interface CourseGrowthRow {
  id: string;
  courseId: string;
  courseName: string;
  currentEnrollment: number;
  newInPeriod: number;
  newInPriorPeriod: number;
  deltaEnrollments: number;
  deltaPercent: number;
}

export function buildCourseGrowth(students: Student[], courses: Course[], periodDays = 30): CourseGrowthRow[] {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const periodStart = now - periodDays * dayMs;
  const priorStart = now - periodDays * 2 * dayMs;

  const currentByCourse = new Map<string, number>();
  const newInPeriodByCourse = new Map<string, number>();
  const newInPriorByCourse = new Map<string, number>();

  for (const s of students) {
    if (!s.courseId) continue;
    currentByCourse.set(s.courseId, (currentByCourse.get(s.courseId) ?? 0) + 1);
    if (!s.createdAt) continue;
    const createdMs = new Date(s.createdAt).getTime();
    if (createdMs >= periodStart && createdMs <= now) {
      newInPeriodByCourse.set(s.courseId, (newInPeriodByCourse.get(s.courseId) ?? 0) + 1);
    } else if (createdMs >= priorStart && createdMs < periodStart) {
      newInPriorByCourse.set(s.courseId, (newInPriorByCourse.get(s.courseId) ?? 0) + 1);
    }
  }

  return courses
    .map((c) => {
      const newInPeriod = newInPeriodByCourse.get(c.id) ?? 0;
      const newInPriorPeriod = newInPriorByCourse.get(c.id) ?? 0;
      const deltaEnrollments = newInPeriod - newInPriorPeriod;
      const deltaPercent =
        newInPriorPeriod > 0
          ? Math.round((deltaEnrollments / newInPriorPeriod) * 100)
          : newInPeriod > 0
            ? 100
            : 0;
      return {
        id: c.id,
        courseId: c.id,
        courseName: c.name,
        currentEnrollment: currentByCourse.get(c.id) ?? c.studentCount ?? 0,
        newInPeriod,
        newInPriorPeriod,
        deltaEnrollments,
        deltaPercent,
      };
    })
    .sort((a, b) => b.deltaEnrollments - a.deltaEnrollments);
}

export function buildGradeDistribution(results: Result[]): { name: string; value: number }[] {
  const counts = new Map<string, number>();
  for (const r of results) {
    const key = r.grade?.trim() || "Unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function buildScoreTrend(results: Result[]): { period: string; avgScorePercent: number }[] {
  const buckets = new Map<string, { totalPercent: number; count: number }>();
  for (const r of results) {
    if (!r.maxMarks) continue;
    const key = r.term?.trim() || (r.date ? bucketDate(r.date, "month") : "Unknown");
    const percent = (r.marks / r.maxMarks) * 100;
    const bucket = buckets.get(key) ?? { totalPercent: 0, count: 0 };
    bucket.totalPercent += percent;
    bucket.count += 1;
    buckets.set(key, bucket);
  }
  return Array.from(buckets.entries())
    .map(([period, { totalPercent, count }]) => ({
      period,
      avgScorePercent: count > 0 ? Math.round(totalPercent / count) : 0,
    }))
    .sort((a, b) => a.period.localeCompare(b.period));
}
