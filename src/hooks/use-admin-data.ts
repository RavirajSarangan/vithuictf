"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  mapAcademicStaffMember,
  mapCertificate,
  mapClassProgram,
  mapCompany,
  mapContactInquiry,
  mapCourse,
  mapEbook,
  mapFeaturedRanking,
  mapHeadlineNews,
  mapIctfTeamMember,
  mapMarketingAnnouncement,
  mapPaperCenter,
  mapPayment,
  mapResource,
  mapResult,
  mapParent,
  mapStudent,
  mapTeacher,
  mapBlogCategory,
  mapBlogPost,
} from "@/lib/supabase/mappers";
import type {
  AcademicStaffMember,
  BlogCategory,
  BlogPost,
  Certificate,
  ClassProgram,
  Company,
  ContactInquiry,
  Course,
  Ebook,
  FeaturedRanking,
  HeadlineNews,
  IctfTeamMember,
  MarketingAnnouncement,
  PaperCenter,
  Payment,
  Parent,
  Resource,
  Result,
  Student,
  Teacher,
} from "@/types";

// Lightweight in-memory TTL cache for the admin dashboard aggregates. These hooks
// run several count/scan queries on mount; caching the result avoids refetch storms
// when admins navigate back and forth between dashboard views within the window.
const ADMIN_AGG_TTL_MS = 60_000;
const adminAggCache = new Map<string, { value: unknown; at: number }>();

function readAdminAggCache<T>(key: string): T | null {
  const hit = adminAggCache.get(key);
  if (hit && Date.now() - hit.at < ADMIN_AGG_TTL_MS) {
    return hit.value as T;
  }
  return null;
}

function writeAdminAggCache(key: string, value: unknown) {
  adminAggCache.set(key, { value, at: Date.now() });
}

type AdminStats = {
  totalStudents: number;
  totalTeachers: number;
  totalRevenue: number;
  totalResources: number;
  totalCertificates: number;
  totalCourses: number;
};

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(() => readAdminAggCache<AdminStats>("stats"));

  useEffect(() => {
    if (readAdminAggCache<AdminStats>("stats")) return;

    let cancelled = false;
    const supabase = createClient();
    Promise.all([
      supabase.from("students").select("id", { count: "exact", head: true }),
      supabase.from("teachers").select("id", { count: "exact", head: true }),
      supabase.from("payments").select("amount").eq("status", "paid"),
      supabase.from("resources").select("id", { count: "exact", head: true }),
      supabase.from("certificates").select("id", { count: "exact", head: true }),
      supabase.from("courses").select("id", { count: "exact", head: true }),
    ]).then(([students, teachers, payments, resources, certificates, courses]) => {
      if (cancelled) return;
      const revenue = (payments.data ?? []).reduce((s, p) => s + Number(p.amount), 0);
      const next: AdminStats = {
        totalStudents: students.count ?? 0,
        totalTeachers: teachers.count ?? 0,
        totalRevenue: revenue,
        totalResources: resources.count ?? 0,
        totalCertificates: certificates.count ?? 0,
        totalCourses: courses.count ?? 0,
      };
      writeAdminAggCache("stats", next);
      setStats(next);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return stats;
}

type RevenuePoint = { date: string; revenue: number };

export function useAdminRevenueTrend() {
  const [data, setData] = useState<RevenuePoint[] | null>(() =>
    readAdminAggCache<RevenuePoint[]>("revenueTrend")
  );

  useEffect(() => {
    if (readAdminAggCache<RevenuePoint[]>("revenueTrend")) return;

    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("payments")
      .select("amount, payment_date")
      .eq("status", "paid")
      .then(({ data: rows }) => {
        if (cancelled) return;
        const byDate = new Map<string, number>();
        for (const payment of rows ?? []) {
          const date = new Date(payment.payment_date).toISOString().slice(0, 10);
          byDate.set(date, (byDate.get(date) ?? 0) + Number(payment.amount));
        }
        const next = Array.from(byDate.entries())
          .map(([date, revenue]) => ({ date, revenue }))
          .sort((a, b) => a.date.localeCompare(b.date));
        writeAdminAggCache("revenueTrend", next);
        setData(next);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return data;
}


export function useAdminStudents() {
  const [data, setData] = useState<Student[]>([]);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    createClient()
      .from("students")
      .select("*")
      .order("display_name")
      .then(({ data: rows }) => setData((rows ?? []).map(mapStudent)));
  }, [version]);

  return { data, refresh };
}


export function useAdminCourses() {
  const [data, setData] = useState<Course[]>([]);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    createClient()
      .from("courses")
      .select("*")
      .order("name")
      .then(({ data: rows }) => setData((rows ?? []).map(mapCourse)));
  }, [version]);

  return { data, refresh };
}


export function useAdminIctfTeam() {
  const [data, setData] = useState<IctfTeamMember[]>([]);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    createClient()
      .from("ictf_team_members")
      .select("*")
      .order("sort_order")
      .order("name")
      .then(({ data: rows }) => setData((rows ?? []).map(mapIctfTeamMember)));
  }, [version]);

  return { data, refresh };
}


export function useAdminAcademicStaff() {
  const [data, setData] = useState<AcademicStaffMember[]>([]);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    createClient()
      .from("academic_staff")
      .select("*")
      .order("sort_order")
      .order("name")
      .then(({ data: rows }) => setData((rows ?? []).map(mapAcademicStaffMember)));
  }, [version]);

  return { data, refresh };
}


