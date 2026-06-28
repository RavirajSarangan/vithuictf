"use client";

import { Users, TrendingUp, TrendingDown, CheckCircle2, Radio } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { SocialBrandIcon } from "@/components/social-tracking/social-brand-icon";
import type { FollowerOverview } from "@/lib/social-tracking-utils";
import { formatRelativeTime } from "@/lib/social-tracking-utils";
import { LIVE_SYNC_INTERVAL_MS, type LiveSyncPlatformSlug, type LiveSyncState } from "@/lib/social-live-sync";
import { getPlatformMeta } from "@/lib/social-platform-meta";
import { cn } from "@/lib/utils";

interface TrackingOverviewCardsProps {
  followerOverview: FollowerOverview;
  checklistPosted: number;
  checklistTotal: number;
  checklistPercent: number;
  checklistPostCount: number;
  liveSyncState: LiveSyncState;
  liveSyncPlatforms: readonly LiveSyncPlatformSlug[];
}

export function TrackingOverviewCards({
  followerOverview,
  checklistPosted,
  checklistTotal,
  checklistPercent,
  checklistPostCount,
  liveSyncState,
  liveSyncPlatforms,
}: TrackingOverviewCardsProps) {
  const netLabel =
    followerOverview.netChange > 0
      ? `+${followerOverview.netChange.toLocaleString()} this week`
      : followerOverview.netChange < 0
        ? `${followerOverview.netChange.toLocaleString()} this week`
        : "No change this week";

  const anySyncing = liveSyncPlatforms.some((slug) => liveSyncState[slug].syncing);

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Total audience"
        value={followerOverview.totalAudience.toLocaleString()}
        subtitle={`${followerOverview.platformsUp} up · ${followerOverview.platformsDown} down`}
        icon={Users}
        className="border-icvf-border bg-white"
      />
      <StatCard
        title="Net follower change"
        value={
          followerOverview.netChange > 0
            ? `+${followerOverview.netChange.toLocaleString()}`
            : followerOverview.netChange.toLocaleString()
        }
        subtitle={netLabel}
        icon={followerOverview.netChange >= 0 ? TrendingUp : TrendingDown}
        className="border-icvf-border bg-white"
      />
      <StatCard
        title="Checklist completion"
        value={`${checklistPercent}%`}
        subtitle={`${checklistPostCount} posters · ${checklistPosted}/${checklistTotal} days active`}
        icon={CheckCircle2}
        className="border-icvf-border bg-white"
      />
      <div className="rounded-2xl border border-icvf-border bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-icvf-text-light">Live platform sync</p>
            <p className="mt-2 text-3xl font-bold text-icvf-navy">Auto</p>
            <ul className="mt-2 space-y-1.5">
              {liveSyncPlatforms.length === 0 ? (
                <li className="text-xs text-icvf-text-light">
                  No live APIs configured. Enter follower counts manually below.
                </li>
              ) : (
                liveSyncPlatforms.map((slug) => {
                const meta = getPlatformMeta(slug);
                const state = liveSyncState[slug];
                return (
                  <li
                    key={slug}
                    className="flex items-center gap-2 text-xs text-icvf-text-light"
                  >
                    <SocialBrandIcon slug={slug} kind="platform" size="sm" />
                    <span className="font-medium text-icvf-navy">{meta?.label ?? slug}</span>
                    <span>·</span>
                    {state.syncing ? (
                      <span className="text-icvf-accent">syncing…</span>
                    ) : (
                      <span>{formatRelativeTime(state.lastSynced)}</span>
                    )}
                  </li>
                );
              })
              )}
            </ul>
          </div>
          <div
            className={cn(
              "shrink-0 rounded-xl p-3",
              anySyncing ? "bg-emerald-500/15" : "bg-icvf-navy/10"
            )}
          >
            <Radio
              className={cn(
                "size-5",
                anySyncing ? "animate-pulse text-emerald-600" : "text-icvf-navy"
              )}
            />
          </div>
        </div>
        <p className="mt-3 text-xs text-icvf-text-light">
          {liveSyncPlatforms.length > 0
            ? `Configured platforms sync on load and every ${LIVE_SYNC_INTERVAL_MS / 60_000} minutes.`
            : "Add YouTube, Facebook, or LinkedIn API keys in Vercel to enable auto-sync."}
        </p>
      </div>
    </div>
  );
}
