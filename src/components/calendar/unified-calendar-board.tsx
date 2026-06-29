"use client";

import Link from "next/link";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import type { UnifiedCalendarItem, UnifiedCalendarSource } from "@/hooks/use-unified-calendar";
import { cn } from "@/lib/utils";

type UnifiedCalendarBoardProps = {
  items: UnifiedCalendarItem[];
  filter: "all" | UnifiedCalendarSource;
  month: Date;
  onMonthChange: (month: Date) => void;
  selectedDay?: Date;
  onSelectDay: (day: Date | undefined) => void;
};

function parseDateOnly(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function UnifiedCalendarBoard({
  items,
  filter,
  month,
  onMonthChange,
  selectedDay,
  onSelectDay,
}: UnifiedCalendarBoardProps) {
  const filtered = filter === "all" ? items : items.filter((i) => i.source === filter);

  const sessionDates = filtered.map((i) => parseDateOnly(i.date));

  const selectedKey = selectedDay
    ? `${selectedDay.getFullYear()}-${String(selectedDay.getMonth() + 1).padStart(2, "0")}-${String(selectedDay.getDate()).padStart(2, "0")}`
    : "";

  const dayItems = selectedKey ? filtered.filter((i) => i.date === selectedKey) : [];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(280px,320px)_1fr]">
      <Calendar
        mode="single"
        month={month}
        onMonthChange={onMonthChange}
        selected={selectedDay}
        onSelect={onSelectDay}
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
        {dayItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sessions on this day.</p>
        ) : (
          dayItems.map((item) =>
            item.source === "institute" ? (
              <div
                key={`institute-${item.session.id}-${item.date}`}
                className="rounded-md border border-border p-3 text-sm"
              >
                <div className="mb-1 flex items-center gap-2">
                  <Badge variant="outline">Institute</Badge>
                  <span className="font-medium">{item.session.title}</span>
                </div>
                <p className="text-muted-foreground">
                  {item.session.startTime.slice(0, 5)}–{item.session.endTime.slice(0, 5)} · {item.session.teacherName}
                </p>
              </div>
            ) : (
              <Link
                key={`batch-${item.session.id}`}
                href={`/academics/attendance?session=${item.session.id}`}
                className={cn(
                  "block rounded-md border border-border p-3 text-sm transition-colors hover:bg-muted/50",
                  item.session.status === "cancelled" && "opacity-60"
                )}
              >
                <div className="mb-1 flex items-center gap-2">
                  <Badge>Batch class</Badge>
                  <span className="font-medium">{item.session.batchName}</span>
                </div>
                <p className="text-muted-foreground">
                  Class {item.session.sessionNumber} · {item.session.startTime.slice(0, 5)} · {item.session.status}
                </p>
              </Link>
            )
          )
        )}
      </div>
    </div>
  );
}
