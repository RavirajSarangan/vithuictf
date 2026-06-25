import { createClient } from "@/lib/supabase/server";
import {
  mapClassProgram,
  mapCompany,
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
  Company,
  Course,
  FAQ,
  FeaturedRanking,
  HomeAbout,
  NetworkStats,
  PaperCenter,
  SiteStats,
  SuccessStory,
} from "@/types";

export type MarketingHomeData = {
  siteStats: SiteStats | null;
  homeAbout: HomeAbout | null;
  networkStats: NetworkStats | null;
  paperCenters: PaperCenter[];
  featuredRankings: FeaturedRanking[];
  successStories: SuccessStory[];
  faqs: FAQ[];
  classPrograms: ClassProgram[];
  courses: Course[];
  companies: Company[];
  marketingComingSoonEnabled: boolean;
};

export const EMPTY_MARKETING_HOME_DATA: MarketingHomeData = {
  siteStats: null,
  homeAbout: null,
  networkStats: null,
  paperCenters: [],
  featuredRankings: [],
  successStories: [],
  faqs: [],
  classPrograms: [],
  courses: [],
  companies: [],
  marketingComingSoonEnabled: true,
};

const FETCH_TIMEOUT_MS = 6_000;

async function fetchMarketingHomeData(): Promise<MarketingHomeData> {
  const supabase = await createClient();

  const [
    siteStatsRes,
    homeAboutRes,
    networkStatsRes,
    paperCentersRes,
    featuredRankingsRes,
    successStoriesRes,
    faqsRes,
    classProgramsRes,
    coursesRes,
    companiesRes,
    platformSettingsRes,
  ] = await Promise.all([
    supabase.from("site_stats").select("*").eq("id", 1).maybeSingle(),
    supabase.from("home_about").select("*").eq("id", 1).maybeSingle(),
    supabase.from("network_stats").select("*").eq("id", 1).maybeSingle(),
    supabase.from("paper_centers").select("*").order("sort_order"),
    supabase.from("featured_rankings").select("*").order("sort_order"),
    supabase.from("success_stories").select("*"),
    supabase.from("faqs").select("*").order("sort_order"),
    supabase.from("class_programs").select("*").order("sort_order"),
    supabase.from("courses").select("*"),
    supabase.from("companies").select("*").order("sort_order"),
    supabase.from("platform_settings").select("marketing_coming_soon_enabled").eq("id", 1).maybeSingle(),
  ]);

  return {
    siteStats: siteStatsRes.data ? mapSiteStats(siteStatsRes.data) : null,
    homeAbout: homeAboutRes.data ? mapHomeAbout(homeAboutRes.data) : null,
    networkStats: networkStatsRes.data ? mapNetworkStats(networkStatsRes.data) : null,
    paperCenters: (paperCentersRes.data ?? []).map(mapPaperCenter),
    featuredRankings: (featuredRankingsRes.data ?? []).map(mapFeaturedRanking),
    successStories: (successStoriesRes.data ?? []).map(mapSuccessStory),
    faqs: (faqsRes.data ?? []).map(mapFaq),
    classPrograms: (classProgramsRes.data ?? []).map(mapClassProgram),
    courses: (coursesRes.data ?? []).map(mapCourse),
    companies: (companiesRes.data ?? []).map(mapCompany),
    marketingComingSoonEnabled:
      platformSettingsRes.data?.marketing_coming_soon_enabled ?? true,
  };
}

export async function getMarketingHomeData(): Promise<MarketingHomeData> {
  try {
    const result = await Promise.race([
      fetchMarketingHomeData(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("marketing data timeout")), FETCH_TIMEOUT_MS);
      }),
    ]);
    return result;
  } catch (error) {
    console.error("getMarketingHomeData failed:", error);
    return EMPTY_MARKETING_HOME_DATA;
  }
}
