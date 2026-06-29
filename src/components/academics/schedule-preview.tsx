"use client";

import { useMemo } from "react";
import { buildSessionSchedule, scheduleSummary } from "@/lib/academics/schedule";
import { CLASS_DAYS } from "@/lib/academics/constants";

type SchedulePreviewProps = {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  classDays: string[];
  totalClasses?: number;
};

const DAY_LABELS: Record<string, string> = Object.fromEntries(
  CLASS_DAYS.map((d) => [d.id, d.label])
);

export function SchedulePreview({
  startDate,
  endDate,
  startTime,
  endTime,
  classDays,
  totalClasses,
}: SchedulePreviewProps) {
  const preview = useMemo(() => {
    if (!startDate || !endDate || !classDays.length) return null;
    try {
      const summary = scheduleSummary({
        startDate,
        endDate,
        startTime,
        endTime,
        classDays,
        totalClasses,
      });
      const sessions = buildSessionSchedule({
        startDate,
        endDate,
        startTime,
        endTime,
        classDays,
        totalClasses: summary.totalClasses,
      });
      return { summary, sessions };
    } catch {
      return null;
    }
  }, [startDate, endDate, startTime, endTime, classDays, totalClasses]);

  if (!preview || preview.summary.totalClasses === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Select dates and class days to preview auto-generated sessions.
      </p>
    );
  }

  const { summary, sessions } = preview;
  const dayLabels = classDays.map((d) => DAY_LABELS[d] ?? d).join(", ");

  return (
    <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
      <p className="font-medium">
        {summary.totalClasses} class{summary.totalClasses === 1 ? "" : "es"} · {dayLabels}
      </p>
      <p className="text-muted-foreground">
        {summary.firstDate} → {summary.lastDate} · {startTime.slice(0, 5)}–{endTime.slice(0, 5)}
      </p>
      <ul className="mt-2 space-y-0.5 text-muted-foreground">
        {sessions.slice(0, 5).map((s) => (
          <li key={s.sessionNumber}>
            Class {s.sessionNumber}: {s.scheduledDate}
          </li>
        ))}
        {sessions.length > 5 && (
          <li>…and {sessions.length - 5} more</li>
        )}
      </ul>
    </div>
  );
}
