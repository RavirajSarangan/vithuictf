"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useParentData, useStudentResults } from "@/hooks/use-student-data";
import { StudentPageLoading } from "@/components/student/portal/student-portal-states";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const ParentPerformanceChart = dynamic(
  () =>
    import("@/components/parent/parent-performance-chart").then((mod) => mod.ParentPerformanceChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[340px] rounded-2xl" />,
  }
);

export default function ParentPerformancePage() {
  const { children, loading } = useParentData();
  const [selectedId, setSelectedId] = useState(children[0]?.id ?? "");
  const { results } = useStudentResults(selectedId);

  const chartData = useMemo(() => {
    const terms = [...new Set(results.map((r) => r.term))];
    return terms.map((term) => {
      const termResults = results.filter((r) => r.term === term);
      const avg = termResults.reduce((s, r) => s + r.marks, 0) / (termResults.length || 1);
      return { term, average: Math.round(avg) };
    });
  }, [results]);

  if (loading) return <StudentPageLoading rows={2} />;
  if (children.length === 0) {
    return <p className="text-icvf-text-light">No linked children found.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <Select value={selectedId} onValueChange={(v) => v && setSelectedId(v)}>
        <SelectTrigger className="w-64">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {children.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.displayName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <ParentPerformanceChart chartData={chartData} />
    </div>
  );
}
