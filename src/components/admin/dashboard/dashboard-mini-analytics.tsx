"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GlassCard } from "@/components/shared/glass-card";

const COLORS = ["#273461", "#F5A623", "#EF4444", "#64748B"];

interface DashboardMiniAnalyticsProps {
  enrollmentData: { name: string; students: number }[];
  paymentStatus: { name: string; value: number }[];
}

export function DashboardMiniAnalytics({
  enrollmentData,
  paymentStatus,
}: DashboardMiniAnalyticsProps) {
  return (
    <>
      <GlassCard>
        <h3 className="mb-4 font-semibold text-icvf-navy">Enrollment by Course</h3>
        {enrollmentData.length === 0 ? (
          <p className="text-sm text-muted-foreground">No enrollment data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={enrollmentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10 }} />
              <YAxis tick={{ fill: "#64748b" }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="students" fill="#F5A623" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </GlassCard>

      <GlassCard>
        <h3 className="mb-4 font-semibold text-icvf-navy">Payment Status</h3>
        {paymentStatus.every((p) => p.value === 0) ? (
          <p className="text-sm text-muted-foreground">No payment records yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={paymentStatus}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={72}
                label={({ name, value }) => `${name}: ${value}`}
              >
                {paymentStatus.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </GlassCard>
    </>
  );
}
