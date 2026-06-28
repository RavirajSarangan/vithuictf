"use client";

import Link from "next/link";
import { useMemo } from "react";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import {
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Brain,
  CalendarDays,
  ChevronRight,
  Flame,
  IdCard,
  Medal,
  Sparkles,
  Trophy,
  TrendingUp,
} from "lucide-react";

import { SectionCard } from "@/components/student/dashboard/section-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useCalendarSessions } from "@/hooks/use-calendar";
import {
  useAchievements,
  useActivities,
  useExams,
  useStudentData,
  useStudentResults,
} from "@/hooks/use-student-data";
import { formatMinutes, formatTime12, sessionsForToday } from "@/lib/calendar/utils";
import { formatStudentRank, hasAssignedRank } from "@/lib/student-rank";
import { cn } from "@/lib/utils";
import { useActiveCourseId, useActiveCourseName } from "@/contexts/student-course-context";
import type { ActivityItem, Exam, Result, Student } from "@/types";

const QUICK_ACTIONS = [
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/resources", label: "Resources", icon: BookOpen },
  { href: "/results", label: "Results", icon: BarChart3 },
  { href: "/ai-assistant", label: "AI Help", icon: Brain },
] as const;

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatActivityTime(value: string): string {
  try {
    return formatDistanceToNow(parseISO(value), { addSuffix: true });
  } catch {
    return value;
  }
}

function formatExamDate(value: string): string {
  try {
    return format(parseISO(value), "MMM d, yyyy");
  } catch {
    return value;
  }
}

function StatTile({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: typeof Trophy;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-2xl border p-3 sm:p-4",
        accent
          ? "border-icvf-accent/40 bg-gradient-to-br from-icvf-navy to-icvf-navy-dark text-white"
          : "border-icvf-border bg-white shadow-sm"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={cn("truncate text-[11px] font-medium sm:text-xs", accent ? "text-white/70" : "text-icvf-text-light")}>
            {label}
          </p>
          <p className="mt-1 truncate text-xl font-bold tracking-tight sm:text-2xl">{value}</p>
        </div>
        <div
          className={cn(
            "shrink-0 rounded-xl p-2 sm:p-2.5",
            accent ? "bg-icvf-accent/25 text-icvf-accent" : "bg-icvf-navy/10 text-icvf-navy"
          )}
        >
          <Icon className="size-4" />
        </div>
      </div>
    </div>
  );
}

function EmptyRow({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-icvf-border bg-icvf-surface/60 px-3 py-6 text-center sm:px-4 sm:py-8">
      <p className="text-sm text-icvf-text-light">{message}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex w-full min-w-0 flex-col gap-4 sm:gap-6">
      <Skeleton className="h-40 rounded-2xl sm:h-44" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl sm:h-24" />
        ))}
      </div>
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">
        <Skeleton className="h-56 rounded-2xl lg:col-span-2 sm:h-64" />
        <Skeleton className="h-56 rounded-2xl sm:h-64" />
      </div>
    </div>
  );
}

