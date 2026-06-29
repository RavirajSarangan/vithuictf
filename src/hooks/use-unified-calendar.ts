"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { mapCalendarSession, mapClassSession } from "@/lib/supabase/mappers";
import type { AcademicsCalendarSession } from "@/hooks/use-academics";
import type { CalendarSession } from "@/types";

export type UnifiedCalendarSource = "institute" | "batch";

export type UnifiedCalendarItem =
  | { source: "institute"; date: string; session: CalendarSession }
  | { source: "batch"; date: string; session: AcademicsCalendarSession };

export function useUnifiedCalendar(monthKey?: string) {
  const [items, setItems] = useState<UnifiedCalendarItem[]>([]);
  const [loading, setLoading] = useState(true);

  const resolvedMonth = monthKey ?? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    void (async () => {
      const supabase = createClient();
      const [year, month] = resolvedMonth.split("-").map(Number);
      const startStr = `${year}-${String(month).padStart(2, "0")}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endStr = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

      const [{ data: instituteRows }, { data: batchRows }] = await Promise.all([
        supabase
          .from("calendar_sessions")
          .select("*, subject_categories(name)")
          .order("start_time"),
        supabase
          .from("class_sessions")
          .select("*, course_batches(name, batch_code, course_id, courses(name))")
          .gte("scheduled_date", startStr)
          .lte("scheduled_date", endStr)
          .order("scheduled_date")
          .order("start_time"),
      ]);

      if (cancelled) return;

      const institute: UnifiedCalendarItem[] = (instituteRows ?? []).flatMap((row) => {
        const mapped = mapCalendarSession(row as Parameters<typeof mapCalendarSession>[0]);
        if (mapped.sessionType === "one_off" && mapped.sessionDate) {
          if (mapped.sessionDate < startStr || mapped.sessionDate > endStr) return [];
          return [{ source: "institute" as const, date: mapped.sessionDate, session: mapped }];
        }
        if (mapped.dayOfWeek === undefined) return [];
        const dates: UnifiedCalendarItem[] = [];
        for (let day = 1; day <= lastDay; day += 1) {
          const date = new Date(year, month - 1, day);
          if (date.getDay() === mapped.dayOfWeek) {
            const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            dates.push({ source: "institute", date: dateStr, session: mapped });
          }
        }
        return dates;
      });

      const batch: UnifiedCalendarItem[] = (batchRows ?? []).map((row) => {
        const batchRaw = row.course_batches as unknown;
        const batchInfo = (Array.isArray(batchRaw) ? batchRaw[0] : batchRaw) as {
          name: string;
          batch_code: string;
          course_id: string;
          courses?: { name: string } | { name: string }[] | null;
        } | null;
        const courseRaw = batchInfo?.courses;
        const courseName = Array.isArray(courseRaw) ? courseRaw[0]?.name : courseRaw?.name;
        const mapped = mapClassSession(row);
        return {
          source: "batch" as const,
          date: mapped.scheduledDate,
          session: {
            ...mapped,
            batchName: batchInfo?.name ?? "Batch",
            batchCode: batchInfo?.batch_code ?? "",
            courseName,
          },
        };
      });

      setItems([...institute, ...batch].sort((a, b) => a.date.localeCompare(b.date)));
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [resolvedMonth]);

  const byDate = useMemo(() => {
    const map = new Map<string, UnifiedCalendarItem[]>();
    for (const item of items) {
      const list = map.get(item.date) ?? [];
      list.push(item);
      map.set(item.date, list);
    }
    return map;
  }, [items]);

  return { items, byDate, loading };
}
