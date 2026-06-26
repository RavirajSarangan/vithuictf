"use client";

import dynamic from "next/dynamic";
import { useAdminRevenueTrend, useAdminStats } from "@/hooks/use-data";
import { AdminDashboardSectionCards } from "@/components/admin/dashboard/section-cards";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import dashboardData from "@/components/admin/dashboard/data.json";

const AdminDashboardDataTable = dynamic(
  () =>
    import("@/components/admin/dashboard/data-table").then((mod) => mod.AdminDashboardDataTable),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[420px] rounded-xl" />,
  }
);

const AdminDashboardRevenueChart = dynamic(
  () =>
    import("@/components/admin/dashboard/chart-area-interactive").then(
      (mod) => mod.AdminDashboardRevenueChart
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[340px] rounded-xl" />,
  }
);

export default function AdminDashboard() {
  const stats = useAdminStats();
  const revenueTrend = useAdminRevenueTrend();

  return (
    <div className="admin-dashboard @container/main flex flex-col gap-4 md:gap-6">
      <PageHeader title="Dashboard" description="Overview of institute metrics" />
      <AdminDashboardSectionCards stats={stats} />
      <AdminDashboardRevenueChart data={revenueTrend} />
      <AdminDashboardDataTable data={dashboardData} />
    </div>
  );
}
