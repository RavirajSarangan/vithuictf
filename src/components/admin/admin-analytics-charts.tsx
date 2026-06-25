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
import type { Course, Payment } from "@/types";

const COLORS = ["#273461", "#F5A623", "#22C55E", "#64748B"];

interface AdminAnalyticsChartsProps {
  enrollmentData: { name: string; students: number }[];
  revenueData: { month: string; revenue: number }[];
  paymentStatus: { name: string; value: number }[];
}

export function AdminAnalyticsCharts({
  enrollmentData,
  revenueData,
  paymentStatus,
}: AdminAnalyticsChartsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <GlassCard className="border-white/10 bg-white/5">
        <h3 className="mb-4 font-semibold text-white">Enrollment by Course</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={enrollmentData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
            <XAxis dataKey="name" tick={{ fill: "#fff", fontSize: 10 }} />
            <YAxis tick={{ fill: "#fff" }} />
            <Tooltip />
            <Bar dataKey="students" fill="#F5A623" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </GlassCard>

      <GlassCard className="border-white/10 bg-white/5">
        <h3 className="mb-4 font-semibold text-white">Revenue Trend</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
            <XAxis dataKey="month" tick={{ fill: "#fff" }} />
            <YAxis tick={{ fill: "#fff" }} />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" stroke="#F5A623" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </GlassCard>

      <GlassCard className="border-white/10 bg-white/5 lg:col-span-2">
        <h3 className="mb-4 font-semibold text-white">Payment Status Distribution</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={paymentStatus}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {paymentStatus.map((_, i) => (
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

export type { Course, Payment };
