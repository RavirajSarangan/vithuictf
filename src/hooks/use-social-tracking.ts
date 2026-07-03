"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { getActionErrorMessage } from "@/lib/action-error";
import {
  getContentEntries,
  getFollowerHistory,
  getFollowerMetrics,
  getOrCreateWeek,
  listReferenceData,
  syncLiveFollowerCounts,
  updateContentEntry,
  updateFollowerMetric,
} from "@/lib/actions/social-tracking";
import {
  computeChecklistCompletion,
  computeFollowerOverview,
  computeWeeklySummary,
  getMondayOfWeek,
} from "@/lib/social-tracking-utils";
import {
  createInitialLiveSyncState,
  LIVE_SYNC_INTERVAL_MS,
  type LiveSyncPlatformSlug,
  type LiveSyncState,
} from "@/lib/social-live-sync";
import type {
  FollowerHistoryPoint,
  SocialContentEntry,
  SocialContentType,
  SocialFollowerMetric,
  SocialPerformance,
  SocialPlatform,
  SocialTrackingWeek,
  WeeklyTrackingSummary,
} from "@/types";

export function useSocialTracking(weekStart?: string) {
  const [week, setWeek] = useState<SocialTrackingWeek | null>(null);
  const [platforms, setPlatforms] = useState<SocialPlatform[]>([]);
  const [contentTypes, setContentTypes] = useState<SocialContentType[]>([]);
  const [entries, setEntries] = useState<SocialContentEntry[]>([]);
  const [followerMetrics, setFollowerMetrics] = useState<SocialFollowerMetric[]>([]);
  const [history, setHistory] = useState<FollowerHistoryPoint[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);
  const [selectedWeekStart, setSelectedWeekStart] = useState(weekStart ?? getMondayOfWeek());
  const [liveSyncState, setLiveSyncState] = useState<LiveSyncState>(createInitialLiveSyncState);
  const [liveSyncPlatforms, setLiveSyncPlatforms] = useState<LiveSyncPlatformSlug[]>([]);
  const syncInFlightRef = useRef(false);
  const syncErrorToastShownRef = useRef(false);

  const refresh = useCallback(async () => {
    const isFirstLoad = !hasLoadedRef.current;
    if (isFirstLoad) {
      setInitialLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);
    try {
      const weekResult = await getOrCreateWeek(selectedWeekStart);
      if (!weekResult.ok) {
        setError(weekResult.error);
        return;
      }

      const [refsResult, entriesResult, metricsResult, historyResult] = await Promise.all([
        listReferenceData(),
        getContentEntries(weekResult.data.id),
        getFollowerMetrics(weekResult.data.id),
        getFollowerHistory(12),
      ]);

      if (!refsResult.ok) {
        setError(refsResult.error);
        return;
      }
      if (!entriesResult.ok) {
        setError(entriesResult.error);
        return;
      }
      if (!metricsResult.ok) {
        setError(metricsResult.error);
        return;
      }
      if (!historyResult.ok) {
        setError(historyResult.error);
        return;
      }

      setWeek(weekResult.data);
      setPlatforms(refsResult.data.platforms);
      setContentTypes(refsResult.data.contentTypes);
      setLiveSyncPlatforms(refsResult.data.liveSyncPlatforms);
      setEntries(entriesResult.data);
      setFollowerMetrics(metricsResult.data);
      setHistory(historyResult.data);
    } catch (err) {
      setError(getActionErrorMessage(err, "Failed to load tracking data"));
    } finally {
      hasLoadedRef.current = true;
      setInitialLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedWeekStart]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const summary: WeeklyTrackingSummary = useMemo(
    () => computeWeeklySummary(entries, contentTypes),
    [entries, contentTypes]
  );

  const followerOverview = useMemo(
    () => computeFollowerOverview(followerMetrics),
    [followerMetrics]
  );

  const checklistCompletion = useMemo(
    () => computeChecklistCompletion(entries, contentTypes),
    [entries, contentTypes]
  );

  const syncLivePlatforms = useCallback(
    async (options?: { silent?: boolean; weekId?: string }) => {
      const targetWeekId = options?.weekId ?? week?.id;
      if (!targetWeekId || syncInFlightRef.current || liveSyncPlatforms.length === 0) return [];

      syncInFlightRef.current = true;
      setLiveSyncState((prev) => {
        const next = { ...prev };
        for (const slug of liveSyncPlatforms) {
          next[slug] = { ...prev[slug], syncing: true };
        }
        return next;
      });

      try {
        const result = await syncLiveFollowerCounts(targetWeekId);
        if (!result.ok) {
          if (!syncErrorToastShownRef.current) {
            syncErrorToastShownRef.current = true;
            toast.error(result.error, {
              description: "Check YOUTUBE_API_KEY and channel settings in Vercel / .env.local",
            });
          }
          if (!options?.silent) {
            throw new Error(result.error);
          }
          return [];
        }

        const updated = result.data;
        const now = new Date().toISOString();

        setLiveSyncState((prev) => {
          const next = { ...prev };
          for (const slug of liveSyncPlatforms) {
            next[slug] = {
              ...prev[slug],
              syncing: false,
              lastSynced: updated.some((m) => m.platformSlug === slug)
                ? now
                : prev[slug].lastSynced,
            };
          }
          return next;
        });

        if (updated.length > 0) {
          setFollowerMetrics((prev) => {
            let next = [...prev];
            for (const metric of updated) {
              next = next.filter((m) => m.platformId !== metric.platformId);
              next.push(metric);
            }
            return next;
          });
          void getFollowerHistory(12).then((historyResult) => {
            if (historyResult.ok) setHistory(historyResult.data);
          });
        }

        return updated;
      } catch (err) {
        setLiveSyncState((prev) => {
          const next = { ...prev };
          for (const slug of liveSyncPlatforms) {
            next[slug] = { ...prev[slug], syncing: false };
          }
          return next;
        });
        const message = getActionErrorMessage(err, "Live follower sync failed");
        if (!syncErrorToastShownRef.current) {
          syncErrorToastShownRef.current = true;
          toast.error(message, {
            description: "Check YOUTUBE_API_KEY and channel settings in Vercel / .env.local",
          });
        }
        if (!options?.silent) throw err;
        return [];
      } finally {
        syncInFlightRef.current = false;
      }
    },
    [week?.id, liveSyncPlatforms]
  );

  useEffect(() => {
    if (initialLoading || !week?.id || liveSyncPlatforms.length === 0) return;

    void syncLivePlatforms({ silent: true, weekId: week.id });

    const interval = window.setInterval(() => {
      void syncLivePlatforms({ silent: true, weekId: week.id });
    }, LIVE_SYNC_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [initialLoading, week?.id, liveSyncPlatforms.length, syncLivePlatforms]);

  const handleUpdateEntryCount = useCallback(
    async (contentTypeId: string, dayOfWeek: number, postCount: number) => {
      if (!week) return;
      setEntries((prev) => {
        const existing = prev.find(
          (e) => e.contentTypeId === contentTypeId && e.dayOfWeek === dayOfWeek
        );
        if (existing) {
          return prev.map((e) =>
            e.id === existing.id
              ? { ...e, postCount, posted: postCount > 0 }
              : e
          );
        }
        return [
          ...prev,
          {
            id: `temp-${contentTypeId}-${dayOfWeek}`,
            weekId: week.id,
            contentTypeId,
            dayOfWeek,
            posted: postCount > 0,
            postCount,
            updatedAt: new Date().toISOString(),
          },
        ];
      });

      const result = await updateContentEntry({
        weekId: week.id,
        contentTypeId,
        dayOfWeek,
        postCount,
      });
      if (!result.ok) {
        void refresh();
        throw new Error(result.error);
      }
      setEntries((prev) => {
        const filtered = prev.filter(
          (e) => !(e.contentTypeId === contentTypeId && e.dayOfWeek === dayOfWeek)
        );
        return [...filtered, result.data];
      });
    },
    [week, refresh]
  );

  const handleUpdateFollower = useCallback(
    async (
      platformId: string,
      previousCount: number,
      currentCount: number,
      performance?: SocialPerformance | null
    ) => {
      if (!week) return;
      const result = await updateFollowerMetric({
        weekId: week.id,
        platformId,
        previousCount,
        currentCount,
        performance,
      });
      if (!result.ok) {
        throw new Error(result.error);
      }
      setFollowerMetrics((prev) => {
        const filtered = prev.filter((m) => m.platformId !== platformId);
        return [...filtered, result.data];
      });
      void getFollowerHistory(12).then((historyResult) => {
        if (historyResult.ok) setHistory(historyResult.data);
      });
    },
    [week]
  );

  return {
    week,
    platforms,
    contentTypes,
    entries,
    followerMetrics,
    history,
    summary,
    followerOverview,
    checklistCompletion,
    liveSyncState,
    liveSyncPlatforms,
    syncLivePlatforms,
    loading: initialLoading,
    isRefreshing,
    error,
    selectedWeekStart,
    setSelectedWeekStart,
    refresh,
    handleUpdateEntryCount,
    handleUpdateFollower,
  };
}

export function useContentManagers() {
  const [data, setData] = useState<
    Array<{
      id: string;
      userId: string;
      displayName: string;
      email: string;
      active: boolean;
      createdAt: string;
    }>
  >([]);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    void (async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: rows } = await supabase
        .from("content_managers")
        .select("*")
        .order("display_name");
      setData(
        (rows ?? []).map((row) => ({
          id: row.id,
          userId: row.user_id,
          displayName: row.display_name,
          email: row.email,
          active: row.active,
          createdAt: row.created_at,
        }))
      );
    })();
  }, [version]);

  return { data, refresh };
}
