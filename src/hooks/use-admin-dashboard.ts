"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  mapCalendarSession,
  mapCertificate,
  mapContactInquiry,
  mapPayment,
  mapStudent,
} from "@/lib/supabase/mappers";
import type {
  CalendarSession,
  Certificate,
  ContactInquiry,
  Payment,
  Student,
} from "@/types";

const ADMIN_DASH_TTL_MS = 60_000;
const dashCache = new Map<string, { value: unknown; at: number }>();

function readDashCache<T>(key: string): T | null {
  const hit = dashCache.get(key);
  if (hit && Date.now() - hit.at < ADMIN_DASH_TTL_MS) {
    return hit.value as T;
  }
  return null;
}

function writeDashCache(key: string, value: unknown) {
  dashCache.set(key, { value, at: Date.now() });
}

export type DashboardActivityItem = {
  id: string;
  type: "student" | "payment" | "inquiry" | "certificate" | "exam_batch";
  title: string;
  subtitle: string;
  href: string;
  timestamp: string;
};

export type AdminDashboardStats = {
  totalStudents: number;
  totalTeachers: number;
  totalRevenue: number;
  outstandingSessionFeesLkr: number;
  totalResources: number;
  totalCertificates: number;
  totalCourses: number;
  pendingPayments: number;
  overduePayments: number;
  unreadInquiries: number;
  pendingRegistrations: number;
};

export type AdminSuperAdminStats = {
  paperCenterCount: number;
  examBatchCount: number;
  passPaperFolderCount: number;
  passPaperItemCount: number;
};

export type AdminAcademicsStats = {
  activeBatches: number;
  todaysSessions: number;
  missingAttendance: number;
  weeklyAttendanceRate: number;
};

export type AdminDashboardOverview = {
  stats: AdminDashboardStats | null;
  recentStudents: Student[];
  recentPayments: Payment[];
  recentInquiries: ContactInquiry[];
  activity: DashboardActivityItem[];
  upcomingSessions: CalendarSession[];
  enrollmentData: { name: string; students: number }[];
  paymentStatus: { name: string; value: number }[];
  superAdmin: AdminSuperAdminStats | null;
  academics: AdminAcademicsStats | null;
  loading: boolean;
};

function buildActivityFeed(
  students: Student[],
  payments: Payment[],
  inquiries: ContactInquiry[],
  certificates: Certificate[]
): DashboardActivityItem[] {
  const items: DashboardActivityItem[] = [];

  for (const student of students) {
    if (!student.createdAt) continue;
    items.push({
      id: `student-${student.id}`,
      type: "student",
      title: `New student: ${student.displayName}`,
      subtitle: student.courseName || "Enrolled",
      href: `/admin/students/${student.id}`,
      timestamp: student.createdAt,
    });
  }

  for (const payment of payments) {
    items.push({
      id: `payment-${payment.id}`,
      type: "payment",
      title: `${payment.status === "paid" ? "Payment" : payment.status} — ${payment.studentName}`,
      subtitle: `Rs. ${payment.amount.toLocaleString()}`,
      href: "/admin/payments",
      timestamp: payment.date,
    });
  }

  for (const inquiry of inquiries) {
    items.push({
      id: `inquiry-${inquiry.id}`,
      type: "inquiry",
      title: `Inquiry from ${inquiry.name}`,
      subtitle: inquiry.message.slice(0, 60),
      href: "/admin/inquiries",
      timestamp: inquiry.createdAt,
    });
  }

  for (const cert of certificates) {
    items.push({
      id: `cert-${cert.id}`,
      type: "certificate",
      title: `Certificate issued — ${cert.studentName}`,
      subtitle: cert.courseName,
      href: "/admin/certificates",
      timestamp: cert.issuedAt,
    });
  }

  return items
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 12);
}

function filterUpcomingSessions(sessions: CalendarSession[], limit = 8): CalendarSession[] {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  return sessions
    .filter((s) => {
      if (s.sessionDate) {
        const d = new Date(s.sessionDate);
        d.setHours(0, 0, 0, 0);
        return d.getTime() >= todayStart.getTime();
      }
      return true;
    })
    .slice(0, limit);
}

