"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { AcademicsCalendarSession } from "@/hooks/use-academics";
import { SessionStatusBadge } from "@/components/academics/session-status-badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function shiftWeek(weekStart: string, delta: number): string {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + delta * 7);
  return d.toISOString().slice(0, 10);
}

function dateForDay(weekStart: string, dayIndex: number): string {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + dayIndex);
  return d.toISOString().slice(0, 10);
}

interface StudentBatchCalendarProps {
  sessions: AcademicsCalendarSession[];
  loading?: boolean;
}

export function StudentBatchCalendar({ sessions, loading }: StudentBatchCalendarProps) {
  const [weekStart, setWeekStart] = useState(() => formatWeekStart(new Date()));

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, AcademicsCalendarSession[]>();
    for (const session of sessions) {
      const list = map.get(session.scheduledDate) ?? [];
      list.push(session);
      map.set(session.scheduledDate, list);
    }
    return map;
  }, [sessions]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading your batch schedule…</p>;
  }

  if (sessions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No batch classes scheduled yet. Enroll in a batch to see your class calendar here.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" size="icon" onClick={() => setWeekStart(shiftWeek(weekStart, -1))}>
          <ChevronLeft className="size-4" />
        </Button>
        <span className="min-w-32 text-center text-sm font-medium">Week of {weekStart}</span>
        <Button type="button" variant="outline" size="icon" onClick={() => setWeekStart(shiftWeek(weekStart, 1))}>
          <ChevronRight className="size-4" />
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-7">
        {WEEKDAY_LABELS.map((label, index) => {
          const date = dateForDay(weekStart, index);
          const daySessions = sessionsByDate.get(date) ?? [];
          return (
            <div key={label} className="rounded-lg border border-border p-3">
              <p className="mb-2 text-sm font-semibold">{label}</p>
              <p className="mb-3 text-xs text-muted-foreground">{date}</p>
              <div className="space-y-2">
                {daySessions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No classes</p>
                ) : (
                  daySessions.map((session) => (
                    <div
                      key={session.id}
                      className={cn(
                        "rounded-md border p-2 text-xs",
                        session.status === "cancelled" && "border-destructive/30 bg-destructive/5",
                        session.status === "completed" && "border-green-200 bg-green-50/50"
                      )}
                    >
                      <p className="font-medium">{session.batchName}</p>
                      <p className="text-muted-foreground">
                        Class {session.sessionNumber} · {session.startTime.slice(0, 5)}
                      </p>
                      <SessionStatusBadge status={session.status} className="mt-1" />
                      {session.cancelReason ? (
                        <p className="mt-1 text-destructive">{session.cancelReason}</p>
                      ) : null}
                      {session.zoomLink && session.status === "scheduled" ? (
                        <a
                          href={session.zoomLink}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 block text-icvf-accent hover:underline"
                        >
                          Join Zoom
                        </a>
                      ) : null}
                      {session.canvaSlideUrl ? (
                        <Link
                          href={`/slides/${session.id}`}
                          className="mt-1 block text-icvf-accent hover:underline"
                        >
                          View slides
                        </Link>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Showing classes from your enrolled batches.{" "}
        <Link href="/attendance" className="text-icvf-accent hover:underline">
          View attendance
        </Link>
      </p>
    </div>
  );
}
