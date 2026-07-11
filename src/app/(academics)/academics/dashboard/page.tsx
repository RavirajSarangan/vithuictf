"use client";

import { useEffect, useMemo, useState } from "react";
import { AcademicsDashboardHero } from "@/components/academics/academics-dashboard-hero";
import { useBatches, useAcademicsOverviewStats } from "@/hooks/use-academics";
import { useCurrentTeacher } from "@/hooks/use-student-data";
import { CourseThumbnail } from "@/components/courses/course-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { formatTime12 } from "@/lib/calendar/utils";
import {
  CalendarRange,
  ClipboardCheck,
  Layers,
  LineChart,
  Users,
} from "lucide-react";
import Link from "next/link";

type TodaySessionRow = {
  id: string;
  batch_id: string;
  session_number: number;
  start_time: string;
  status: string;
  attendance_marked: boolean;
  batchName: string;
};

function useTodaySessions() {
  const [sessions, setSessions] = useState<TodaySessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const supabase = createClient();
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      // RLS scopes sessions to the caller's accessible batches.
      const { data: rows } = await supabase
        .from("class_sessions")
        .select("id, batch_id, session_number, start_time, status, course_batches(name)")
        .eq("scheduled_date", today)
        .neq("status", "cancelled")
        .order("start_time", { ascending: true });
      if (cancelled) return;

      const sessionIds = (rows ?? []).map((r) => r.id);
      const marked = new Set<string>();
      if (sessionIds.length) {
        const { data: attendanceRows } = await supabase
          .from("attendance_records")
          .select("session_id")
          .in("session_id", sessionIds);
        for (const record of attendanceRows ?? []) marked.add(record.session_id);
      }

      setSessions(
        (rows ?? []).map((row) => {
          const batchRaw = row.course_batches as unknown;
          const batch = (Array.isArray(batchRaw) ? batchRaw[0] : batchRaw) as { name: string } | null;
          return {
            id: row.id,
            batch_id: row.batch_id,
            session_number: row.session_number,
            start_time: row.start_time,
            status: row.status,
            attendance_marked: marked.has(row.id),
            batchName: batch?.name ?? "Batch",
          };
        })
      );
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { sessions, loading };
}

export default function AcademicsDashboardPage() {
  const { data: batches, loading } = useBatches();
  const { stats, loading: statsLoading } = useAcademicsOverviewStats();
  const teacher = useCurrentTeacher();
  const { sessions: todaySessions, loading: todayLoading } = useTodaySessions();

  const activeBatches = useMemo(() => batches.filter((b) => b.active), [batches]);

  return (
    <div className="flex flex-col gap-6">
      <AcademicsDashboardHero teacherName={teacher?.displayName} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Today&apos;s sessions</CardTitle>
          <ClipboardCheck className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {todayLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : todaySessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No classes scheduled for today.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {todaySessions.map((session) => (
                <li
                  key={session.id}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {session.batchName} · Class {session.session_number}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime12(session.start_time)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {session.attendance_marked ? (
                      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                        Attendance marked
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                        Needs attendance
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      nativeButton={false}
                      render={<Link href={`/academics/attendance?session=${session.id}`} />}
                    >
                      {session.attendance_marked ? "Review" : "Mark"}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active batches</CardTitle>
            <Layers className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{loading ? "—" : activeBatches.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total batches</CardTitle>
            <CalendarRange className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{loading ? "—" : batches.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Enrolled students</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{statsLoading ? "—" : stats.activeEnrollments}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sessions this week</CardTitle>
            <CalendarRange className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{statsLoading ? "—" : stats.upcomingSessions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Attendance rate</CardTitle>
            <LineChart className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {statsLoading ? "—" : `${stats.attendanceRate}%`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Quick links</CardTitle>
            <ClipboardCheck className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <Link href="/academics/students" className="text-icvf-navy underline-offset-4 hover:underline">
              Manage students
            </Link>
            <Link href="/admin/courses" className="text-icvf-navy underline-offset-4 hover:underline">
              Manage courses
            </Link>
            <Link href="/academics/attendance" className="text-icvf-navy underline-offset-4 hover:underline">
              Mark attendance
            </Link>
            <Link href="/academics/assignments" className="text-icvf-navy underline-offset-4 hover:underline">
              Assignments
            </Link>
            <Link href="/academics/quizzes" className="text-icvf-navy underline-offset-4 hover:underline">
              Quizzes
            </Link>
            <Link href="/academics/reports" className="text-icvf-navy underline-offset-4 hover:underline">
              View reports
            </Link>
            <Link href="/academics/calendar" className="text-icvf-navy underline-offset-4 hover:underline">
              Class calendar
            </Link>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Recent batches</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading batches…</p>
        ) : activeBatches.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active batches yet.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {activeBatches.slice(0, 6).map((batch) => (
              <Link
                key={batch.id}
                href={`/academics/courses/${batch.courseId}`}
                className="flex gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
              >
                <CourseThumbnail
                  title={batch.courseName ?? batch.name}
                  coverImageUrl={batch.courseCoverImageUrl}
                  className="size-14"
                />
                <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{batch.name}</p>
                    <p className="text-sm text-muted-foreground">{batch.courseName}</p>
                  </div>
                  <Badge variant="outline">{batch.batchCode}</Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
