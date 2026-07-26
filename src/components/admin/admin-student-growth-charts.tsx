"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
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
import { COLORS } from "@/components/admin/admin-analytics-charts";

interface AdminStudentGrowthChartsProps {
  trend: { period: string; newStudents: number }[];
  retention: { period: string; joined: number; deactivated: number; net: number }[];
  byDistrict: { name: string; value: number }[];
  byExamYear: { name: string; value: number }[];
}

export function AdminStudentGrowthCharts({
  trend,
  retention,
  byDistrict,
  byExamYear,
}: AdminStudentGrowthChartsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <GlassCard>
        <h3 className="mb-4 font-semibold text-icvf-navy">New Students Over Time</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="period" tick={{ fill: "#64748b", fontSize: 10 }} />
            <YAxis tick={{ fill: "#64748b" }} allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="newStudents" stroke="#273461" strokeWidth={2} name="New students" />
          </LineChart>
        </ResponsiveContainer>
      </GlassCard>

      <GlassCard>
        <h3 className="mb-4 font-semibold text-icvf-navy">Growth &amp; Retention</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={retention}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="period" tick={{ fill: "#64748b", fontSize: 10 }} />
            <YAxis tick={{ fill: "#64748b" }} allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="joined" fill="#22C55E" name="Joined" radius={[4, 4, 0, 0]} />
            <Bar dataKey="deactivated" fill="#64748B" name="Left" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </GlassCard>

      <GlassCard>
        <h3 className="mb-4 font-semibold text-icvf-navy">Students by District</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={byDistrict} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" tick={{ fill: "#64748b" }} allowDecimals={false} />
            <YAxis type="category" dataKey="name" width={100} tick={{ fill: "#64748b", fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="value" fill="#F5A623" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </GlassCard>

      <GlassCard>
        <h3 className="mb-4 font-semibold text-icvf-navy">Students by Exam Year</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={byExamYear} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
              {byExamYear.map((_, i) => (
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