export function useAdminDashboardOverview(includeSuperAdmin = false) {
  const cacheKey = `overview:${includeSuperAdmin}`;
  const [overview, setOverview] = useState<AdminDashboardOverview>(() => {
    const cached = readDashCache<AdminDashboardOverview>(cacheKey);
    return (
      cached ?? {
        stats: null,
        recentStudents: [],
        recentPayments: [],
        recentInquiries: [],
        activity: [],
        upcomingSessions: [],
        enrollmentData: [],
        paymentStatus: [],
        superAdmin: null,
        academics: null,
        loading: true,
      }
    );
  });

  useEffect(() => {
    if (readDashCache<AdminDashboardOverview>(cacheKey)) {
      setOverview((prev) => ({ ...prev, loading: false }));
      return;
    }

    let cancelled = false;
    const supabase = createClient();

    async function load() {
      const queries = [
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase.from("teachers").select("id", { count: "exact", head: true }),
        supabase.from("payments").select("amount").eq("status", "paid"),
        supabase.from("resources").select("id", { count: "exact", head: true }),
        supabase.from("certificates").select("id", { count: "exact", head: true }),
        supabase.from("courses").select("id", { count: "exact", head: true }),
        supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "overdue"),
        supabase.from("contact_inquiries").select("id", { count: "exact", head: true }).eq("status", "new"),
        supabase.from("students").select("*").order("created_at", { ascending: false }).limit(8),
        supabase
          .from("payments")
          .select("*")
          .in("status", ["pending", "overdue"])
          .order("payment_date", { ascending: false })
          .limit(8),
        supabase
          .from("contact_inquiries")
          .select("*")
          .eq("status", "new")
          .order("created_at", { ascending: false })
          .limit(8),
        supabase.from("certificates").select("*").order("issued_at", { ascending: false }).limit(5),
        supabase
          .from("calendar_sessions")
          .select("*, subject_categories(name, color)")
          .order("start_time"),
        supabase.from("courses").select("id, name"),
        supabase.from("students").select("course_id"),
        supabase.from("payments").select("status"),
        supabase.from("session_charges").select("amount_lkr").eq("status", "pending"),
        supabase
          .from("students")
          .select("id", { count: "exact", head: true })
          .eq("registration_status", "pending"),
      ] as const;

      const results = await Promise.all(queries);

      if (cancelled) return;

      const [
        studentsCount,
        teachersCount,
        paidPayments,
        resourcesCount,
        certificatesCount,
        coursesCount,
        pendingCount,
        overdueCount,
        unreadInquiriesCount,
        recentStudentRows,
        recentPaymentRows,
        recentInquiryRows,
        recentCertRows,
        sessionRows,
        courseRows,
        studentCourseRows,
        paymentStatusRows,
        pendingSessionCharges,
        pendingRegistrationsCount,
      ] = results;

      const revenue = (paidPayments.data ?? []).reduce((s, p) => s + Number(p.amount), 0);
      const outstandingSessionFeesLkr = (pendingSessionCharges.data ?? []).reduce(
        (s, c) => s + Number(c.amount_lkr),
        0
      );

      const stats: AdminDashboardStats = {
        totalStudents: studentsCount.count ?? 0,
        totalTeachers: teachersCount.count ?? 0,
        totalRevenue: revenue,
        outstandingSessionFeesLkr,
        totalResources: resourcesCount.count ?? 0,
        totalCertificates: certificatesCount.count ?? 0,
        totalCourses: coursesCount.count ?? 0,
        pendingPayments: pendingCount.count ?? 0,
        overduePayments: overdueCount.count ?? 0,
        unreadInquiries: unreadInquiriesCount.count ?? 0,
        pendingRegistrations: pendingRegistrationsCount.count ?? 0,
      };

      const recentStudents = (recentStudentRows.data ?? []).map(mapStudent);
      const recentPayments = (recentPaymentRows.data ?? []).map(mapPayment);
      const recentInquiries = (recentInquiryRows.data ?? []).map(mapContactInquiry);
      const recentCertificates = (recentCertRows.data ?? []).map(mapCertificate);

      const sessions = (sessionRows.data ?? []).map((r) =>
        mapCalendarSession(r as Parameters<typeof mapCalendarSession>[0])
      );

      const courses = (courseRows.data ?? []).map((row) => ({
        id: row.id as string,
        name: row.name as string,
      }));
      const courseStudentCounts = new Map<string, number>();
      for (const row of studentCourseRows.data ?? []) {
        const cid = row.course_id as string | null;
        if (cid) courseStudentCounts.set(cid, (courseStudentCounts.get(cid) ?? 0) + 1);
      }
      const enrollmentData = courses
        .map((c) => ({
          name: c.name.slice(0, 15),
          students: courseStudentCounts.get(c.id) ?? 0,
        }))
        .filter((e) => e.students > 0)
        .sort((a, b) => b.students - a.students)
        .slice(0, 8);

      const statusCounts = { paid: 0, pending: 0, overdue: 0 };
      for (const row of paymentStatusRows.data ?? []) {
        const status = row.status as keyof typeof statusCounts;
        if (status in statusCounts) statusCounts[status]++;
      }
      const paymentStatus = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

      let superAdmin: AdminSuperAdminStats | null = null;
      if (includeSuperAdmin) {
        const [centers, batches, folders, items] = await Promise.all([
          supabase
            .from("paper_centers")
            .select("id", { count: "exact", head: true })
            .eq("is_active", true),
          supabase.from("exam_paper_batches").select("id", { count: "exact", head: true }),
          supabase.from("pass_paper_folders").select("id", { count: "exact", head: true }),
          supabase.from("pass_paper_items").select("id", { count: "exact", head: true }),
        ]);
        if (!cancelled) {
          superAdmin = {
            paperCenterCount: centers.count ?? 0,
            examBatchCount: batches.count ?? 0,
            passPaperFolderCount: folders.count ?? 0,
            passPaperItemCount: items.count ?? 0,
          };
        }
      }

      const todayStr = new Date().toISOString().slice(0, 10);
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() + 7);
      const weekEndStr = weekEnd.toISOString().slice(0, 10);

      const [
        activeBatchesRes,
        todaysSessionsRes,
        weekSessionsRes,
      ] = await Promise.all([
        supabase
          .from("course_batches")
          .select("id", { count: "exact", head: true })
          .eq("active", true),
        supabase
          .from("class_sessions")
          .select("id")
          .eq("scheduled_date", todayStr)
          .in("status", ["scheduled", "completed"]),
        supabase
          .from("class_sessions")
          .select("id")
          .gte("scheduled_date", todayStr)
          .lte("scheduled_date", weekEndStr)
          .neq("status", "cancelled"),
      ]);

      const todaysSessionIds = (todaysSessionsRes.data ?? []).map((s) => s.id);
      let missingAttendance = todaysSessionIds.length;
      if (todaysSessionIds.length) {
        const { data: markedSessions } = await supabase
          .from("attendance_records")
          .select("session_id")
          .in("session_id", todaysSessionIds);
        const markedSet = new Set((markedSessions ?? []).map((r) => r.session_id));
        missingAttendance = todaysSessionIds.filter((id) => !markedSet.has(id)).length;
      }

      const weekSessionIds = (weekSessionsRes.data ?? []).map((s) => s.id);
      let weeklyAttendanceRate = 0;
      if (weekSessionIds.length) {
        const { data: weekRecords } = await supabase
          .from("attendance_records")
          .select("status")
          .in("session_id", weekSessionIds);
        const presentLate = (weekRecords ?? []).filter(
          (r) => r.status === "present" || r.status === "late"
        ).length;
        const total = weekRecords?.length ?? 0;
        if (total > 0) weeklyAttendanceRate = Math.round((presentLate / total) * 100);
      }

      const academics: AdminAcademicsStats = {
        activeBatches: activeBatchesRes.count ?? 0,
        todaysSessions: todaysSessionIds.length,
        missingAttendance,
        weeklyAttendanceRate,
      };

      const next: AdminDashboardOverview = {
        stats,
        recentStudents,
        recentPayments,
        recentInquiries,
        activity: buildActivityFeed(
          recentStudents,
          recentPayments,
          recentInquiries,
          recentCertificates
        ),
        upcomingSessions: filterUpcomingSessions(sessions),
        enrollmentData,
        paymentStatus,
        superAdmin,
        academics,
        loading: false,
      };

      writeDashCache(cacheKey, next);
      setOverview(next);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [cacheKey, includeSuperAdmin]);

  return overview;
}
