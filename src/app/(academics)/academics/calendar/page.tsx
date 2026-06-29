"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  useAcademicsCalendarSessions,
  useAcademicsCalendarSessionsForMonth,
  useBatches,
} from "@/hooks/use-academics";
import { SessionStatusBadge } from "@/components/academics/session-status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

function formatMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function parseDateOnly(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export default function AcademicsCalendarPage() {
  const { data: batches } = useBatches();
  const [batchId, setBatchId] = useState("all");
  const [view, setView] = useState<"week" | "month">("week");
  const [weekStart, setWeekStart] = useState<string | undefined>(undefined);
  const [month, setMonth] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined);

  const { data: weekSessions, loading: weekLoading, weekStart: resolvedWeekStart } =
    useAcademicsCalendarSessions(batchId === "all" ? undefined : batchId, weekStart);

  const monthKey = formatMonthKey(month);
  const { data: monthSessions, loading: monthLoading } = useAcademicsCalendarSessionsForMonth(
    batchId === "all" ? undefined : batchId,
    monthKey
  );

  const activeBatches = useMemo(() => batches.filter((b) => b.active), [batches]);
  const sessions = view === "week" ? weekSessions : monthSessions;
  const loading = view === "week" ? weekLoading : monthLoading;

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, typeof sessions>();
    for (const session of sessions) {
      const list = map.get(session.scheduledDate) ?? [];
      list.push(session);
      map.set(session.scheduledDate, list);
    }
    return map;
  }, [sessions]);

  const sessionDates = useMemo(
    () => monthSessions.map((s) => parseDateOnly(s.scheduledDate)),
    [monthSessions]
  );

  const selectedDayKey = selectedDay
    ? `${selectedDay.getFullYear()}-${String(selectedDay.getMonth() + 1).padStart(2, "0")}-${String(selectedDay.getDate()).padStart(2, "0")}`
    : "";
  const selectedDaySessions = selectedDayKey ? sessionsByDate.get(selectedDayKey) ?? [] : [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Class calendar" description="Weekly and monthly view of batch class sessions" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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
        <Tabs value={view} onValueChange={(v) => setView(v as "week" | "month")}>
          <TabsList>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {view === "week" ? (
        <>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="icon" onClick={() => setWeekStart(shiftWeek(resolvedWeekStart, -1))}>
              <ChevronLeft className="size-4" />
            </Button>
            <span className="min-w-32 text-center text-sm font-medium">Week of {resolvedWeekStart}</span>
            <Button type="button" variant="outline" size="icon" onClick={() => setWeekStart(shiftWeek(resolvedWeekStart, 1))}>
              <ChevronRight className="size-4" />
            </Button>
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
        </>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(280px,320px)_1fr]">
          <Calendar
            mode="single"
            month={month}
            onMonthChange={setMonth}
            selected={selectedDay}
            onSelect={setSelectedDay}
            modifiers={{ hasSession: sessionDates }}
            modifiersClassNames={{
              hasSession:
                "relative font-semibold after:absolute after:bottom-1 after:left-1/2 after:size-1.5 after:-translate-x-1/2 after:rounded-full after:bg-icvf-accent",
            }}
            className="rounded-lg border border-border"
          />
          <div className="space-y-3">
            <h3 className="font-semibold">
              {selectedDay
                ? selectedDay.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })
                : "Select a day"}
            </h3>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading sessions…</p>
            ) : selectedDaySessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No class sessions on this day.</p>
            ) : (
              selectedDaySessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/academics/attendance?session=${session.id}`}
                  className="block rounded-md border border-border p-3 text-sm transition-colors hover:bg-muted/50"
                >
                  <p className="font-medium">{session.batchName}</p>
                  <p className="text-muted-foreground">
                    Class {session.sessionNumber} · {session.startTime.slice(0, 5)}–{session.endTime.slice(0, 5)}
                  </p>
                  <SessionStatusBadge status={session.status} className="mt-2" />
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
