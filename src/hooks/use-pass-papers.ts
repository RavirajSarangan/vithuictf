"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { mapPassPaperFolder, mapPassPaperItem } from "@/lib/supabase/mappers";
import {
  filterVisibleFolders,
  filterVisibleItems,
} from "@/lib/pass-papers-utils";
import type { PassPaperFolder, PassPaperItem } from "@/types";

export function usePassPaperFoldersAdmin() {
  const [folders, setFolders] = useState<PassPaperFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const patchFolder = useCallback((id: string, patch: Partial<PassPaperFolder>) => {
    setFolders((prev) => prev.map((folder) => (folder.id === id ? { ...folder, ...patch } : folder)));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const isInitialLoad = version === 0;
    if (isInitialLoad) setLoading(true);

    void (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("pass_paper_folders")
        .select("*")
        .order("sort_order")
        .order("title");

      if (cancelled) return;
      setFolders((data ?? []).map((row) => mapPassPaperFolder(row)));
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [version]);

  return { folders, loading, refresh, patchFolder };
}

export function usePassPaperItems(folderId: string | null) {
  const [items, setItems] = useState<PassPaperItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (!folderId) {
      setItems([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("pass_paper_items")
        .select("*")
        .eq("folder_id", folderId)
        .order("sort_order")
        .order("title");

      if (cancelled) return;
      setItems((data ?? []).map((row) => mapPassPaperItem(row)));
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [folderId, version]);

  return { items, loading, refresh };
}

export function usePassPaperBrowse(publishedOnly = true) {
  const [folders, setFolders] = useState<PassPaperFolder[]>([]);
  const [items, setItems] = useState<PassPaperItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    void (async () => {
      const supabase = createClient();
      let folderQuery = supabase.from("pass_paper_folders").select("*").order("sort_order");
      let itemQuery = supabase.from("pass_paper_items").select("*").order("sort_order");

      if (publishedOnly) {
        folderQuery = folderQuery.eq("published", true);
        itemQuery = itemQuery.eq("published", true);
      }

      const [{ data: folderRows }, { data: itemRows }] = await Promise.all([
        folderQuery,
        itemQuery,
      ]);

      if (cancelled) return;

      const mappedFolders = (folderRows ?? []).map((row) => mapPassPaperFolder(row));
      const mappedItems = (itemRows ?? []).map((row) => mapPassPaperItem(row));

      setFolders(filterVisibleFolders(mappedFolders, publishedOnly));
      setItems(filterVisibleItems(mappedItems, mappedFolders, publishedOnly));
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [publishedOnly]);

  const visibleFolders = useMemo(
    () => filterVisibleFolders(folders, publishedOnly),
    [folders, publishedOnly]
  );
  const visibleItems = useMemo(
    () => filterVisibleItems(items, folders, publishedOnly),
    [items, folders, publishedOnly]
  );

  return { folders: visibleFolders, items: visibleItems, loading };
}

export function useAllPassPaperItems(enabled = true) {
  const [items, setItems] = useState<PassPaperItem[]>([]);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      return;
    }

    let cancelled = false;
    void (async () => {
      const supabase = createClient();
      const { data } = await supabase.from("pass_paper_items").select("*").order("sort_order");
      if (cancelled) return;
      setItems((data ?? []).map((row) => mapPassPaperItem(row)));
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, version]);

  return { items, refresh };
}
