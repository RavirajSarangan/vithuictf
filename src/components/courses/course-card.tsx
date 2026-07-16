"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, Clock, ListChecks, Users } from "lucide-react";
import { MarketingPanel } from "@/components/landing/marketing-layout";
import { cn } from "@/lib/utils";

const WEEKDAY_IDS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const WEEKDAY_LABELS: Record<string, string> = {
  sun: "Sunday",
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
};

/** "16:00:00" → "4:00 PM". Returns null for unparseable input. */
function formatTime(time: string): string | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(time);
  if (!match) return null;
  const hours = Number(match[1]);
  if (hours > 23) return null;
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${match[2]} ${suffix}`;
}

function timeRangeLabel(startTime?: string, endTime?: string): string | null {
  const start = startTime ? formatTime(startTime) : null;
  const end = endTime ? formatTime(endTime) : null;
  if (start && end) return `${start} – ${end}`;
  return start ?? end;
}

function nextClassInfo(classDays: string[], now: Date): { label: string; daysAway: number } | null {
  const targets = new Set(
    classDays
      .map((day) => WEEKDAY_IDS.indexOf(day.toLowerCase() as (typeof WEEKDAY_IDS)[number]))
      .filter((i) => i >= 0)
  );
  if (targets.size === 0) return null;
  for (let offset = 0; offset < 7; offset++) {
    const weekday = (now.getDay() + offset) % 7;
    if (targets.has(weekday)) {
      return { label: WEEKDAY_LABELS[WEEKDAY_IDS[weekday]!]!, daysAway: offset };
    }
  }
  return null;
}

/** Renders only on the client so the countdown uses the visitor's local date. */
function NextClassCountdown({
  classDays,
  startTime,
  endTime,
}: {
  classDays: string[];
  startTime?: string;
  endTime?: string;
}) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  if (!now) return null;
  const next = nextClassInfo(classDays, now);
  if (!next) return null;

  const classDate = new Date(now);
  classDate.setDate(classDate.getDate() + next.daysAway);
  const dateLabel = classDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  const timeLabel = timeRangeLabel(startTime, endTime);
  const timeSuffix = timeLabel ? ` · ${timeLabel}` : "";
  const text =
    next.daysAway === 0
      ? `Class today · ${next.label}, ${dateLabel}${timeSuffix}`
      : next.daysAway === 1
        ? `Class tomorrow · ${next.label}, ${dateLabel}${timeSuffix}`
        : `Next class ${next.label}, ${dateLabel}${timeSuffix} · in ${next.daysAway} days`;

  return (
    <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-icvf-accent">
      <span className="relative flex size-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-icvf-accent opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-icvf-accent" />
      </span>
      {text}
    </span>
  );
}

function courseInitials(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "ICT";
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return `${words[0]![0] ?? ""}${words[1]![0] ?? ""}`.toUpperCase();
}

export interface CourseCardProps {
  title: string;
  description?: string;
  coverImageUrl?: string;
  category?: string;
  durationMonths?: number;
  classDaysPerWeek?: number;
  classDays?: string[];
  startTime?: string;
  endTime?: string;
  totalSessions?: number;
  completedSessions?: number;
  teacherName?: string;
  studentCount?: number;
  href?: string;
  compact?: boolean;
  showStats?: boolean;
  index?: number;
  footer?: React.ReactNode;
  className?: string;
}

export function CourseThumbnail({
  title,
  coverImageUrl,
  className,
}: {
  title: string;
  coverImageUrl?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-md bg-gradient-to-br from-icvf-navy/10 to-icvf-accent/20 aspect-square",
        className
      )}
    >
      {coverImageUrl ? (
        <Image src={coverImageUrl} alt={title} fill className="object-cover" sizes="80px" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs font-bold text-icvf-navy">
          {courseInitials(title)}
        </div>
      )}
    </div>
  );
}

export function CourseCard({
  title,
  description,
  coverImageUrl,
  category,
  durationMonths,
  classDaysPerWeek,
  classDays,
  startTime,
  endTime,
  totalSessions,
  completedSessions,
  teacherName,
  studentCount,
  href,
  compact = false,
  showStats = false,
  index,
  footer,
  className,
}: CourseCardProps) {
  const durationLabel = durationMonths ? `${durationMonths} ${durationMonths === 1 ? "month" : "months"}` : null;
  const classDaysLabel = classDaysPerWeek
    ? `${classDaysPerWeek} ${classDaysPerWeek === 1 ? "day" : "days"}/week`
    : null;

  if (compact) {
    return (
      <MarketingPanel
        className={cn("flex h-full flex-col overflow-hidden p-0 group-hover:shadow-lg", className)}
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          {coverImageUrl ? (
            <Image
              src={coverImageUrl}
              alt={title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-icvf-navy/10 to-icvf-accent/25 text-2xl font-bold text-icvf-navy">
              {courseInitials(title)}
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/15 to-transparent" />
        </div>
        <div className="flex flex-1 flex-col p-4">
          {category ? (
            <span className="inline-flex w-fit items-center rounded-full bg-icvf-accent/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-icvf-accent">
              {category}
            </span>
          ) : null}
          <h3 className="mt-2 text-base font-bold leading-snug text-icvf-navy">{title}</h3>
          {description ? (
            <p className="mt-1.5 line-clamp-2 flex-1 text-sm leading-relaxed text-icvf-text-light">
              {description}
            </p>
          ) : null}
          {teacherName ? (
            <p className="mt-2 text-xs font-medium text-icvf-text-light">Staff: {teacherName}</p>
          ) : null}
          {showStats ? (
            <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-icvf-border pt-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-icvf-surface px-2 py-1 text-[11px] font-medium text-icvf-text-light">
                <Clock className="size-3" />
                {durationLabel ?? "Duration TBA"}
              </span>
              {classDaysLabel ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-icvf-surface px-2 py-1 text-[11px] font-medium text-icvf-text-light">
                  <CalendarDays className="size-3" />
                  {classDaysLabel}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-icvf-surface px-2 py-1 text-[11px] font-medium text-icvf-text-light">
                <Users className="size-3" />
                {studentCount ?? 0} students
              </span>
              {totalSessions ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-icvf-surface px-2 py-1 text-[11px] font-medium text-icvf-text-light">
                  <ListChecks className="size-3" />
                  {completedSessions ?? 0}/{totalSessions} sessions
                </span>
              ) : null}
            </div>
          ) : null}
          {classDays?.length ? (
            <NextClassCountdown classDays={classDays} startTime={startTime} endTime={endTime} />
          ) : null}
        </div>
      </MarketingPanel>
    );
  }

  const body = (
    <MarketingPanel className={cn("flex h-full flex-col overflow-hidden p-0", className)}>
      <div className="relative aspect-square w-full">
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-icvf-navy/10 to-icvf-accent/25 text-3xl font-bold text-icvf-navy">
            {courseInitials(title)}
          </div>
        )}
        {typeof index === "number" ? (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-xs font-bold text-icvf-accent">
            {String(index).padStart(2, "0")}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5">
        {category ? (
          <span className="text-xs font-semibold uppercase tracking-wide text-icvf-accent">{category}</span>
        ) : null}
        <h3 className="mt-1 text-lg font-bold text-icvf-navy sm:text-xl">{title}</h3>
        {description ? (
          <p className="mt-2 flex-1 text-sm leading-relaxed text-icvf-text-light">{description}</p>
        ) : null}
        {footer ?? (
          <div className="mt-5 flex items-center justify-between border-t border-icvf-border pt-4">
            <span className="flex items-center gap-1.5 text-xs text-icvf-text-light">
              {durationLabel ? (
                <>
                  <Clock className="size-3.5" />
                  {durationLabel}
                </>
              ) : teacherName ? (
                teacherName
              ) : null}
            </span>
            {href ? (
              <span className="inline-flex items-center gap-1 text-sm font-medium text-icvf-navy">
                View
                <ArrowRight className="size-3.5" />
              </span>
            ) : null}
          </div>
        )}
      </div>
    </MarketingPanel>
  );

  if (href) {
    return (
      <Link href={href} className="group block h-full">
        {body}
      </Link>
    );
  }

  return <div className="group h-full">{body}</div>;
}
