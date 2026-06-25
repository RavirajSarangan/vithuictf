"use client";

import { useCallback, useEffect, useState } from "react";

const CACHE_TTL_MS = 60_000;

type CacheEntry<T> = {
  data: T[];
  at: number;
};

const listCache = new Map<string, CacheEntry<unknown>>();

function readCache<T>(cacheKey: string | null, enabled: boolean) {
  if (!enabled || !cacheKey) {
    return { data: [] as T[], isFresh: false, hasEntry: false };
  }
  const hit = listCache.get(cacheKey);
  if (!hit) {
    return { data: [] as T[], isFresh: false, hasEntry: false };
  }
  const isFresh = Date.now() - hit.at < CACHE_TTL_MS;
  return { data: hit.data as T[], isFresh, hasEntry: true };
}

export function useCachedList<T>(
  cacheKey: string | null,
  fetcher: () => Promise<T[]>,
  enabled = true
): { data: T[]; isLoading: boolean; error: string | null; retry: () => void } {
  const [version, setVersion] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const snapshot = readCache<T>(cacheKey, enabled);
  const shouldFetch = enabled && Boolean(cacheKey) && !snapshot.isFresh;

  const retry = useCallback(() => {
    if (cacheKey) {
      listCache.delete(cacheKey);
    }
    setError(null);
    setVersion((value) => value + 1);
  }, [cacheKey]);

  useEffect(() => {
    if (!shouldFetch || !cacheKey) return;

    let cancelled = false;
    void fetcher()
      .then((rows) => {
        if (cancelled) return;
        listCache.set(cacheKey, { data: rows, at: Date.now() });
        setError(null);
        setVersion((value) => value + 1);
      })
      .catch((fetchError: unknown) => {
        if (cancelled) return;
        const message =
          fetchError instanceof Error ? fetchError.message : "Failed to load data";
        console.error(`useCachedList(${cacheKey}) failed:`, fetchError);
        setError(message);
        setVersion((value) => value + 1);
      });

    return () => {
      cancelled = true;
    };
    // fetcher is keyed by cacheKey; omit from deps to avoid refetch loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldFetch, cacheKey, version]);

  const current = readCache<T>(cacheKey, enabled);
  return {
    data: current.data,
    isLoading: shouldFetch && !current.hasEntry && !error,
    error,
    retry,
  };
}

export function invalidateCachedList(cacheKey: string) {
  listCache.delete(cacheKey);
}