function HeroBanner({
  student,
  courseName,
}: {
  student: Student;
  courseName: string;
}) {
  const firstName = student.displayName.split(" ")[0] ?? student.displayName;
  const initials = student.displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <section className="rounded-2xl bg-gradient-to-br from-icvf-navy-dark via-icvf-navy to-icvf-navy-hover p-4 text-white shadow-md sm:p-6 md:p-8">
      <div className="flex flex-col gap-5 sm:gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
            <Avatar className="size-14 shrink-0 border-2 border-white/20 sm:size-16 md:size-20">
              {student.photoURL ? (
                <AvatarImage src={student.photoURL} alt={student.displayName} />
              ) : null}
              <AvatarFallback className="bg-white/10 text-lg font-semibold text-white sm:text-xl">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-white/70 sm:text-sm">{getGreeting()},</p>
              <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">
                {firstName}
              </h1>
              <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
                <Badge className="max-w-full truncate border-0 bg-white/15 text-white">
                  {courseName}
                </Badge>
                <Badge variant="outline" className="border-white/25 bg-transparent text-white">
                  {student.studentId}
                </Badge>
                {student.indexNumber ? (
                  <Badge
                    variant="outline"
                    className="max-w-full truncate border-white/25 bg-transparent text-white"
                  >
                    {student.indexNumber}
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
            {hasAssignedRank(student.rank) ? (
              <Badge className="border-0 bg-icvf-accent px-2.5 py-1 text-xs font-semibold text-white sm:text-sm">
                Rank {formatStudentRank(student.rank)}
              </Badge>
            ) : null}
            <Badge className="border-0 bg-white/15 px-2.5 py-1 text-xs font-semibold text-white sm:text-sm">
              {student.points} pts
            </Badge>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button
            nativeButton={false}
            render={<Link href="/resources" />}
            className="h-11 w-full rounded-xl bg-icvf-accent text-white hover:bg-icvf-accent-hover sm:w-auto"
          >
            Continue learning
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/profile-card" />}
            className="h-11 w-full rounded-xl border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white sm:w-auto"
          >
            <IdCard className="size-4" />
            Profile card
          </Button>
        </div>
      </div>
    </section>
  );
}

function TodayClassesList({
  sessions,
}: {
  sessions: ReturnType<typeof sessionsForToday>;
}) {
  if (sessions.length === 0) {
    return <EmptyRow message="No classes scheduled for today." />;
  }

  return (
    <ul className="flex flex-col gap-2">
      {sessions.map((session) => (
        <li key={session.id}>
          <Link
            href="/calendar"
            className="group flex min-h-11 items-center justify-between gap-3 rounded-xl border border-icvf-border bg-icvf-surface/50 px-3 py-2.5 transition-colors hover:border-icvf-navy/20 hover:bg-icvf-navy/5 sm:px-4 sm:py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-icvf-navy">{session.title}</p>
              <p className="text-xs text-icvf-text-light">
                {formatTime12(session.startTime)} · {formatMinutes(session.durationMinutes)}
              </p>
            </div>
            <ArrowUpRight className="size-4 shrink-0 text-icvf-text-light group-hover:text-icvf-accent" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function ExamsList({ exams }: { exams: Exam[] }) {
  if (exams.length === 0) {
    return <EmptyRow message="No upcoming exams for your course." />;
  }

  return (
    <ul className="flex flex-col gap-2">
      {exams.map((exam) => (
        <li
          key={exam.id}
          className="flex min-h-11 items-center justify-between gap-2 rounded-xl border border-icvf-border bg-icvf-surface/50 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-icvf-navy">{exam.title}</p>
            <p className="text-xs text-icvf-text-light">{formatExamDate(exam.date)}</p>
          </div>
          <Badge variant="outline" className="shrink-0 border-icvf-accent/30 bg-icvf-accent/10 text-icvf-navy">
            Upcoming
          </Badge>
        </li>
      ))}
    </ul>
  );
}

function ResultsList({ results }: { results: Result[] }) {
  if (results.length === 0) {
    return <EmptyRow message="Results will appear after your first exam." />;
  }

  return (
    <ul className="flex flex-col gap-2">
      {results.map((result) => (
        <li
          key={result.id}
          className="flex min-h-11 items-center justify-between gap-2 rounded-xl border border-icvf-border bg-icvf-surface/50 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-icvf-navy">{result.subject}</p>
            {result.examTitle ? (
              <p className="truncate text-xs text-icvf-text-light">{result.examTitle}</p>
            ) : null}
          </div>
          <Badge className="shrink-0 bg-icvf-navy text-white">{result.grade}</Badge>
        </li>
      ))}
    </ul>
  );
}

function ActivityTimeline({ activities }: { activities: ActivityItem[] }) {
  const items = activities.slice(0, 6);

  if (items.length === 0) {
    return <EmptyRow message="Your learning activity will show up here." />;
  }

  return (
    <ul className="flex flex-col">
      {items.map((activity, index) => (
        <li key={activity.id} className="relative flex gap-3 pb-4 last:pb-0 sm:pb-5">
          {index < items.length - 1 ? (
            <span className="absolute left-[7px] top-4 h-[calc(100%-4px)] w-px bg-icvf-border" />
          ) : null}
          <span className="relative z-10 mt-1.5 size-3.5 shrink-0 rounded-full border-2 border-icvf-accent bg-white" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
              <p className="text-sm font-medium text-icvf-navy">{activity.title}</p>
              <span className="shrink-0 text-xs text-icvf-text-light">
                {formatActivityTime(activity.createdAt)}
              </span>
            </div>
            {activity.description ? (
              <p className="mt-0.5 text-xs text-icvf-text-light">{activity.description}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function StudentDashboardView() {
  const student = useStudentData();
  const studentId = student?.id;
  const activeCourseId = useActiveCourseId(student?.courseId);
  const activeCourseName = useActiveCourseName(student?.courseName);
  const courseId = activeCourseId;

  const { results } = useStudentResults(studentId);
  const { achievements } = useAchievements(studentId);
  const { activities } = useActivities(studentId);
  const { exams } = useExams();
  const { data: calendarSessions } = useCalendarSessions(courseId ?? undefined);

  const todayClasses = useMemo(
    () => sessionsForToday(calendarSessions),
    [calendarSessions]
  );

  const upcomingExams = useMemo(
    () => (courseId ? exams.filter((exam) => exam.courseId === courseId).slice(0, 4) : []),
    [exams, courseId]
  );

  const latestResults = useMemo(
    () => results.slice(-4).reverse(),
    [results]
  );

  if (student === undefined) {
    return <DashboardSkeleton />;
  }

  if (!student) {
    return (
      <SectionCard title="Profile not linked" icon={Sparkles}>
        <p className="text-sm text-icvf-text-light">
          No student profile is linked to this account yet.
        </p>
        <Button
          nativeButton={false}
          render={<Link href="/settings" />}
          className="mt-4 h-11 w-full rounded-xl bg-icvf-navy hover:bg-icvf-navy-hover sm:w-auto"
        >
          Go to settings
        </Button>
      </SectionCard>
    );
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 pb-2 sm:gap-6">
      <HeroBanner student={student} courseName={activeCourseName ?? student.courseName} />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group flex min-h-11 flex-col items-center justify-center gap-1.5 rounded-2xl border border-icvf-border bg-white p-3 text-center shadow-sm transition-colors hover:border-icvf-navy/20 hover:bg-icvf-surface sm:flex-row sm:justify-start sm:gap-3 sm:p-4 sm:text-left"
            >
              <div className="rounded-xl bg-icvf-navy/10 p-2 text-icvf-navy sm:p-2.5">
                <Icon className="size-4" />
              </div>
              <span className="text-xs font-semibold text-icvf-navy group-hover:text-icvf-navy-hover sm:text-sm">
                {action.label}
              </span>
            </Link>
          );
        })}
      </div>

      <div
        className={cn(
          "grid grid-cols-2 gap-2 sm:gap-3",
          hasAssignedRank(student.rank) ? "lg:grid-cols-4" : "lg:grid-cols-3"
        )}
      >
        <StatTile label="Total points" value={student.points} icon={Trophy} />
        <StatTile label="Performance" value={`${student.performance}%`} icon={TrendingUp} />
        <StatTile label="Study streak" value={`${student.streak}d`} icon={Flame} accent />
        {hasAssignedRank(student.rank) ? (
          <StatTile label="Current rank" value={formatStudentRank(student.rank)!} icon={Medal} />
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SectionCard
          title="Today's classes"
          description="Your schedule for today"
          icon={CalendarDays}
          actionLabel="Calendar"
          actionHref="/calendar"
          className="md:col-span-2 lg:col-span-2"
        >
          <TodayClassesList sessions={todayClasses} />
        </SectionCard>

        <SectionCard
          title="Performance"
          description="Overall progress this term"
          icon={TrendingUp}
          actionLabel="Results"
          actionHref="/results"
        >
          <div className="flex flex-col items-center gap-3 py-1 text-center sm:gap-4 sm:py-2">
            <div className="flex size-20 items-center justify-center rounded-full border-4 border-icvf-accent/30 bg-icvf-surface sm:size-24">
              <span className="text-2xl font-bold text-icvf-navy sm:text-3xl">{student.grade}</span>
            </div>
            <div className="w-full space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-icvf-text-light">Progress</span>
                <span className="font-semibold text-icvf-navy">{student.performance}%</span>
              </div>
              <Progress value={student.performance} className="h-2" />
            </div>
            <p className="text-xs text-icvf-text-light">
              {hasAssignedRank(student.rank)
                ? `Rank ${formatStudentRank(student.rank)} · ${activeCourseName ?? student.courseName}`
                : activeCourseName ?? student.courseName}
            </p>
          </div>
        </SectionCard>

        <SectionCard title="Upcoming exams" description="Prepare ahead" icon={CalendarDays}>
          <ExamsList exams={upcomingExams} />
        </SectionCard>

        <SectionCard
          title="Latest results"
          description="Recent grades"
          icon={BarChart3}
          actionLabel="All results"
          actionHref="/results"
        >
          <ResultsList results={latestResults} />
        </SectionCard>

        <SectionCard
          title="Achievements"
          description="Badges earned"
          icon={Medal}
          actionLabel="View all"
          actionHref="/achievements"
        >
          {achievements.length === 0 ? (
            <EmptyRow message="Complete lessons and exams to earn badges." />
          ) : (
            <div className="flex flex-wrap gap-2">
              {achievements.map((achievement) => (
                <Badge
                  key={achievement.id}
                  className="rounded-lg bg-icvf-navy px-2.5 py-1 text-xs font-medium text-white sm:px-3 sm:py-1.5"
                >
                  {achievement.title}
                </Badge>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Recent activity" description="Latest updates" icon={Sparkles}>
        <ActivityTimeline activities={activities} />
      </SectionCard>
    </div>
  );
}
