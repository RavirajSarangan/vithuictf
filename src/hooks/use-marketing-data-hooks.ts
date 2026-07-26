"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  mapAcademicStaffMember,
  mapClassProgram,
  mapCourse,
  mergeCourseSchedules,
  mapEbook,
  mapFaq,
  mapFeaturedRanking,
  mapHomeAbout,
  mapNetworkStats,
  mapPaperCenter,
  mapSiteStats,
  mapSuccessStory,
} from "@/lib/supabase/mappers";
import type {
  AcademicStaffMember,
  ClassProgram,
  Course,
  Ebook,
  FAQ,
  FeaturedRanking,
  HomeAbout,
  NetworkStats,
  PaperCenter,
  SiteStats,
  SuccessStory,
} from "@/types";
import { useMarketingData } from "@/contexts/marketing-data-context";

export function useCourses() {
  const marketing = useMarketingData();
  const [data, setData] = useState<Course[]>([]);

  useEffect(() => {
    if (marketing) return;

    const supabase = createClient();
    Promise.all([
      supabase
        .from("courses")
        .select("*")
        .eq("show_on_home", true)
        .order("sort_order")
        .order("name"),
      supabase.from("course_schedule_summaries").select("*"),
    ]).then(([{ data: rows }, { data: schedules }]) =>
      setData(mergeCourseSchedules((rows ?? []).map(mapCourse), schedules))
    );
  }, [marketing]);

  return marketing?.courses ?? data;
}


export function useSiteStats() {
  const marketing = useMarketingData();
  const [data, setData] = useState<SiteStats | null>(null);

  useEffect(() => {
    if (marketing) return;

    const supabase = createClient();
    supabase
      .from("site_stats")
      .select("*")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data: row }) => setData(row ? mapSiteStats(row) : null));
  }, [marketing]);

  return marketing?.siteStats ?? data;
}


export function useSuccessStories() {
  const marketing = useMarketingData();
  const [data, setData] = useState<SuccessStory[]>([]);

  useEffect(() => {
    if (marketing) return;

    const supabase = createClient();
    supabase.from("success_stories").select("*").then(({ data: rows }) => setData((rows ?? []).map(mapSuccessStory)));
  }, [marketing]);

  return marketing?.successStories ?? data;
}


export function useFaqs() {
  const marketing = useMarketingData();
  const [data, setData] = useState<FAQ[]>([]);

  useEffect(() => {
    if (marketing) return;

    const supabase = createClient();
    supabase.from("faqs").select("*").order("sort_order").then(({ data: rows }) => setData((rows ?? []).map(mapFaq)));
  }, [marketing]);

  return marketing?.faqs ?? data;
}

export function useClassPrograms() {
  const marketing = useMarketingData();
  const [data, setData] = useState<ClassProgram[]>([]);

  useEffect(() => {
    if (marketing) return;

    createClient()
      .from("class_programs")
      .select("*")
      .order("sort_order")
      .then(({ data: rows }) => setData((rows ?? []).map(mapClassProgram)));
  }, [marketing]);

  return marketing?.classPrograms ?? data;
}


export function usePaperCenters() {
  const marketing = useMarketingData();
  const [data, setData] = useState<PaperCenter[]>([]);

  useEffect(() => {
    if (marketing) return;

    createClient()
      .from("paper_centers")
      .select("*")
      .order("sort_order")
      .then(({ data: rows }) => setData((rows ?? []).map(mapPaperCenter)));
  }, [marketing]);

  return marketing?.paperCenters ?? data;
}

export function useEbooks(): Ebook[] {
  const marketing = useMarketingData();
  const [data, setData] = useState<Ebook[]>([]);

  useEffect(() => {
    if (marketing) return;

    createClient()
      .from("ebooks")
      .select("*")
      .eq("published", true)
      .order("sort_order")
      .then(({ data: rows }) => setData((rows ?? []).map(mapEbook)));
  }, [marketing]);

  return marketing?.ebooks ?? data;
}


export function useNetworkStats() {
  const marketing = useMarketingData();
  const [data, setData] = useState<NetworkStats | null>(null);

  useEffect(() => {
    if (marketing) return;

    createClient()
      .from("network_stats")
      .select("*")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data: row }) => setData(row ? mapNetworkStats(row) : null));
  }, [marketing]);

  return marketing?.networkStats ?? data;
}


export function useFeaturedRankings() {
  const marketing = useMarketingData();
  const [data, setData] = useState<FeaturedRanking[]>([]);

  useEffect(() => {
    if (marketing) return;

    createClient()
      .from("featured_rankings")
      .select("*")
      .order("sort_order")
      .then(({ data: rows }) => setData((rows ?? []).map(mapFeaturedRanking)));
  }, [marketing]);

  return marketing?.featuredRankings ?? data;
}


export function useHomeAbout() {
  const marketing = useMarketingData();
  const [data, setData] = useState<HomeAbout | null>(null);

  useEffect(() => {
    if (marketing) return;

    createClient()
      .from("home_about")
      .select("*")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data: row }) => setData(row ? mapHomeAbout(row) : null));
  }, [marketing]);

  return marketing?.homeAbout ?? data;
}


export function useAcademicStaff() {
  const marketing = useMarketingData();
  const [data, setData] = useState<AcademicStaffMember[]>([]);

  useEffect(() => {
    if (marketing) return;

    createClient()
      .from("academic_staff")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .order("name")
      .then(({ data: rows }) => setData((rows ?? []).map(mapAcademicStaffMember)));
  }, [marketing]);

  return marketing?.academicStaff ?? data;
}

