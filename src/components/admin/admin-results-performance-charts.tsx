"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GlassCard } from "@/components/shared/glass-card";
import { TableSummaryCards } from "@/components/admin/table-summary-cards";
import { resultTableSummary } from "@/lib/table-insights";
import type { Result } from "@/types";

interface AdminResultsPerformanceChartsProps {
  results: Result[];
  gradeDistribution: { name: string; value: number }[];
  scoreTrend: { period: string; avgScorePercent: number }[];
}

export function AdminResultsPerformanceCharts({
  results,
  gradeDistribution,
  scoreTrend,
}: AdminResultsPerformanceChartsProps) {
  return (
    <div className="flex flex-col gap-6">
      <TableSummaryCards items={resultTableSummary(results)} />

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard>
          <h3 className="mb-4 font-semibold text-icvf-navy">Grade Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={gradeDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis tick={{ fill: "#64748b" }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#273461" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard>
          <h3 className="mb-4 font-semibold text-icvf-navy">Average Score Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={scoreTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="period" tick={{ fill: "#64748b", fontSize: 10 }} />
              <YAxis tick={{ fill: "#64748b" }} domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="avgScorePercent" stroke="#22C55E" strokeWidth={2} name="Avg score %" />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>
    </div>
  );
}
