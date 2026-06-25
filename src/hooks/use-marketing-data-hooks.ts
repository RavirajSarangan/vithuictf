"use client";

import { useCallback, useEffect, useState } from "react";
import { useCachedList } from "@/hooks/use-cached-list";
import { createClient } from "@/lib/supabase/client";
import {
  mapClassProgram,
  mapCourse,
  mapFaq,
  mapFeaturedRanking,
  mapHomeAbout,
  mapNetworkStats,
  mapPaperCenter,
  mapSiteStats,
  mapSuccessStory,
} from "@/lib/supabase/mappers";
import type {
  ClassProgram,
  Course,
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
    supabase.from("courses").select("*").then(({ data: rows }) => setData((rows ?? []).map(mapCourse)));
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

