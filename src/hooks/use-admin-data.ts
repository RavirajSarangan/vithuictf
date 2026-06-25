"use client";

import { useCallback, useEffect, useState } from "react";
import { useCachedList } from "@/hooks/use-cached-list";
import { createClient } from "@/lib/supabase/client";
import {
  mapCertificate,
  mapClassProgram,
  mapCompany,
  mapContactInquiry,
  mapCourse,
  mapFeaturedRanking,
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
  PaperCenter,
  Payment,
  Parent,
  Resource,
  Result,
  Student,
  Teacher,
} from "@/types";
import { useAuth } from "@/providers/auth-provider";

export function useAdminStats() {
  const [stats, setStats] = useState<{
    totalStudents: number;
    totalTeachers: number;
    totalRevenue: number;
    totalResources: number;
    totalCertificates: number;
    totalCourses: number;
  } | null>(null);

  useEffect(() => {

    const supabase = createClient();
    Promise.all([
      supabase.from("students").select("id", { count: "exact", head: true }),
      supabase.from("teachers").select("id", { count: "exact", head: true }),
      supabase.from("payments").select("amount").eq("status", "paid"),
      supabase.from("resources").select("id", { count: "exact", head: true }),
      supabase.from("certificates").select("id", { count: "exact", head: true }),
      supabase.from("courses").select("id", { count: "exact", head: true }),
    ]).then(([students, teachers, payments, resources, certificates, courses]) => {
      const revenue = (payments.data ?? []).reduce((s, p) => s + Number(p.amount), 0);
      setStats({
        totalStudents: students.count ?? 0,
        totalTeachers: teachers.count ?? 0,
        totalRevenue: revenue,
        totalResources: resources.count ?? 0,
        totalCertificates: certificates.count ?? 0,
        totalCourses: courses.count ?? 0,
      });
    });
  }, []);

  return stats;
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

