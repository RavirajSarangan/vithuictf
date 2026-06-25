"use client";

import { useState } from "react";
import { useParentData, useStudentResults } from "@/hooks/use-data";
import { StatCard } from "@/components/shared/stat-card";
import { GlassCard } from "@/components/shared/glass-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, BookOpen, Trophy } from "lucide-react";

export default function ParentDashboard() {
  const { children } = useParentData();
  const [selectedId, setSelectedId] = useState(children[0]?.id ?? "");
  const child = children.find((c) => c.id === selectedId) ?? children[0];
  const { results } = useStudentResults(child?.id);

  if (!child) return <p>No linked children found.</p>;

  return (
    <div className="flex flex-col gap-6">
      <Select value={selectedId} onValueChange={(v) => v && setSelectedId(v)}>
        <SelectTrigger className="w-64"><SelectValue placeholder="Select child" /></SelectTrigger>
        <SelectContent>
          {children.map((c) => (
            <SelectItem key={c.id} value={c.id}>{c.displayName}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Performance" value={`${child.performance}%`} icon={TrendingUp} />
        <StatCard title="Rank" value={`#${child.rank}`} icon={Trophy} />
        <StatCard title="Course" value={child.courseName} icon={BookOpen} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="bg-white">
          <h3 className="mb-4 font-semibold">Performance Overview</h3>
          <Progress value={child.performance} className="h-3" />
          <p className="mt-2 text-sm text-icvf-text-light">Grade: {child.grade} • Rank #{child.rank}</p>
        </GlassCard>

        <GlassCard className="bg-white lg:col-span-2">
          <h3 className="mb-4 font-semibold">Recent Results</h3>
          <div className="flex flex-col gap-2">
            {results.slice(-5).map((r) => (
              <div key={r.id} className="flex justify-between rounded-lg bg-icvf-surface p-3">
                <span>{r.subject} — {r.examTitle}</span>
                <span className="font-semibold text-icvf-accent">{r.grade}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
