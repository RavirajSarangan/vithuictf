"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { GlassCard } from "@/components/shared/glass-card";

interface ParentPerformanceChartProps {
  chartData: { term: string; average: number }[];
}

export function ParentPerformanceChart({ chartData }: ParentPerformanceChartProps) {
  return (
    <GlassCard className="bg-white">
      <h3 className="mb-4 font-semibold">Grade Trends</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="term" />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Line type="monotone" dataKey="average" stroke="#273461" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}
