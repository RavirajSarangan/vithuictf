import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/server";
import { filterVisibleFolders, filterVisibleItems } from "@/lib/pass-papers-utils";
import {
  mapClassProgram,
  mapCompany,
  mapCourse,
  mapFaq,
  mapFeaturedRanking,
  mapHomeAbout,
  mapIctfTeamMember,
  mapMarketingAnnouncement,
  mapNetworkStats,
  mapPaperCenter,
  mapPassPaperFolder,
  mapPassPaperItem,
  mapSiteStats,
  mapSuccessStory,
  mergeCourseSchedules,
} from "@/lib/supabase/mappers";
import type {
  ClassProgram,
  Company,
  Course,
  FAQ,
  FeaturedRanking,
  HomeAbout,
  IctfTeamMember,
  MarketingAnnouncement,
  NetworkStats,
  PaperCenter,
  PassPaperFolder,
  PassPaperItem,
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
  resultsCheckEnabled: boolean;
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
  marketingComingSoonEnabled: false,
  resultsCheckEnabled: false,
};

const FETCH_TIMEOUT_MS = 6_000;

async function fetchMarketingHomeData(): Promise<MarketingHomeData> {
  const supabase = createPublicClient();

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
    courseSchedulesRes,
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
    supabase.from("courses").select("*").eq("show_on_home", true).order("sort_order").order("name"),
    supabase.from("course_schedule_summaries").select("*"),
    supabase.from("companies").select("*").order("sort_order"),
    supabase
      .from("platform_settings")
      .select("marketing_coming_soon_enabled, results_check_enabled")
      .eq("id", 1)
      .maybeSingle(),
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
    courses: mergeCourseSchedules(
      (coursesRes.data ?? []).map(mapCourse),
      courseSchedulesRes.data
    ),
    companies: (companiesRes.data ?? []).map(mapCompany),
    marketingComingSoonEnabled:
      platformSettingsRes.data?.marketing_coming_soon_enabled ?? false,
    resultsCheckEnabled: platformSettingsRes.data?.results_check_enabled ?? false,
  };
}

async function getMarketingHomeDataUncached(): Promise<MarketingHomeData> {
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

/** Dedupes parallel layout + page fetches within the same request. */
export const getMarketingHomeData = cache(getMarketingHomeDataUncached);

async function getPaperCentersOnlyUncached(): Promise<PaperCenter[]> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("paper_centers")
      .select("*")
      .order("sort_order");
    if (error) throw error;
    return (data ?? []).map(mapPaperCenter);
  } catch (error) {
    console.error("getPaperCentersOnly failed:", error);
    return [];
  }
}

/** Lightweight fetch for SEO location / paper-center pages. */
export const getPaperCentersOnly = cache(getPaperCentersOnlyUncached);

async function getIctfTeamMembersUncached(): Promise<IctfTeamMember[]> {
  try {
    const result = await Promise.race([
      (async () => {
        const supabase = createPublicClient();
        const { data, error } = await supabase
          .from("ictf_team_members")
          .select("*")
          .order("sort_order")
          .order("name");
        if (error) throw error;
        return (data ?? []).map(mapIctfTeamMember);
      })(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("ictf team data timeout")), FETCH_TIMEOUT_MS);
      }),
    ]);
    return result;
  } catch (error) {
    console.error("getIctfTeamMembers failed:", error);
    return [];
  }
}

/** Public ICTF Team member profiles for the marketing team page. */
export const getIctfTeamMembers = cache(getIctfTeamMembersUncached);

async function getHomeAboutOnlyUncached(): Promise<HomeAbout | null> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase.from("home_about").select("*").eq("id", 1).maybeSingle();
    if (error) throw error;
    return data ? mapHomeAbout(data) : null;
  } catch (error) {
    console.error("getHomeAboutOnly failed:", error);
    return null;
  }
}

/** Single-row fetch for founder/about SEO pages. */
export const getHomeAboutOnly = cache(getHomeAboutOnlyUncached);

async function getPublicCoursesUncached(): Promise<Course[]> {
  try {
    const result = await Promise.race([
      (async () => {
        const supabase = createPublicClient();
        const [{ data: courseRows, error }, { data: scheduleRows }] = await Promise.all([
          supabase
            .from("courses")
            .select("*")
            .eq("is_public", true)
            .not("slug", "is", null)
            .order("sort_order")
            .order("name"),
          supabase.from("course_schedule_summaries").select("*"),
        ]);
        if (error) throw error;
        return mergeCourseSchedules(
          (courseRows ?? []).map(mapCourse).filter((course) => course.slug),
          scheduleRows
        );
      })(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("public courses timeout")), FETCH_TIMEOUT_MS);
      }),
    ]);
    return result;
  } catch (error) {
    console.error("getPublicCourses failed:", error);
    return [];
  }
}

