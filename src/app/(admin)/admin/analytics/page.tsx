"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { useAdminAnalytics } from "@/hooks/use-admin-data";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";

const AdminAnalyticsCharts = dynamic(
  () =>
    import("@/components/admin/admin-analytics-charts").then((mod) => mod.AdminAnalyticsCharts),
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

export default function AdminAnalyticsPage() {
  const { courses, payments } = useAdminAnalytics();

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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Analytics" description="Enrollment, revenue, and payment insights" />
      <AdminAnalyticsCharts
        enrollmentData={enrollmentData}
        revenueData={revenueData}
        paymentStatus={paymentStatus}
      />
    </div>
  );
}
