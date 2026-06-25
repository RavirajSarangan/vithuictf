"use client";

import { useMemo } from "react";
import { GlassCard } from "@/components/shared/glass-card";
import { StudentEmptyState } from "@/components/student/portal/student-portal-states";
import type { Result } from "@/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#273461", "#34457E", "#F5A623", "#64748B", "#1c2547"];

interface ResultsChartsProps {
  results: Result[];
}

export function ResultsCharts({ results }: ResultsChartsProps) {
  const barData = useMemo(() => {
    const bySubject = new Map<string, number[]>();
    for (const result of results) {
      const list = bySubject.get(result.subject) ?? [];
      list.push(result.marks);
      bySubject.set(result.subject, list);
    }
    return [...bySubject.entries()].map(([subject, marks]) => ({
      subject,
      marks: Math.round(marks.reduce((sum, value) => sum + value, 0) / marks.length),
    }));
  }, [results]);

  const lineData = useMemo(() => {
    const terms = [...new Set(results.map((r) => r.term))].sort();
    return terms.map((term) => {
      const termResults = results.filter((r) => r.term === term);
      const avg = termResults.length
        ? termResults.reduce((s, r) => s + r.marks, 0) / termResults.length
        : 0;
      return { term, average: Math.round(avg) };
    });
  }, [results]);

  const radarData = useMemo(() => {
    const subjects = [...new Set(results.map((r) => r.subject))];
    return subjects.map((subject) => {
      const subjectResults = results.filter((r) => r.subject === subject);
      const avg = subjectResults.reduce((s, r) => s + r.marks, 0) / subjectResults.length;
      return { subject, score: Math.round(avg) };
    });
  }, [results]);

  const pieData = useMemo(() => {
    const grades: Record<string, number> = {};
    results.forEach((r) => {
      grades[r.grade] = (grades[r.grade] || 0) + 1;
    });
    return Object.entries(grades).map(([name, value]) => ({ name, value }));
  }, [results]);

  return (
    <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
      <GlassCard>
        <h3 className="mb-4 font-semibold text-icvf-navy">Subject analysis</h3>
        {barData.length === 0 ? (
          <StudentEmptyState message="Not enough data for subject analysis." />
        ) : (
          <ResponsiveContainer width="100%" height={240} minHeight={200}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="subject" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={50} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="marks" fill="#273461" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </GlassCard>

      <GlassCard>
        <h3 className="mb-4 font-semibold text-icvf-navy">Grade trends</h3>
        {lineData.length === 0 ? (
          <StudentEmptyState message="Term trends will appear after multiple exam terms." />
        ) : (
          <ResponsiveContainer width="100%" height={240} minHeight={200}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="term" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="average"
                stroke="#F5A623"
                strokeWidth={3}
                dot={{ fill: "#F5A623" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </GlassCard>

      <GlassCard>
        <h3 className="mb-4 font-semibold text-icvf-navy">Subject balance</h3>
        {radarData.length === 0 ? (
          <StudentEmptyState message="Subject balance chart needs result data." />
        ) : (
          <ResponsiveContainer width="100%" height={240} minHeight={200}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
              <Radar dataKey="score" stroke="#273461" fill="#273461" fillOpacity={0.3} />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </GlassCard>

      <GlassCard>
        <h3 className="mb-4 font-semibold text-icvf-navy">Grade distribution</h3>
        {pieData.length === 0 ? (
          <StudentEmptyState message="Grade distribution will appear with your results." />
        ) : (
          <ResponsiveContainer width="100%" height={240} minHeight={200}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </GlassCard>
    </div>
  );
}
