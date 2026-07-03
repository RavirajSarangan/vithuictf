"use client";

import type { LucideIcon } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { cn } from "@/lib/utils";

export interface SummaryCardItem {
  label: string;
  value: number | string;
  icon?: LucideIcon;
  variant?: "default" | "warning" | "success" | "muted";
}

const variantStyles: Record<NonNullable<SummaryCardItem["variant"]>, string> = {
  default: "text-foreground",
  warning: "text-amber-600",
  success: "text-emerald-600",
  muted: "text-muted-foreground",
};

export function TableSummaryCards({ items }: { items: SummaryCardItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <GlassCard key={item.label} className="flex flex-col gap-1 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {Icon && <Icon className="size-4 shrink-0" />}
              <span>{item.label}</span>
            </div>
            <p
              className={cn(
                "text-2xl font-semibold tabular-nums",
                variantStyles[item.variant ?? "default"]
              )}
            >
              {item.value}
            </p>
          </GlassCard>
        );
      })}
    </div>
  );
}
