"use client";

import { useMemo, useState } from "react";
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCalendarEventLine,
  RiCloseLine,
} from "@remixicon/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { dateKey, formatTime12, sessionsForDate } from "@/lib/calendar/utils";
import { cn } from "@/lib/utils";
import type { CalendarSession } from "@/types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type View = "month" | "week";

interface CalendarBlockProps {
  sessions: CalendarSession[];
  className?: string;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function CalendarBlock({ sessions, className }: CalendarBlockProps) {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => new Date());
  const [view, setView] = useState<View>("month");
  const [selected, setSelected] = useState<string | null>(() =>
    dateKey(today.getFullYear(), today.getMonth(), today.getDate())
  );

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const monthCells = useMemo(() => {
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = [
      ...Array(firstWeekday).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [year, month]);

  const weekDays = useMemo(() => {
    const start = new Date(cursor);
    start.setDate(cursor.getDate() - cursor.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor]);

  function shift(step: number) {
    setCursor((prev) => {
      const next = new Date(prev);
      if (view === "month") next.setMonth(prev.getMonth() + step);
      else next.setDate(prev.getDate() + step * 7);
      return next;
    });
    setSelected(null);
  }

  function sessionsOnKey(key: string): CalendarSession[] {
    const [y, m, d] = key.split("-").map(Number);
    return sessionsForDate(sessions, new Date(y, m, d));
  }

  const headerLabel =
    view === "month"
      ? `${MONTH_NAMES[month]} ${year}`
      : `${MONTH_NAMES[weekDays[0].getMonth()]} ${weekDays[0].getDate()} – ${weekDays[6].getDate()}, ${weekDays[6].getFullYear()}`;

  const selectedEvents = selected ? sessionsOnKey(selected) : [];
  const [, selMonth, selDay] = selected
    ? selected.split("-").map(Number)
    : [0, 0, 0];
  const selectedLabel = selected ? `${MONTH_NAMES[selMonth]} ${selDay}` : "";

  return (
    <div className={cn("w-full", className)}>
      <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-4">
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={view === "month" ? "Previous month" : "Previous week"}
              onClick={() => shift(-1)}
            >
              <RiArrowLeftSLine aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={view === "month" ? "Next month" : "Next week"}
              onClick={() => shift(1)}
            >
              <RiArrowRightSLine aria-hidden="true" />
            </Button>
            <h2 className="ml-0.5 min-w-0 truncate text-sm font-semibold tracking-tight sm:ml-1 sm:text-base">
              {headerLabel}
            </h2>
          </div>

          <div className="inline-flex w-fit shrink-0 rounded-lg border border-border bg-muted/40 p-0.5">
            {(["month", "week"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={cn(
                  "rounded-md px-3 py-1 text-sm font-medium capitalize transition-colors",
                  view === v
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-7 border-b border-border bg-muted/20">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="py-2 text-center text-xs font-medium text-muted-foreground"
            >
              {d}
            </div>
          ))}
        </div>

        {view === "month" ? (
          <div className="grid grid-cols-7">
            {monthCells.map((day, idx) => {
              const k = day ? dateKey(year, month, day) : null;
              const events = k ? sessionsOnKey(k) : [];
              const cellDate = day ? new Date(year, month, day) : null;
              const isToday = cellDate ? isSameDay(cellDate, today) : false;
              const isLastRow = idx >= monthCells.length - 7;
              const isSelected = k !== null && k === selected;

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={day === null}
                  onClick={() => k && setSelected(k)}
                  className={cn(
                    "group flex min-h-[4.5rem] min-w-0 flex-col gap-0.5 border-border p-1 text-left align-top transition-colors sm:min-h-[6rem] sm:gap-1 sm:p-1.5",
                    idx % 7 !== 6 && "border-r",
                    !isLastRow && "border-b",
                    day === null && "bg-muted/20",
                    day !== null && "hover:bg-accent/40",
                    isSelected && "bg-accent/60"
                  )}
                >
                  {day !== null && (
                    <>
                      <span
                        className={cn(
                          "flex size-6 items-center justify-center self-end rounded-full text-xs font-medium",
                          isToday
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground"
                        )}
                      >
                        {day}
                      </span>

                      <div className="flex min-w-0 flex-col gap-0.5 sm:gap-1">
                        {events.slice(0, 2).map((ev) => (
                          <span
                            key={ev.id}
                            className="flex min-w-0 items-center gap-1.5"
                          >
                            <span
                              className="size-1.5 shrink-0 rounded-full"
                              style={{ backgroundColor: ev.categoryColor ?? "#273461" }}
                              aria-hidden="true"
                            />
                            <span className="truncate text-[10px] text-foreground/90">
                              {ev.title}
                            </span>
                          </span>
                        ))}
                        {events.length > 2 && (
                          <span className="pl-3 text-[10px] font-medium text-muted-foreground">
                            +{events.length - 2} more
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-7 overflow-x-auto">
            {weekDays.map((d, idx) => {
              const k = dateKey(d.getFullYear(), d.getMonth(), d.getDate());
              const events = sessionsOnKey(k);
              const isToday = isSameDay(d, today);
              const isSelected = k === selected;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelected(k)}
                  className={cn(
                    "flex min-h-[10rem] min-w-[3.25rem] flex-col gap-2 border-border p-2 text-left transition-colors sm:min-h-[14rem]",
                    idx !== 6 && "border-r",
                    "hover:bg-accent/40",
                    isSelected && "bg-accent/60"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-7 items-center justify-center self-start rounded-full text-sm font-semibold",
                      isToday
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground"
                    )}
                  >
                    {d.getDate()}
                  </span>

                  <div className="flex min-w-0 flex-col gap-1.5">
                    {events.map((ev) => (
                      <div
                        key={ev.id}
                        className="flex min-w-0 items-stretch gap-1.5 rounded-md bg-muted/40"
                      >
                        <span
                          className="w-0.5 shrink-0 rounded-full"
                          style={{ backgroundColor: ev.categoryColor ?? "#273461" }}
                          aria-hidden="true"
                        />
                        <div className="min-w-0 py-1 pr-1.5">
                          <p className="truncate text-xs font-medium">{ev.title}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatTime12(ev.startTime)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selected && (
        <div className="relative mt-4 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm">
          <button
            type="button"
            aria-label="Close events"
            onClick={() => setSelected(null)}
            className="absolute top-3 right-3 flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
          >
            <RiCloseLine className="size-4" aria-hidden="true" />
          </button>

          <div className="flex items-center gap-2 pr-8">
            <RiCalendarEventLine
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <h3 className="text-sm font-semibold">{selectedLabel}</h3>
            <Badge variant="secondary" className="text-[10px]">
              {selectedEvents.length}{" "}
              {selectedEvents.length === 1 ? "session" : "sessions"}
            </Badge>
          </div>

          {selectedEvents.length > 0 ? (
            <ul className="mt-3 flex flex-col gap-2">
              {selectedEvents.map((ev) => (
                <li
                  key={ev.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5 transition-colors hover:bg-muted/50"
                >
                  <span
                    className="size-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: ev.categoryColor ?? "#273461" }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{ev.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {ev.categoryName ?? "Class"}
                      {ev.teacherName ? ` · ${ev.teacherName}` : ""}
                      {ev.room ? ` · ${ev.room}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {formatTime12(ev.startTime)} – {formatTime12(ev.endTime)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              No sessions scheduled. Enjoy the free day.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