export function useAdminTeachers() {
  const [data, setData] = useState<Teacher[]>([]);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    createClient()
      .from("teachers")
      .select("*")
      .order("display_name")
      .then(({ data: rows }) => setData((rows ?? []).map(mapTeacher)));
  }, [version]);

  return { data, refresh };
}

/** Alias for admin staff management UI */
export const useAdminStaff = useAdminTeachers;


export function useAdminParents() {
  const [data, setData] = useState<Parent[]>([]);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("parents")
      .select("*")
      .order("display_name")
      .then(async ({ data: parents }) => {
        const mapped = await Promise.all(
          (parents ?? []).map(async (p) => {
            const { data: links } = await supabase
              .from("parent_student_links")
              .select("student_id")
              .eq("parent_id", p.id);
            return mapParent(p, (links ?? []).map((l) => l.student_id));
          })
        );
        setData(mapped);
      });
  }, [version]);

  return { data, refresh };
}


export function useAdminPayments() {
  const [data, setData] = useState<Payment[]>([]);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    createClient()
      .from("payments")
      .select("*")
      .order("payment_date", { ascending: false })
      .then(({ data: rows }) => setData((rows ?? []).map(mapPayment)));
  }, [version]);

  return { data, refresh };
}


export function useAdminResources() {
  const [data, setData] = useState<Resource[]>([]);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    createClient()
      .from("resources")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data: rows }) => setData((rows ?? []).map(mapResource)));
  }, [version]);

  return { data, refresh };
}


export function useAdminResults() {
  const [data, setData] = useState<Result[]>([]);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    createClient()
      .from("results")
      .select("*")
      .order("result_date", { ascending: false })
      .then(({ data: rows }) => setData((rows ?? []).map(mapResult)));
  }, [version]);

  return { data, refresh };
}


export function useAdminCertificates() {
  const [data, setData] = useState<Certificate[]>([]);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    createClient()
      .from("certificates")
      .select("*")
      .order("issued_at", { ascending: false })
      .then(({ data: rows }) => setData((rows ?? []).map(mapCertificate)));
  }, [version]);

  return { data, refresh };
}


export function useAdminCompanies() {
  const [data, setData] = useState<Company[]>([]);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    createClient()
      .from("companies")
      .select("*")
      .order("sort_order")
      .then(({ data: rows }) => setData((rows ?? []).map(mapCompany)));
  }, [version]);

  return { data, refresh };
}

export function useAdminEbooks() {
  const [data, setData] = useState<Ebook[]>([]);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    createClient()
      .from("ebooks")
      .select("*")
      .order("sort_order")
      .then(({ data: rows }) => setData((rows ?? []).map(mapEbook)));
  }, [version]);

  return { data, refresh };
}


export function useAdminClassPrograms() {
  const [data, setData] = useState<ClassProgram[]>([]);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    createClient()
      .from("class_programs")
      .select("*")
      .order("sort_order")
      .then(({ data: rows }) => setData((rows ?? []).map(mapClassProgram)));
  }, [version]);

  return { data, refresh };
}


export function useAdminPaperCenters() {
  const [data, setData] = useState<PaperCenter[]>([]);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    createClient()
      .from("paper_centers")
      .select("*")
      .order("sort_order")
      .then(({ data: rows }) => setData((rows ?? []).map(mapPaperCenter)));
  }, [version]);

  return { data, refresh };
}


export function useAdminFeaturedRankings() {
  const [data, setData] = useState<FeaturedRanking[]>([]);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    createClient()
      .from("featured_rankings")
      .select("*")
      .order("sort_order")
      .then(({ data: rows }) => setData((rows ?? []).map(mapFeaturedRanking)));
  }, [version]);

  return { data, refresh };
}


