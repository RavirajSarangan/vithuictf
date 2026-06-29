"use client";

import dynamic from "next/dynamic";
import { FinanceKpiGrid } from "@/components/finance/finance-kpi-grid";
import { FinanceSubNav } from "@/components/finance/finance-sub-nav";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useFinanceOverview } from "@/hooks/use-finance";

const FinanceDashboardCharts = dynamic(
  () =>
    import("@/components/finance/finance-dashboard-charts").then(
      (mod) => mod.FinanceDashboardCharts
    ),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-2xl" />
        ))}
      </div>
    ),
  }
);

export default function AdminFinancePage() {
  const { overview, loading } = useFinanceOverview();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Finance"
        description="Per-class session billing at Rs. 1,200 per attended class, tracked per course"
      />
      <FinanceSubNav />
      <FinanceKpiGrid overview={overview} loading={loading} />
      {overview ? (
        <FinanceDashboardCharts
          revenueByCourse={overview.revenueByCourse}
          monthlyTrend={overview.monthlyTrend}
          chargeStatusBreakdown={overview.chargeStatusBreakdown}
        />
      ) : null}
    </div>
  );
}
