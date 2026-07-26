"use client";

import { GlassCard } from "@/components/shared/glass-card";
import { AdminTableSection } from "@/components/admin/admin-table-section";
import { Badge } from "@/components/ui/badge";
import { courseGrowthTableSummary, courseGrowthSelectionInsights } from "@/lib/table-insights";
import type { CourseGrowthRow } from "@/lib/analytics/admin-analytics-utils";

interface AdminCoursePopularityChartsProps {
  growthRows: CourseGrowthRow[];
  periodDays: number;
}

export function AdminCoursePopularityCharts({ growthRows, periodDays }: AdminCoursePopularityChartsProps) {
  return (
    <div className="flex flex-col gap-6">
      <GlassCard>
        <h3 className="mb-1 font-semibold text-icvf-navy">Course Growth &amp; Decline</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          New enrollments in the last {periodDays} days vs. the previous {periodDays} days.
        </p>
        <AdminTableSection<CourseGrowthRow>
          columns={[
            { key: "courseName", label: "Course" },
            { key: "currentEnrollment", label: "Current students" },
            { key: "newInPeriod", label: "New (recent)" },
            { key: "newInPriorPeriod", label: "New (prior)" },
            {
              key: "deltaEnrollments",
              label: "Change",
              render: (row) => (
                <Badge variant={row.deltaEnrollments > 0 ? "default" : row.deltaEnrollments < 0 ? "destructive" : "outline"}>
                  {row.deltaEnrollments > 0 ? "+" : ""}
                  {row.deltaEnrollments}
                </Badge>
              ),
            },
            {
              key: "deltaPercent",
              label: "Change %",
              render: (row) => `${row.deltaPercent > 0 ? "+" : ""}${row.deltaPercent}%`,
            },
          ]}
          data={growthRows}
          summaryItems={courseGrowthTableSummary(growthRows)}
          getSelectionInsights={courseGrowthSelectionInsights}
          entityLabel="course"
          emptyMessage="No course enrollment data yet."
        />
      </GlassCard>
    </div>
  );
}
