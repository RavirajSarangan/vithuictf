"use server";

import { revalidatePath } from "next/cache";
import { logAdminAction } from "@/lib/audit";
import { requireAdmin, requireTrackingStaff } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/server";
import {
  addDays,
  getMondayOfWeek,
  suggestPerformance,
} from "@/lib/social-tracking-utils";
import type { LiveSyncPlatformSlug } from "@/lib/social-live-sync";
import {
  mapSocialContentEntry,
  mapSocialContentType,
  mapSocialFollowerMetric,
  mapSocialPlatform,
  mapSocialTrackingWeek,
} from "@/lib/supabase/mappers";
import type {
  FollowerHistoryPoint,
  SocialContentEntry,
  SocialContentType,
  SocialFollowerMetric,
  SocialPerformance,
  SocialPlatform,
  SocialTrackingWeek,
} from "@/types";

const TRACKING_PATHS = ["/staff/tracking", "/admin/social-tracking"] as const;

async function getConfiguredLiveSyncPlatforms(): Promise<LiveSyncPlatformSlug[]> {
  const [{ isYouTubeLiveSyncConfigured }, { isFacebookLiveSyncConfigured }, { isLinkedInLiveSyncConfigured }] =
    await Promise.all([
      import("@/lib/youtube-api"),
      import("@/lib/facebook-api"),
      import("@/lib/linkedin-api"),
    ]);

  const slugs: LiveSyncPlatformSlug[] = [];
  if (isYouTubeLiveSyncConfigured()) slugs.push("youtube");
  if (isFacebookLiveSyncConfigured()) slugs.push("facebook");
  if (isLinkedInLiveSyncConfigured()) slugs.push("linkedin");
  return slugs;
}

function revalidateTracking() {
  for (const path of TRACKING_PATHS) {
    revalidatePath(path);
  }
}

async function initializeFollowerMetricsForWeek(
  supabase: Awaited<ReturnType<typeof createClient>>,
  weekId: string,
  weekStart: string,
  userId: string
) {
  const { data: platforms } = await supabase
    .from("social_platforms")
    .select("id")
    .order("sort_order");

  if (!platforms?.length) return;

  const previousWeekStart = addDays(weekStart, -7);
  const { data: previousWeek } = await supabase
    .from("social_tracking_weeks")
    .select("id")
    .eq("week_start", previousWeekStart)
    .maybeSingle();

  let previousMetrics: Record<string, number> = {};
  if (previousWeek) {
    const { data: prevRows } = await supabase
      .from("social_follower_metrics")
      .select("platform_id, current_count")
      .eq("week_id", previousWeek.id);

    previousMetrics = Object.fromEntries(
      (prevRows ?? []).map((row) => [row.platform_id, row.current_count])
    );
  }

  const rows = platforms.map((platform) => {
    const previousCount = previousMetrics[platform.id] ?? 0;
    return {
      week_id: weekId,
      platform_id: platform.id,
      previous_count: previousCount,
      current_count: previousCount,
      performance: "stable" as SocialPerformance,
      updated_by: userId,
    };
  });

  await supabase.from("social_follower_metrics").upsert(rows, {
    onConflict: "week_id,platform_id",
    ignoreDuplicates: true,
  });
}

export async function getOrCreateWeek(weekStart?: string): Promise<SocialTrackingWeek> {
  const profile = await requireTrackingStaff();
  const supabase = await createClient();
  const start = weekStart ?? getMondayOfWeek();

  const { data: existing } = await supabase
    .from("social_tracking_weeks")
    .select("*")
    .eq("week_start", start)
    .maybeSingle();

  if (existing) {
    return mapSocialTrackingWeek(existing);
  }

  const { data: created, error } = await supabase
    .from("social_tracking_weeks")
    .insert({ week_start: start })
    .select("*")
    .single();

  if (error || !created) {
    throw new Error(error?.message ?? "Failed to create tracking week");
  }

  await initializeFollowerMetricsForWeek(supabase, created.id, start, profile.id);

  await logAdminAction("social_week_created", "social_tracking_week", created.id, { weekStart: start });
  revalidateTracking();

  return mapSocialTrackingWeek(created);
}

export async function listReferenceData(): Promise<{
  platforms: SocialPlatform[];
  contentTypes: SocialContentType[];
  liveSyncPlatforms: LiveSyncPlatformSlug[];
}> {
  await requireTrackingStaff();
  const supabase = await createClient();

  const [{ data: platforms }, { data: contentTypes }, liveSyncPlatforms] = await Promise.all([
    supabase.from("social_platforms").select("*").order("sort_order"),
    supabase.from("social_content_types").select("*").order("sort_order"),
    getConfiguredLiveSyncPlatforms(),
  ]);

  return {
    platforms: (platforms ?? []).map(mapSocialPlatform),
    contentTypes: (contentTypes ?? []).map(mapSocialContentType),
    liveSyncPlatforms,
  };
}

export async function getContentEntries(weekId: string): Promise<SocialContentEntry[]> {
  await requireTrackingStaff();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("social_content_entries")
    .select("*, social_content_types(slug)")
    .eq("week_id", weekId);

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapSocialContentEntry);
}

