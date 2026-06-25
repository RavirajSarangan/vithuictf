"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/auth-provider";

const EMPTY_BOOKMARKS = new Set<string>();

export function useBookmarks() {
  const { user } = useAuth();
  const [resourceIds, setResourceIds] = useState<Set<string>>(EMPTY_BOOKMARKS);
  const [loading, setLoading] = useState(false);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    createClient()
      .from("bookmarks")
      .select("resource_id")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (cancelled) return;
        setResourceIds(new Set((data ?? []).map((r) => r.resource_id)));
        setLoadedUserId(user.id);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const refresh = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const { data } = await createClient()
      .from("bookmarks")
      .select("resource_id")
      .eq("user_id", user.id);
    setResourceIds(new Set((data ?? []).map((r) => r.resource_id)));
    setLoadedUserId(user.id);
    setLoading(false);
  }, [user]);

  const toggleBookmark = useCallback(
    async (resourceId: string) => {
      if (!user) return;

      const supabase = createClient();

      setResourceIds((prev) => {
        if (prev.has(resourceId)) {
          void supabase
            .from("bookmarks")
            .delete()
            .eq("user_id", user.id)
            .eq("resource_id", resourceId);
          const next = new Set(prev);
          next.delete(resourceId);
          return next;
        }

        void supabase.from("bookmarks").insert({ user_id: user.id, resource_id: resourceId });
        return new Set(prev).add(resourceId);
      });
    },
    [user]
  );

  const activeIds = user && loadedUserId === user.id ? resourceIds : EMPTY_BOOKMARKS;
  const activeLoading = user != null && (loading || loadedUserId !== user.id);

  return {
    resourceIds: activeIds,
    loading: activeLoading,
    toggleBookmark,
    isBookmarked: (id: string) => activeIds.has(id),
    refresh,
  };
}