export function useAdminAnalytics() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([supabase.from("courses").select("*"), supabase.from("payments").select("*")]).then(([c, p]) => {
      setCourses((c.data ?? []).map(mapCourse));
      setPayments((p.data ?? []).map(mapPayment));
    });
  }, []);

  return { courses, payments };
}

export type AdminAttendanceWeeklyPoint = { weekStart: string; attendanceRate: number; totalRecords: number };
export type AdminAttendanceCourseBreakdown = {
  courseId: string;
  courseName: string;
  attendanceRate: number;
  totalRecords: number;
};
export type AdminAttendanceAbsenteeRow = {
  id: string;
  studentId: string;
  studentName: string;
  present: number;
  absent: number;
  late: number;
  totalMarked: number;
  attendancePercent: number;
};
export type AdminAttendanceAnalysis = {
  overall: { attendanceRate: number; totalSessions: number; totalRecords: number };
  weeklyTrend: AdminAttendanceWeeklyPoint[];
  byCourse: AdminAttendanceCourseBreakdown[];
  topAbsentees: AdminAttendanceAbsenteeRow[];
};

const EMPTY_ATTENDANCE_ANALYSIS: AdminAttendanceAnalysis = {
  overall: { attendanceRate: 0, totalSessions: 0, totalRecords: 0 },
  weeklyTrend: [],
  byCourse: [],
  topAbsentees: [],
};

function isoWeekStart(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = (day + 6) % 7; // days since Monday
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - diff);
  return d.toISOString().slice(0, 10);
}

/** Institution-wide attendance/absence analysis across all batches, bounded to a date range (default: last 90 days). */
export function useAdminAttendanceAnalysis(options?: { fromDate?: string; toDate?: string }) {
  const fromDate = options?.fromDate;
  const toDate = options?.toDate;
  const [data, setData] = useState<AdminAttendanceAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    void (async () => {
      const supabase = createClient();
      const toStr = toDate ?? new Date().toISOString().slice(0, 10);
      const fromStr =
        fromDate ??
        (() => {
          const d = new Date();
          d.setDate(d.getDate() - 90);
          return d.toISOString().slice(0, 10);
        })();

      const { data: sessionRows } = await supabase
        .from("class_sessions")
        .select("id, batch_id, scheduled_date")
        .gte("scheduled_date", fromStr)
        .lte("scheduled_date", toStr)
        .neq("status", "cancelled");

      const sessions = sessionRows ?? [];
      if (sessions.length === 0) {
        if (!cancelled) {
          setData(EMPTY_ATTENDANCE_ANALYSIS);
          setLoading(false);
        }
        return;
      }

      const sessionDateById = new Map(sessions.map((s) => [s.id, s.scheduled_date as string]));
      const batchIds = [...new Set(sessions.map((s) => s.batch_id))];

      const [{ data: batchRows }, { data: recordRows }] = await Promise.all([
        supabase.from("course_batches").select("id, course_id, courses(name)").in("id", batchIds),
        supabase
          .from("attendance_records")
          .select("session_id, student_id, status")
          .in(
            "session_id",
            sessions.map((s) => s.id)
          ),
      ]);

      if (cancelled) return;

      const courseByBatch = new Map<string, { courseId: string; courseName: string }>();
      for (const b of batchRows ?? []) {
        const courseRaw = (b as { courses?: { name: string } | { name: string }[] | null }).courses;
        const courseName = Array.isArray(courseRaw) ? courseRaw[0]?.name : courseRaw?.name;
        courseByBatch.set(b.id, { courseId: b.course_id, courseName: courseName ?? "Unknown course" });
      }
      const batchBySession = new Map(sessions.map((s) => [s.id, s.batch_id]));

      const records = recordRows ?? [];

      const presentLate = (status: string) => status === "present" || status === "late";

      const overall = {
        attendanceRate:
          records.length > 0
            ? Math.round((records.filter((r) => presentLate(r.status)).length / records.length) * 100)
            : 0,
        totalSessions: sessions.length,
        totalRecords: records.length,
      };

      const weekBuckets = new Map<string, { present: number; total: number }>();
      for (const r of records) {
        const date = sessionDateById.get(r.session_id);
        if (!date) continue;
        const week = isoWeekStart(date);
        const bucket = weekBuckets.get(week) ?? { present: 0, total: 0 };
        bucket.total += 1;
        if (presentLate(r.status)) bucket.present += 1;
        weekBuckets.set(week, bucket);
      }
      const weeklyTrend: AdminAttendanceWeeklyPoint[] = Array.from(weekBuckets.entries())
        .map(([weekStart, { present, total }]) => ({
          weekStart,
          attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0,
          totalRecords: total,
        }))
        .sort((a, b) => a.weekStart.localeCompare(b.weekStart));

      const courseBuckets = new Map<string, { courseName: string; present: number; total: number }>();
      for (const r of records) {
        const batchId = batchBySession.get(r.session_id);
        const course = batchId ? courseByBatch.get(batchId) : undefined;
        if (!course) continue;
        const bucket = courseBuckets.get(course.courseId) ?? { courseName: course.courseName, present: 0, total: 0 };
        bucket.total += 1;
        if (presentLate(r.status)) bucket.present += 1;
        courseBuckets.set(course.courseId, bucket);
      }
      const byCourse: AdminAttendanceCourseBreakdown[] = Array.from(courseBuckets.entries())
        .map(([courseId, { courseName, present, total }]) => ({
          courseId,
          courseName,
          attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0,
          totalRecords: total,
        }))
        .sort((a, b) => b.totalRecords - a.totalRecords);

      const studentBuckets = new Map<string, { present: number; absent: number; late: number }>();
      for (const r of records) {
        const bucket = studentBuckets.get(r.student_id) ?? { present: 0, absent: 0, late: 0 };
        if (r.status === "present") bucket.present += 1;
        else if (r.status === "absent") bucket.absent += 1;
        else if (r.status === "late") bucket.late += 1;
        studentBuckets.set(r.student_id, bucket);
      }

      const studentIds = [...studentBuckets.keys()];
      const { data: studentRows } =
        studentIds.length > 0
          ? await supabase.from("students").select("id, display_name").in("id", studentIds)
          : { data: [] as { id: string; display_name: string }[] };

      if (cancelled) return;

      const nameById = new Map((studentRows ?? []).map((s) => [s.id, s.display_name]));

      const topAbsentees: AdminAttendanceAbsenteeRow[] = Array.from(studentBuckets.entries())
        .map(([studentId, { present, absent, late }]) => {
          const totalMarked = present + absent + late;
          return {
            id: studentId,
            studentId,
            studentName: nameById.get(studentId) ?? "Unknown student",
            present,
            absent,
            late,
            totalMarked,
            attendancePercent: totalMarked > 0 ? Math.round(((present + late) / totalMarked) * 100) : 0,
          };
        })
        .sort((a, b) => a.attendancePercent - b.attendancePercent || b.absent - a.absent);

      setData({ overall, weeklyTrend, byCourse, topAbsentees });
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [fromDate, toDate, version]);

  return { data, loading, refresh };
}


export function useContactInquiries() {
  const [data, setData] = useState<ContactInquiry[]>([]);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    createClient()
      .from("contact_inquiries")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data: rows, error }) => {
        if (error) {
          console.error("contact_inquiries fetch failed:", error.message);
          setData([]);
          return;
        }
        setData((rows ?? []).map(mapContactInquiry));
      });
  }, [version]);

  return { data, refresh };
}