export async function getFollowerMetrics(weekId: string): Promise<SocialFollowerMetric[]> {
  await requireTrackingStaff();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("social_follower_metrics")
    .select("*, social_platforms(slug, name)")
    .eq("week_id", weekId)
    .order("platform_id");

  if (error) throw new Error(error.message);

  const mapped = (data ?? []).map(mapSocialFollowerMetric);
  const { data: platforms } = await supabase.from("social_platforms").select("*").order("sort_order");

  if (!platforms?.length) return mapped;

  const byPlatform = new Map(mapped.map((m) => [m.platformId, m]));
  return platforms.map((p) => {
    const existing = byPlatform.get(p.id);
    if (existing) return existing;
    return {
      id: "",
      weekId,
      platformId: p.id,
      platformSlug: p.slug,
      platformName: p.name,
      previousCount: 0,
      currentCount: 0,
      performance: null,
      updatedAt: new Date().toISOString(),
    };
  });
}

export async function updateContentEntry(input: {
  weekId: string;
  contentTypeId: string;
  dayOfWeek: number;
  postCount: number;
}): Promise<SocialContentEntry> {
  const profile = await requireTrackingStaff();
  const supabase = await createClient();
  const postCount = Math.max(0, Math.min(99, Math.floor(input.postCount)));

  const { data, error } = await supabase
    .from("social_content_entries")
    .upsert(
      {
        week_id: input.weekId,
        content_type_id: input.contentTypeId,
        day_of_week: input.dayOfWeek,
        post_count: postCount,
        posted: postCount > 0,
        updated_by: profile.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "week_id,content_type_id,day_of_week" }
    )
    .select("*, social_content_types(slug)")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to update content entry");

  await logAdminAction("social_content_update", "social_content_entry", data.id, {
    weekId: input.weekId,
    contentTypeId: input.contentTypeId,
    dayOfWeek: input.dayOfWeek,
    postCount,
  });
  revalidateTracking();

  return mapSocialContentEntry(data);
}

/** @deprecated Use updateContentEntry with postCount instead */
export async function toggleContentEntry(input: {
  weekId: string;
  contentTypeId: string;
  dayOfWeek: number;
  posted: boolean;
}): Promise<SocialContentEntry> {
  return updateContentEntry({
    weekId: input.weekId,
    contentTypeId: input.contentTypeId,
    dayOfWeek: input.dayOfWeek,
    postCount: input.posted ? 1 : 0,
  });
}

export async function updateFollowerMetric(input: {
  weekId: string;
  platformId: string;
  previousCount: number;
  currentCount: number;
  performance?: SocialPerformance | null;
}): Promise<SocialFollowerMetric> {
  const profile = await requireTrackingStaff();
  const supabase = await createClient();

  const performance =
    input.performance ?? suggestPerformance(input.previousCount, input.currentCount);

  const { data, error } = await supabase
    .from("social_follower_metrics")
    .upsert(
      {
        week_id: input.weekId,
        platform_id: input.platformId,
        previous_count: Math.max(0, input.previousCount),
        current_count: Math.max(0, input.currentCount),
        performance,
        updated_by: profile.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "week_id,platform_id" }
    )
    .select("*, social_platforms(slug, name)")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to update follower metric");

  await logAdminAction("social_follower_update", "social_follower_metric", data.id, {
    weekId: input.weekId,
    platformId: input.platformId,
    previousCount: input.previousCount,
    currentCount: input.currentCount,
    performance,
  });
  revalidateTracking();

  return mapSocialFollowerMetric(data);
}

async function syncPlatformFollowerCount(
  weekId: string,
  platformSlug: string,
  fetchLiveCount: () => Promise<number>,
  auditEvent: string
): Promise<SocialFollowerMetric> {
  const profile = await requireTrackingStaff();
  const supabase = await createClient();

  const { data: platform } = await supabase
    .from("social_platforms")
    .select("id, slug")
    .eq("slug", platformSlug)
    .maybeSingle();

  if (!platform) {
    throw new Error(`${platformSlug} platform not found in tracking settings.`);
  }

  const { data: existing } = await supabase
    .from("social_follower_metrics")
    .select("previous_count, current_count")
    .eq("week_id", weekId)
    .eq("platform_id", platform.id)
    .maybeSingle();

  const liveCount = await fetchLiveCount();
  const previousCount = existing?.current_count ?? existing?.previous_count ?? liveCount;

  const result = await updateFollowerMetric({
    weekId,
    platformId: platform.id,
    previousCount,
    currentCount: liveCount,
  });

  await logAdminAction(auditEvent, "social_follower_metric", result.id, {
    weekId,
    liveCount,
    syncedBy: profile.id,
    platformSlug,
  });

  return result;
}

export async function syncYouTubeFollowerCount(weekId: string): Promise<SocialFollowerMetric> {
  const { fetchYouTubeSubscriberCount } = await import("@/lib/youtube-api");
  const result = await syncPlatformFollowerCount(
    weekId,
    "youtube",
    fetchYouTubeSubscriberCount,
    "social_youtube_sync"
  );
  revalidateTracking();
  return result;
}

