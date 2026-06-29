"use client";

import dynamic from "next/dynamic";
import { useAdminDashboardOverview } from "@/hooks/use-admin-dashboard";
import { useAdminRevenueTrend } from "@/hooks/use-data";
import { DashboardActivityFeed } from "@/components/admin/dashboard/dashboard-activity-feed";
import { DashboardChartsRow } from "@/components/admin/dashboard/dashboard-charts-row";
import { DashboardDataTabs } from "@/components/admin/dashboard/dashboard-data-tabs";
import { DashboardHero } from "@/components/admin/dashboard/dashboard-hero";
import { DashboardKpiGrid } from "@/components/admin/dashboard/dashboard-kpi-grid";
import { DashboardQuickActions } from "@/components/admin/dashboard/dashboard-quick-actions";
import { DashboardSuperAdminPanel } from "@/components/admin/dashboard/dashboard-super-admin-panel";
import { DashboardAcademicsPanel } from "@/components/admin/dashboard/dashboard-academics-panel";
import { DashboardUpcomingSessions } from "@/components/admin/dashboard/dashboard-upcoming-sessions";
import { DashboardActiveBatches } from "@/components/admin/dashboard/dashboard-active-batches";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/providers/auth-provider";

const TeacherDashboard = dynamic(
  () => import("@/components/admin/dashboard/teacher-dashboard").then((mod) => mod.TeacherDashboard),
  {
    loading: () => <Skeleton className="h-96 rounded-2xl" />,
  }
);

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const overview = useAdminDashboardOverview(isSuperAdmin);
  const revenueTrend = useAdminRevenueTrend();

  if (authLoading) {
    return (
      <div className="admin-dashboard flex flex-col gap-4 md:gap-6">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-10 w-full max-w-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  if (user?.role === "teacher") {
    return <TeacherDashboard />;
  }

  const role = user?.role ?? "admin";

  return (
    <div className="admin-dashboard @container/main flex flex-col gap-4 md:gap-6">
      <DashboardHero role={role} displayName={user?.displayName} />
      <DashboardQuickActions role={role} />
      <DashboardKpiGrid stats={overview.stats} loading={overview.loading} />
      <DashboardActiveBatches />
      <DashboardChartsRow
        revenueTrend={revenueTrend}
        enrollmentData={overview.enrollmentData}
        paymentStatus={overview.paymentStatus}
        loading={overview.loading}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardActivityFeed items={overview.activity} loading={overview.loading} />
        <DashboardUpcomingSessions
          sessions={overview.upcomingSessions}
          loading={overview.loading}
        />
      </div>
      <DashboardDataTabs
        students={overview.recentStudents}
        payments={overview.recentPayments}
        inquiries={overview.recentInquiries}
        loading={overview.loading}
      />
      <DashboardAcademicsPanel stats={overview.academics} loading={overview.loading} />
      {isSuperAdmin ? (
        <DashboardSuperAdminPanel stats={overview.superAdmin} loading={overview.loading} />
      ) : null}
    </div>
  );
}
