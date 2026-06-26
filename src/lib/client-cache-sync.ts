"use client";

import { invalidateAllCachedLists } from "@/hooks/use-cached-list";

/** Call after admin saves so student/admin list hooks refetch on next read. */
export function syncClientCachesAfterAdminSave() {
  invalidateAllCachedLists();
}
