import type {
  SocialContentEntry,
  SocialContentType,
  SocialFollowerMetric,
  SocialPerformance,
  WeeklyTrackingSummary,
} from "@/types";

export function getMondayOfWeek(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function suggestPerformance(previous: number, current: number): SocialPerformance {
  if (current > previous) return "up";
  if (current < previous) return "down";
  return "stable";
}

export function computeWeeklySummary(
  entries: SocialContentEntry[],
  contentTypes: SocialContentType[]
): WeeklyTrackingSummary {
  const slugById = new Map(contentTypes.map((t) => [t.id, t.slug]));
  const counts: WeeklyTrackingSummary = {
    totalUploads: 0,
    youtubeVideos: 0,
    youtubeShorts: 0,
    tiktokVideos: 0,
    instaReels: 0,
  };

  for (const entry of entries) {
    const count = entry.postCount ?? (entry.posted ? 1 : 0);
    if (count <= 0) continue;
    counts.totalUploads += count;
    const slug = entry.contentTypeSlug ?? slugById.get(entry.contentTypeId);
    if (slug === "youtube_video") counts.youtubeVideos += count;
    else if (slug === "youtube_shorts") counts.youtubeShorts += count;
    else if (slug === "tiktok_video") counts.tiktokVideos += count;
    else if (slug === "insta_reel") counts.instaReels += count;
  }

  return counts;
}

export interface FollowerOverview {
  totalAudience: number;
  netChange: number;
  platformsUp: number;
  platformsDown: number;
}

export function computeFollowerOverview(metrics: SocialFollowerMetric[]): FollowerOverview {
  let totalAudience = 0;
  let netChange = 0;
  let platformsUp = 0;
  let platformsDown = 0;

  for (const metric of metrics) {
    totalAudience += metric.currentCount;
    const delta = metric.currentCount - metric.previousCount;
    netChange += delta;
    if (delta > 0) platformsUp += 1;
    else if (delta < 0) platformsDown += 1;
  }

  return { totalAudience, netChange, platformsUp, platformsDown };
}

export function computeChecklistCompletion(
  entries: SocialContentEntry[],
  contentTypes: SocialContentType[]
): { posted: number; total: number; percent: number; postCount: number } {
  const total = contentTypes.length * DAY_LABELS.length;
  if (total === 0) return { posted: 0, total: 0, percent: 0, postCount: 0 };

  const postCount = entries.reduce(
    (sum, e) => sum + (e.postCount ?? (e.posted ? 1 : 0)),
    0
  );
  const posted = entries.filter(
    (e) => (e.postCount ?? 0) > 0 || e.posted
  ).length;

  return {
    posted,
    total,
    percent: Math.round((posted / total) * 100),
    postCount,
  };
}

export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "Never";
  const diffMs = Date.now() - new Date(iso).getTime();
  if (diffMs < 60_000) return "Just now";
  if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)}m ago`;
  if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)}h ago`;
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatWeekRange(weekStart: string): string {
  const start = new Date(`${weekStart}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  return `${fmt(start)} – ${fmt(end)}`;
}

export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
