"use client";

import { useMemo } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { useBatches, useAcademicsOverviewStats } from "@/hooks/use-academics";
import { CourseThumbnail } from "@/components/courses/course-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarRange, ClipboardCheck, Layers, LineChart, Users } from "lucide-react";
import Link from "next/link";

export default function AcademicsDashboardPage() {
  const { data: batches, loading } = useBatches();
  const { stats, loading: statsLoading } = useAcademicsOverviewStats();

  const activeBatches = useMemo(() => batches.filter((b) => b.active), [batches]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Academics Dashboard"
        description="Batches, enrollments, and class attendance at a glance"
      />

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
            <Link href="/academics/batches" className="text-icvf-navy underline-offset-4 hover:underline">
              Create batch
            </Link>
            <Link href="/academics/attendance" className="text-icvf-navy underline-offset-4 hover:underline">
              Mark attendance
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
                href={`/academics/batches/${batch.id}`}
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