/** Courses shown in the public /courses catalog (SEO pages, sitemap, llms.txt). */
export const getPublicCourses = cache(getPublicCoursesUncached);

async function getPublicCourseBySlugUncached(slug: string): Promise<Course | null> {
  try {
    const result = await Promise.race([
      (async () => {
        const supabase = createPublicClient();
        const [{ data: courseRow, error }, { data: scheduleRows }] = await Promise.all([
          supabase
            .from("courses")
            .select("*")
            .eq("is_public", true)
            .eq("slug", slug)
            .maybeSingle(),
          supabase.from("course_schedule_summaries").select("*"),
        ]);
        if (error) throw error;
        if (!courseRow) return null;
        const [course] = mergeCourseSchedules([mapCourse(courseRow)], scheduleRows);
        return course ?? null;
      })(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("public course timeout")), FETCH_TIMEOUT_MS);
      }),
    ]);
    return result;
  } catch (error) {
    console.error("getPublicCourseBySlug failed:", error);
    return null;
  }
}

/** Single public course for the /courses/[slug] detail page. */
export const getPublicCourseBySlug = cache(getPublicCourseBySlugUncached);

async function getFaqsOnlyUncached(): Promise<FAQ[]> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase.from("faqs").select("*").order("sort_order");
    if (error) throw error;
    return (data ?? []).map(mapFaq);
  } catch (error) {
    console.error("getFaqsOnly failed:", error);
    return [];
  }
}

/** Lightweight FAQ fetch for llms.txt / AEO surfaces. */
export const getFaqsOnly = cache(getFaqsOnlyUncached);

export type MarketingPassPapersData = {
  folders: PassPaperFolder[];
  items: PassPaperItem[];
};

export const EMPTY_MARKETING_PASS_PAPERS_DATA: MarketingPassPapersData = {
  folders: [],
  items: [],
};

async function getMarketingPassPapersDataUncached(): Promise<MarketingPassPapersData> {
  try {
    const result = await Promise.race([
      (async () => {
        const supabase = createPublicClient();
        const [{ data: folderRows, error: folderError }, { data: itemRows, error: itemError }] =
          await Promise.all([
            supabase
              .from("pass_paper_folders")
              .select("*")
              .eq("published", true)
              .order("sort_order")
              .order("title"),
            supabase
              .from("pass_paper_items")
              .select("*")
              .eq("published", true)
              .order("sort_order")
              .order("title"),
          ]);

        if (folderError) throw folderError;
        if (itemError) throw itemError;

        const folders = filterVisibleFolders(
          (folderRows ?? []).map((row) => mapPassPaperFolder(row)),
          true
        );
        const allFolders = (folderRows ?? []).map((row) => mapPassPaperFolder(row));
        const items = filterVisibleItems(
          (itemRows ?? []).map((row) => mapPassPaperItem(row)),
          allFolders,
          true
        );

        return { folders, items };
      })(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("pass papers data timeout")), FETCH_TIMEOUT_MS);
      }),
    ]);
    return result;
  } catch (error) {
    console.error("getMarketingPassPapersData failed:", error);
    return EMPTY_MARKETING_PASS_PAPERS_DATA;
  }
}

/** Server-side pass papers browse data for the public marketing page. */
export const getMarketingPassPapersData = cache(getMarketingPassPapersDataUncached);

export async function getActiveMarketingAnnouncement(): Promise<MarketingAnnouncement | null> {
  return getActiveMarketingAnnouncementCached();
}

const getActiveMarketingAnnouncementCached = cache(async (): Promise<MarketingAnnouncement | null> => {
  try {
    const result = await Promise.race([
      (async () => {
        const supabase = createPublicClient();
        const { data, error } = await supabase
          .from("marketing_announcements")
          .select("*")
          .order("priority", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("getActiveMarketingAnnouncement failed:", error.message);
          return null;
        }

        return data ? mapMarketingAnnouncement(data) : null;
      })(),
      new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), FETCH_TIMEOUT_MS);
      }),
    ]);
    return result;
  } catch (error) {
    console.error("getActiveMarketingAnnouncement failed:", error);
    return null;
  }
});