export function useAdminMarketingAnnouncements() {
  const [data, setData] = useState<MarketingAnnouncement[]>([]);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    createClient()
      .from("marketing_announcements")
      .select("*")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data: rows, error }) => {
        if (error) {
          console.error("marketing_announcements fetch failed:", error.message);
          setData([]);
          return;
        }
        setData((rows ?? []).map(mapMarketingAnnouncement));
      });
  }, [version]);

  return { data, refresh };
}

export function useAdminHeadlineNews() {
  const [data, setData] = useState<HeadlineNews[]>([]);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    createClient()
      .from("headline_news")
      .select("*")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data: rows, error }) => {
        if (error) {
          console.error("headline_news fetch failed:", error.message);
          setData([]);
          return;
        }
        setData((rows ?? []).map(mapHeadlineNews));
      });
  }, [version]);

  return { data, refresh };
}

export function useAdminBlogCategories() {
  const [data, setData] = useState<BlogCategory[]>([]);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    createClient()
      .from("blog_categories")
      .select("*")
      .order("sort_order")
      .order("name")
      .then(({ data: rows, error }) => {
        if (error) {
          console.error("blog_categories fetch failed:", error.message);
          setData([]);
          return;
        }
        setData((rows ?? []).map(mapBlogCategory));
      });
  }, [version]);

  return { data, refresh };
}

export function useAdminBlogPosts() {
  const [data, setData] = useState<BlogPost[]>([]);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    createClient()
      .from("blog_posts")
      .select("*, blog_categories ( name, slug )")
      .order("created_at", { ascending: false })
      .then(({ data: rows, error }) => {
        if (error) {
          console.error("blog_posts fetch failed:", error.message);
          setData([]);
          return;
        }
        setData((rows ?? []).map(mapBlogPost));
      });
  }, [version]);

  return { data, refresh };
}

