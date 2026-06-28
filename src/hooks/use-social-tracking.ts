"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

  const refresh = useCallback(async () => {
    const isFirstLoad = !hasLoadedRef.current;
    if (isFirstLoad) {
      setInitialLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);
    try {
      const weekData = await getOrCreateWeek(selectedWeekStart);
      const [refs, entryRows, metricRows, historyRows] = await Promise.all([
        listReferenceData(),
        getContentEntries(weekData.id),
        getFollowerMetrics(weekData.id),
        getFollowerHistory(12),
      ]);

      setWeek(weekData);
      setPlatforms(refs.platforms);
      setContentTypes(refs.contentTypes);
      setLiveSyncPlatforms(refs.liveSyncPlatforms);
      setEntries(entryRows);
      setFollowerMetrics(metricRows);
      setHistory(historyRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tracking data");
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
        const updated = await syncLiveFollowerCounts(targetWeekId);
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
          void getFollowerHistory(12).then(setHistory);
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

      try {
        const updated = await updateContentEntry({
          weekId: week.id,
          contentTypeId,
          dayOfWeek,
          postCount,
        });
        setEntries((prev) => {
          const filtered = prev.filter(
            (e) => !(e.contentTypeId === contentTypeId && e.dayOfWeek === dayOfWeek)
          );
          return [...filtered, updated];
        });
      } catch {
        void refresh();
      }
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
      const updated = await updateFollowerMetric({
        weekId: week.id,
        platformId,
        previousCount,
        currentCount,
        performance,
      });
      setFollowerMetrics((prev) => {
        const filtered = prev.filter((m) => m.platformId !== platformId);
        return [...filtered, updated];
      });
      void getFollowerHistory(12).then(setHistory);
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
