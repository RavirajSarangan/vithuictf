"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  mapCertificate,
  mapClassProgram,
  mapCompany,
  mapContactInquiry,
  mapCourse,
  mapFeaturedRanking,
  mapMarketingAnnouncement,
  mapPaperCenter,
  mapPayment,
  mapResource,
  mapResult,
  mapParent,
  mapStudent,
  mapTeacher,
} from "@/lib/supabase/mappers";
import type {
  Certificate,
  ClassProgram,
  Company,
  ContactInquiry,
  Course,
  FeaturedRanking,
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

