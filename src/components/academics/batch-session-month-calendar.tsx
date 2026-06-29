"use client";

import { useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import type { ClassSession } from "@/types";
import { cn } from "@/lib/utils";

type BatchSessionMonthCalendarProps = {
  sessions: ClassSession[];
  selectedSessionId?: string;
  month?: Date;
  onMonthChange?: (month: Date) => void;
  onSelectSession: (session: ClassSession) => void;
};

function parseDateOnly(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function BatchSessionMonthCalendar({
  sessions,
  selectedSessionId,
  month,
  onMonthChange,
  onSelectSession,
}: BatchSessionMonthCalendarProps) {
  const sessionDates = useMemo(
    () => sessions.map((s) => parseDateOnly(s.scheduledDate)),
    [sessions]
  );

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, ClassSession[]>();
    for (const session of sessions) {
      const list = map.get(session.scheduledDate) ?? [];
      list.push(session);
      map.set(session.scheduledDate, list);
    }
    return map;
  }, [sessions]);

  const selectedDate = useMemo(() => {
    const selected = sessions.find((s) => s.id === selectedSessionId);
    return selected ? parseDateOnly(selected.scheduledDate) : undefined;
  }, [sessions, selectedSessionId]);

  return (
    <div className="space-y-3">
      <Calendar
        mode="single"
        month={month}
        onMonthChange={onMonthChange}
        selected={selectedDate}
        modifiers={{ hasSession: sessionDates }}
        modifiersClassNames={{
          hasSession: "relative font-semibold after:absolute after:bottom-1 after:left-1/2 after:size-1.5 after:-translate-x-1/2 after:rounded-full after:bg-icvf-accent",
        }}
        onDayClick={(day) => {
          const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
          const daySessions = sessionsByDate.get(key);
          if (daySessions?.[0]) onSelectSession(daySessions[0]);
        }}
        className="rounded-lg border border-border"
      />
      {selectedSessionId && (
        <div className="space-y-1">
          {(sessionsByDate.get(
            sessions.find((s) => s.id === selectedSessionId)?.scheduledDate ?? ""
          ) ?? []).map((session) => (
            <button
              key={session.id}
              type="button"
              onClick={() => onSelectSession(session)}
              className={cn(
                "w-full rounded-md border px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50",
                session.id === selectedSessionId && "border-primary bg-primary/5"
              )}
            >
              <p className="font-medium">Class {session.sessionNumber}</p>
              <p className="text-xs text-muted-foreground">
                {session.scheduledDate} · {session.startTime.slice(0, 5)}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
