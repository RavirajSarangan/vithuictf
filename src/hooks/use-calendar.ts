"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { mapCalendarSession, mapSubjectCategory } from "@/lib/supabase/mappers";
import { summarizeWeeklyMinutes } from "@/lib/calendar/utils";
import { useCachedList } from "@/hooks/use-cached-list";
import type { CalendarSession, SubjectCategory } from "@/types";

export function useSubjectCategories() {
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const fetcher = useCallback(async () => {
    const { data: rows } = await createClient()
      .from("subject_categories")
      .select("*")
      .eq("active", true)
      .order("sort_order");
    return (rows ?? []).map(mapSubjectCategory);
  }, []);

  const { data, isLoading } = useCachedList<SubjectCategory>(
    `subject-categories:active:${version}`,
    fetcher,
    true
  );

  return { data, isLoading, refresh };
}

export function useAdminSubjectCategories() {
  const [data, setData] = useState<SubjectCategory[]>([]);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    createClient()
      .from("subject_categories")
      .select("*")
      .order("sort_order")
      .then(({ data: rows }) => setData((rows ?? []).map(mapSubjectCategory)));
  }, [version]);

  return { data, refresh };
}

export function useCalendarSessions(courseId?: string, categoryId?: string) {
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const fetcher = useCallback(async () => {
    let query = createClient()
      .from("calendar_sessions")
      .select("*, subject_categories(name, color)")
      .order("start_time");
    if (courseId) query = query.or(`course_id.eq.${courseId},course_id.is.null`);
    if (categoryId && categoryId !== "all") query = query.eq("category_id", categoryId);
    const { data: rows } = await query;
    return (rows ?? []).map((r) => mapCalendarSession(r as Parameters<typeof mapCalendarSession>[0]));
  }, [courseId, categoryId]);

  const { data, isLoading } = useCachedList<CalendarSession>(
    `calendar-sessions:${courseId ?? "none"}:${categoryId ?? "all"}:${version}`,
    fetcher,
    true
  );

  return { data, isLoading, refresh };
}

export function useCalendarMinutesSummary(
  sessions: CalendarSession[],
  categories: SubjectCategory[],
  categoryFilter?: string
) {
  return useMemo(
    () => summarizeWeeklyMinutes(sessions, categories, categoryFilter),
    [sessions, categories, categoryFilter]
  );
}
