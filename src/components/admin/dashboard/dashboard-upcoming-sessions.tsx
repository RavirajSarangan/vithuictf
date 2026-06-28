"use client";

import Link from "next/link";
import { CalendarDays, Clock } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { CalendarSession } from "@/types";

function formatSessionWhen(session: CalendarSession) {
  if (session.sessionDate) {
    return new Date(session.sessionDate).toLocaleDateString("en-LK", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return session.dayOfWeek != null ? `Every ${days[session.dayOfWeek]}` : "Recurring";
}

interface DashboardUpcomingSessionsProps {
  sessions: CalendarSession[];
  loading?: boolean;
}

export function DashboardUpcomingSessions({
  sessions,
  loading,
}: DashboardUpcomingSessionsProps) {
  return (
    <GlassCard className="flex h-full min-h-[280px] flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-icvf-navy">Upcoming sessions</h2>
        <Link
          href="/admin/calendar"
          className="text-xs font-medium text-icvf-accent hover:underline"
        >
          View calendar
        </Link>
      </div>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No upcoming sessions scheduled.</p>
      ) : (
        <ul className="space-y-2">
          {sessions.map((session) => (
            <li
              key={session.id}
              className="flex items-start gap-3 rounded-lg border border-icvf-border/60 p-3"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-icvf-accent/10">
                <CalendarDays className="size-4 text-icvf-accent" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{session.title}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  {formatSessionWhen(session)} · {session.startTime.slice(0, 5)}–
                  {session.endTime.slice(0, 5)}
                </p>
                {session.categoryName ? (
                  <Badge variant="outline" className="mt-1 text-[10px]">
                    {session.categoryName}
                  </Badge>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}
