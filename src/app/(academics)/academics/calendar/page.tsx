"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAcademicsCalendarSessions, useBatches } from "@/hooks/use-academics";
import { SessionStatusBadge } from "@/components/academics/session-status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

export default function AcademicsCalendarPage() {
  const { data: batches } = useBatches();
  const [batchId, setBatchId] = useState("all");
  const [weekStart, setWeekStart] = useState<string | undefined>(undefined);
  const { data: sessions, loading, weekStart: resolvedWeekStart } = useAcademicsCalendarSessions(
    batchId === "all" ? undefined : batchId,
    weekStart
  );

  const activeBatches = useMemo(() => batches.filter((b) => b.active), [batches]);

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, typeof sessions>();
    for (const session of sessions) {
      const list = map.get(session.scheduledDate) ?? [];
      list.push(session);
      map.set(session.scheduledDate, list);
    }
    return map;
  }, [sessions]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Class calendar"
        description="Weekly view of batch class sessions"
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="max-w-xs flex-1 space-y-2">
          <label className="text-sm font-medium">Batch</label>
          <Select value={batchId} onValueChange={(v) => setBatchId(v ?? "all")}>
            <SelectTrigger>
              <SelectValue placeholder="All batches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All batches</SelectItem>
              {activeBatches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name} ({b.batchCode})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="icon" onClick={() => setWeekStart(shiftWeek(resolvedWeekStart, -1))}>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-32 text-center text-sm font-medium">
            Week of {resolvedWeekStart}
          </span>
          <Button type="button" variant="outline" size="icon" onClick={() => setWeekStart(shiftWeek(resolvedWeekStart, 1))}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading calendar…</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-7">
          {WEEKDAY_LABELS.map((label, index) => {
            const date = dateForDay(resolvedWeekStart, index);
            const daySessions = sessionsByDate.get(date) ?? [];
            return (
              <div key={label} className="rounded-lg border border-border p-3">
                <p className="mb-2 text-sm font-semibold">{label}</p>
                <p className="mb-3 text-xs text-muted-foreground">{date}</p>
                <div className="space-y-2">
                  {daySessions.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No sessions</p>
                  ) : (
                    daySessions.map((session) => (
                      <Link
                        key={session.id}
                        href={`/academics/attendance?session=${session.id}`}
                        className={cn(
                          "block rounded-md border p-2 text-xs transition-colors hover:bg-muted/50",
                          session.status === "cancelled" && "opacity-60",
                          session.status === "completed" && "border-green-200 bg-green-50/50"
                        )}
                      >
                        <p className="font-medium">{session.batchName}</p>
                        <p className="text-muted-foreground">
                          Class {session.sessionNumber} · {session.startTime.slice(0, 5)}
                        </p>
                        <SessionStatusBadge status={session.status} className="mt-1" />
                      </Link>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
