"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GlassCard } from "@/components/shared/glass-card";

const COLORS = ["#273461", "#F5A623", "#22C55E", "#64748B"];

interface FinanceDashboardChartsProps {
  revenueByCourse: { courseName: string; revenueLkr: number }[];
  monthlyTrend: { month: string; revenueLkr: number }[];
  chargeStatusBreakdown: { name: string; value: number }[];
}

export function FinanceDashboardCharts({
  revenueByCourse,
  monthlyTrend,
  chargeStatusBreakdown,
}: FinanceDashboardChartsProps) {
  const courseData = revenueByCourse.map((c) => ({
    name: c.courseName.slice(0, 18),
    revenue: c.revenueLkr,
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <GlassCard>
        <h3 className="mb-4 font-semibold">Revenue by course</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={courseData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10 }} />
            <YAxis tick={{ fill: "#64748b" }} />
            <Tooltip formatter={(v) => `Rs. ${Number(v ?? 0).toLocaleString()}`} />
            <Bar dataKey="revenue" fill="#273461" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </GlassCard>

      <GlassCard>
        <h3 className="mb-4 font-semibold">Monthly session revenue</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={monthlyTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" tick={{ fill: "#64748b" }} />
            <YAxis tick={{ fill: "#64748b" }} />
            <Tooltip formatter={(v) => `Rs. ${Number(v ?? 0).toLocaleString()}`} />
            <Line type="monotone" dataKey="revenueLkr" stroke="#F5A623" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </GlassCard>

      <GlassCard className="lg:col-span-2">
        <h3 className="mb-4 font-semibold">Charge status</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chargeStatusBreakdown}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {chargeStatusBreakdown.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </GlassCard>
    </div>
  );
}
