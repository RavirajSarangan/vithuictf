"use client";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ContentChecklistGrid } from "@/components/social-tracking/content-checklist-grid";
import { FollowerEngagementTable } from "@/components/social-tracking/follower-engagement-table";
import { FollowerGrowthChart } from "@/components/social-tracking/follower-growth-chart";
import { TrackingOverviewCards } from "@/components/social-tracking/tracking-overview-cards";
import { WeekSelector } from "@/components/social-tracking/week-selector";
import { WeeklyPerformanceCards } from "@/components/social-tracking/weekly-performance-cards";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSocialTracking } from "@/hooks/use-social-tracking";
import { deleteTrackingWeek, exportTrackingWeekCsv } from "@/lib/actions/social-tracking";

interface SocialTrackingDashboardProps {
  mode: "staff" | "admin";
}

export function SocialTrackingDashboard({ mode }: SocialTrackingDashboardProps) {
  const {
    week,
    contentTypes,
    entries,
    followerMetrics,
    history,
    summary,
    followerOverview,
    checklistCompletion,
    liveSyncState,
    liveSyncPlatforms,
    loading,
    isRefreshing,
    error,
    selectedWeekStart,
    setSelectedWeekStart,
    refresh,
    handleUpdateEntryCount,
    handleUpdateFollower,
  } = useSocialTracking();

  const handleUpdateCount = async (
    contentTypeId: string,
    dayOfWeek: number,
    postCount: number
  ) => {
    try {
      await handleUpdateEntryCount(contentTypeId, dayOfWeek, postCount);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save poster count");
    }
  };

  const handleFollowerUpdate = async (
    platformId: string,
    previousCount: number,
    currentCount: number,
    performance?: Parameters<typeof handleUpdateFollower>[3]
  ) => {
    try {
      await handleUpdateFollower(platformId, previousCount, currentCount, performance);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save follower count");
    }
  };

  const handleExport = async () => {
    try {
      const csv = await exportTrackingWeekCsv(selectedWeekStart);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ictf-tracking-${selectedWeekStart}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Export downloaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    }
  };

  const handleDeleteWeek = async () => {
    if (!week || !confirm("Delete this week and all its tracking data?")) return;
    try {
      await deleteTrackingWeek(week.id);
      toast.success("Week deleted");
      void refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  if (loading && !week) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Social Media Tracking"
        description="Daily content checklist, weekly performance, and live follower growth"
        action={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => void handleExport()}>
              Export CSV
            </Button>
            {mode === "admin" ? (
              <Button type="button" variant="destructive" onClick={() => void handleDeleteWeek()}>
                Delete week
              </Button>
            ) : null}
          </div>
        }
      />

      <WeekSelector weekStart={selectedWeekStart} onChange={setSelectedWeekStart} />

      {isRefreshing ? (
        <div className="flex items-center gap-2 text-sm text-icvf-text-light">
          <Loader2 className="size-4 animate-spin" /> Updating...
        </div>
      ) : null}

      <TrackingOverviewCards
        followerOverview={followerOverview}
        checklistPosted={checklistCompletion.posted}
        checklistTotal={checklistCompletion.total}
        checklistPercent={checklistCompletion.percent}
        checklistPostCount={checklistCompletion.postCount}
        liveSyncState={liveSyncState}
        liveSyncPlatforms={liveSyncPlatforms}
      />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-icvf-navy">Daily content checklist</h2>
        <ContentChecklistGrid
          contentTypes={contentTypes}
          entries={entries}
          onUpdateCount={(typeId, day, count) => void handleUpdateCount(typeId, day, count)}
          showAudit={mode === "admin"}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-icvf-navy">Week performance</h2>
        <WeeklyPerformanceCards summary={summary} />
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-icvf-navy">Follower engagements</h2>
          <p className="text-xs text-icvf-text-light">
            YouTube, Facebook Page, and LinkedIn update automatically when API keys are configured
            — look for the <strong>Live</strong> badge.
          </p>
        </div>
        <FollowerEngagementTable
          metrics={followerMetrics}
          onUpdate={handleFollowerUpdate}
          liveSyncState={liveSyncState}
          liveSyncPlatforms={liveSyncPlatforms}
        />
      </section>

      <FollowerGrowthChart
        metrics={followerMetrics}
        history={history}
        showHistory
      />
    </div>
  );
}
