"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  useAdminAnalytics,
  useAdminAttendanceAnalysis,
  useAdminCourses,
  useAdminResults,
  useAdminStudents,
} from "@/hooks/use-admin-data";
import {
  buildCourseGrowth,
  buildDistrictBreakdown,
  buildExamYearBreakdown,
  buildGradeDistribution,
  buildGrowthRetentionTrend,
  buildScoreTrend,
  buildStudentGrowthTrend,
} from "@/lib/analytics/admin-analytics-utils";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const COURSE_GROWTH_PERIOD_DAYS = 30;

const chartSkeleton = (count: number) => (
  <div className="grid gap-6 lg:grid-cols-2">
    {Array.from({ length: count }).map((_, i) => (
      <Skeleton key={i} className="h-64 rounded-2xl" />
    ))}
  </div>
);

const AdminAnalyticsCharts = dynamic(
  () =>
    import("@/components/admin/admin-analytics-charts").then((mod) => mod.AdminAnalyticsCharts),
  { ssr: false, loading: () => chartSkeleton(3) }
);

const AdminStudentGrowthCharts = dynamic(
  () =>
    import("@/components/admin/admin-student-growth-charts").then((mod) => mod.AdminStudentGrowthCharts),
  { ssr: false, loading: () => chartSkeleton(4) }
);

const AdminAttendanceAnalysisCharts = dynamic(
  () =>
    import("@/components/admin/admin-attendance-analysis-charts").then(
      (mod) => mod.AdminAttendanceAnalysisCharts
    ),
  { ssr: false, loading: () => chartSkeleton(2) }
);

const AdminCoursePopularityCharts = dynamic(
  () =>
    import("@/components/admin/admin-course-popularity-charts").then(
      (mod) => mod.AdminCoursePopularityCharts
    ),
  { ssr: false, loading: () => chartSkeleton(2) }
);

const AdminResultsPerformanceCharts = dynamic(
  () =>
    import("@/components/admin/admin-results-performance-charts").then(
      (mod) => mod.AdminResultsPerformanceCharts
    ),
  { ssr: false, loading: () => chartSkeleton(2) }
);

type AnalyticsTab = "overview" | "students" | "attendance" | "courses" | "results";

export default function AdminAnalyticsPage() {
  const [tab, setTab] = useState<AnalyticsTab>("overview");
  const { courses, payments } = useAdminAnalytics();
  const students = useAdminStudents();
  const adminCourses = useAdminCourses();
  const results = useAdminResults();
  const attendance = useAdminAttendanceAnalysis();

  const enrollmentData = useMemo(
    () => courses.map((c) => ({ name: c.name.slice(0, 15), students: c.studentCount })),
    [courses]
  );
  const revenueData = useMemo(() => {
    const byMonth = new Map<string, number>();
    payments
      .filter((p) => p.status === "paid")
      .forEach((p) => {
        const month = new Date(p.date).toLocaleString("en", { month: "short", year: "2-digit" });
        byMonth.set(month, (byMonth.get(month) ?? 0) + p.amount);
      });
    return Array.from(byMonth.entries())
      .map(([month, revenue]) => ({ month, revenue }))
      .slice(-6);
  }, [payments]);
  const paymentStatus = useMemo(() => {
    const counts = { paid: 0, pending: 0, overdue: 0 };
    payments.forEach((p) => {
      counts[p.status]++;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [payments]);

  const studentGrowthTrend = useMemo(() => buildStudentGrowthTrend(students.data, "week"), [students.data]);
  const growthRetention = useMemo(() => buildGrowthRetentionTrend(students.data, "week"), [students.data]);
  const districtBreakdown = useMemo(() => buildDistrictBreakdown(students.data), [students.data]);
  const examYearBreakdown = useMemo(() => buildExamYearBreakdown(students.data), [students.data]);

  const courseGrowthRows = useMemo(
    () => buildCourseGrowth(students.data, adminCourses.data, COURSE_GROWTH_PERIOD_DAYS),
    [students.data, adminCourses.data]
  );

  const gradeDistribution = useMemo(() => buildGradeDistribution(results.data), [results.data]);
  const scoreTrend = useMemo(() => buildScoreTrend(results.data), [results.data]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Analytics" description="Enrollment, revenue, attendance, and performance insights" />

      <Tabs value={tab} onValueChange={(v) => v && setTab(v as AnalyticsTab)}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "overview" && (
        <AdminAnalyticsCharts
          enrollmentData={enrollmentData}
          revenueData={revenueData}
          paymentStatus={paymentStatus}
        />
      )}

      {tab === "students" && (
        <AdminStudentGrowthCharts
          trend={studentGrowthTrend}
          retention={growthRetention}
          byDistrict={districtBreakdown}
          byExamYear={examYearBreakdown}
        />
      )}

      {tab === "attendance" && (
        <AdminAttendanceAnalysisCharts data={attendance.data} loading={attendance.loading} />
      )}

      {tab === "courses" && (
        <AdminCoursePopularityCharts growthRows={courseGrowthRows} periodDays={COURSE_GROWTH_PERIOD_DAYS} />
      )}

      {tab === "results" && (
        <AdminResultsPerformanceCharts
          results={results.data}
          gradeDistribution={gradeDistribution}
          scoreTrend={scoreTrend}
        />
      )}
    </div>
  );
}
