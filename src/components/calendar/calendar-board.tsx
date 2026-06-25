"use client";

import { CalendarBlock } from "@/components/calendar/calendar-block";
import { GlassCard } from "@/components/shared/glass-card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatMinutes, sessionsForToday } from "@/lib/calendar/utils";
import type { CalendarSession, SubjectCategory } from "@/types";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface CalendarBoardProps {
  sessions: CalendarSession[];
  categories: SubjectCategory[];
  categoryFilter: string;
  onCategoryFilter: (id: string) => void;
  showSummary?: boolean;
  weeklyTotal?: number;
  variant?: "light" | "dark";
}

export function CalendarBoard({
  sessions,
  categories,
  categoryFilter,
  onCategoryFilter,
  showSummary,
  weeklyTotal,
  variant = "light",
}: CalendarBoardProps) {
  const todaySessions = useMemo(() => sessionsForToday(sessions), [sessions]);
  const isDark = variant === "dark";

  return (
    <div className="flex flex-col gap-4">
      {showSummary && weeklyTotal !== undefined && (
        <GlassCard className={isDark ? "border-white/10 bg-white/5" : "bg-white"}>
          <p className={`text-sm ${isDark ? "text-white/70" : "text-icvf-text-light"}`}>
            Weekly class time
          </p>
          <p className={`text-2xl font-bold ${isDark ? "text-white" : "text-icvf-navy"}`}>
            {formatMinutes(weeklyTotal)}
          </p>
        </GlassCard>
      )}

      <Tabs value={categoryFilter} onValueChange={onCategoryFilter} className="min-w-0 gap-0">
        <div className="relative min-w-0">
          <div className="overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <TabsList
              className={
                isDark
                  ? "inline-flex h-auto w-max max-w-none flex-nowrap items-center gap-1 bg-white/10 p-1"
                  : "inline-flex h-auto w-max max-w-none flex-nowrap items-center gap-1 bg-icvf-surface p-1"
              }
            >
              <TabsTrigger value="all" className="shrink-0 flex-none px-3 py-2">
                All
              </TabsTrigger>
              {categories.map((c) => (
                <TabsTrigger key={c.id} value={c.id} className="shrink-0 flex-none px-3 py-2">
                  {c.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l to-transparent sm:hidden",
              isDark ? "from-icvf-navy-dark" : "from-background"
            )}
          />
        </div>
      </Tabs>

      <CalendarBlock sessions={sessions} />

      {todaySessions.length > 0 && (
        <GlassCard className={isDark ? "border-white/10 bg-white/5" : "bg-white"}>
          <h3 className={`mb-3 font-semibold ${isDark ? "text-white" : "text-icvf-text-dark"}`}>
            Today
          </h3>
          <div className="flex flex-col gap-2">
            {todaySessions.map((s) => {
              const color = s.categoryColor ?? "#273461";
              return (
                <div
                  key={s.id}
                  className="rounded-lg border p-3 text-sm"
                  style={{ borderColor: `${color}40`, backgroundColor: `${color}10` }}
                >
                  <p className={`font-medium ${isDark ? "text-white" : "text-icvf-text-dark"}`}>
                    {s.title}
                  </p>
                  <p className={`mt-1 text-xs ${isDark ? "text-white/70" : "text-icvf-text-light"}`}>
                    {s.categoryName ?? "Class"}
                    {s.teacherName ? ` · ${s.teacherName}` : ""}
                  </p>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
