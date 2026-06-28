"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { RevenuePoint } from "./dashboard-charts-row-types";

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

const DashboardMiniAnalytics = dynamic(
  () =>
    import("@/components/admin/dashboard/dashboard-mini-analytics").then(
      (mod) => mod.DashboardMiniAnalytics
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[340px] rounded-xl" />,
  }
);

interface DashboardChartsRowProps {
  revenueTrend: RevenuePoint[] | null;
  enrollmentData: { name: string; students: number }[];
  paymentStatus: { name: string; value: number }[];
  loading?: boolean;
}

export function DashboardChartsRow({
  revenueTrend,
  enrollmentData,
  paymentStatus,
  loading,
}: DashboardChartsRowProps) {
  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[340px] rounded-xl lg:col-span-2" />
        <Skeleton className="h-[280px] rounded-xl" />
        <Skeleton className="h-[280px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="lg:col-span-2">
        <AdminDashboardRevenueChart data={revenueTrend} />
      </div>
      <DashboardMiniAnalytics enrollmentData={enrollmentData} paymentStatus={paymentStatus} />
    </div>
  );
}