export async function syncFacebookFollowerCount(weekId: string): Promise<SocialFollowerMetric> {
  const { fetchFacebookPageFollowerCount } = await import("@/lib/facebook-api");
  const result = await syncPlatformFollowerCount(
    weekId,
    "facebook",
    fetchFacebookPageFollowerCount,
    "social_facebook_sync"
  );
  revalidateTracking();
  return result;
}

export async function syncLinkedInFollowerCount(weekId: string): Promise<SocialFollowerMetric> {
  const { fetchLinkedInFollowerCount } = await import("@/lib/linkedin-api");
  const result = await syncPlatformFollowerCount(
    weekId,
    "linkedin",
    fetchLinkedInFollowerCount,
    "social_linkedin_sync"
  );
  revalidateTracking();
  return result;
}

export async function syncLiveFollowerCounts(weekId: string): Promise<SocialFollowerMetric[]> {
  await requireTrackingStaff();

  const configured = await getConfiguredLiveSyncPlatforms();
  const syncTasks: Array<Promise<SocialFollowerMetric>> = [];

  if (configured.includes("youtube")) {
    syncTasks.push(syncYouTubeFollowerCount(weekId));
  }
  if (configured.includes("facebook")) {
    syncTasks.push(syncFacebookFollowerCount(weekId));
  }
  if (configured.includes("linkedin")) {
    syncTasks.push(syncLinkedInFollowerCount(weekId));
  }

  if (syncTasks.length === 0) return [];

  const results = await Promise.allSettled(syncTasks);

  return results
    .filter((r): r is PromiseFulfilledResult<SocialFollowerMetric> => r.status === "fulfilled")
    .map((r) => r.value);
}

export async function deleteTrackingWeek(weekId: string): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("social_tracking_weeks").delete().eq("id", weekId);
  if (error) throw new Error(error.message);

  await logAdminAction("social_week_deleted", "social_tracking_week", weekId);
  revalidateTracking();
}

export async function getFollowerHistory(limitWeeks = 12): Promise<FollowerHistoryPoint[]> {
  await requireTrackingStaff();
  const supabase = await createClient();

  const { data: weeks } = await supabase
    .from("social_tracking_weeks")
    .select("id, week_start")
    .order("week_start", { ascending: false })
    .limit(limitWeeks);

  if (!weeks?.length) return [];

  const weekIds = weeks.map((w) => w.id);
  const weekStartById = new Map(weeks.map((w) => [w.id, w.week_start]));

  const { data: metrics } = await supabase
    .from("social_follower_metrics")
    .select("week_id, current_count, social_platforms(slug, name)")
    .in("week_id", weekIds);

  return (metrics ?? []).map((row) => {
    const rawPlatform = row.social_platforms as unknown;
    const platform =
      rawPlatform && typeof rawPlatform === "object" && !Array.isArray(rawPlatform)
        ? (rawPlatform as { slug: string; name: string })
        : null;
    return {
      weekStart: weekStartById.get(row.week_id) ?? "",
      platformSlug: platform?.slug ?? "",
      platformName: platform?.name ?? "",
      currentCount: row.current_count,
    };
  });
}

export async function exportTrackingWeekCsv(weekStart: string): Promise<string> {
  await requireAdmin();
  const supabase = await createClient();

  const { data: week } = await supabase
    .from("social_tracking_weeks")
    .select("id, week_start")
    .eq("week_start", weekStart)
    .maybeSingle();

  if (!week) throw new Error("Tracking week not found");

  const [{ data: contentTypes }, { data: entries }, { data: metrics }, { data: platforms }] =
    await Promise.all([
      supabase.from("social_content_types").select("*").order("sort_order"),
      supabase.from("social_content_entries").select("*").eq("week_id", week.id),
      supabase.from("social_follower_metrics").select("*").eq("week_id", week.id),
      supabase.from("social_platforms").select("*").order("sort_order"),
    ]);

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const lines: string[] = [
    `Week starting,${week.week_start}`,
    "",
    "Content Checklist (poster count per day)",
    `Type,${dayNames.join(",")},Week total`,
  ];

  for (const type of contentTypes ?? []) {
    const dayCounts = dayNames.map((_, i) => {
      const entry = (entries ?? []).find(
        (e) => e.content_type_id === type.id && e.day_of_week === i
      );
      const count =
        entry && "post_count" in entry && typeof entry.post_count === "number"
          ? entry.post_count
          : entry?.posted
            ? 1
            : 0;
      return String(count);
    });
    const weekTotal = dayCounts.reduce((sum, c) => sum + (parseInt(c, 10) || 0), 0);
    lines.push([type.name, ...dayCounts, String(weekTotal)].join(","));
  }

  lines.push("", "Follower Engagements", "Platform,Previous,Current,Performance");
  for (const platform of platforms ?? []) {
    const metric = (metrics ?? []).find((m) => m.platform_id === platform.id);
    lines.push(
      [
        platform.name,
        metric?.previous_count ?? 0,
        metric?.current_count ?? 0,
        metric?.performance ?? "",
      ].join(",")
    );
  }

  return lines.join("\n");
}
