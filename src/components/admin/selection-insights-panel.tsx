"use client";

import { GlassCard } from "@/components/shared/glass-card";
import { Badge } from "@/components/ui/badge";

export interface SelectionInsight {
  label: string;
  value: string | number;
}

export function SelectionInsightsPanel({
  count,
  insights,
}: {
  count: number;
  insights?: SelectionInsight[];
}) {
  if (count === 0) return null;

  return (
    <GlassCard className="flex flex-wrap items-center gap-3 border-primary/20 bg-primary/5 p-4">
      <span className="text-sm font-medium">
        {count} selected
      </span>
      {insights?.map((insight) => (
        <Badge key={insight.label} variant="secondary" className="font-normal">
          {insight.label}: {insight.value}
        </Badge>
      ))}
    </GlassCard>
  );
}
