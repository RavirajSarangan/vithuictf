"use client";

import Link from "next/link";
import {
  Award,
  CreditCard,
  FileText,
  Mail,
  UserPlus,
} from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardActivityItem } from "@/hooks/use-admin-dashboard";

const TYPE_ICONS = {
  student: UserPlus,
  payment: CreditCard,
  inquiry: Mail,
  certificate: Award,
  exam_batch: FileText,
} as const;

function formatRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface DashboardActivityFeedProps {
  items: DashboardActivityItem[];
  loading?: boolean;
  title?: string;
}

export function DashboardActivityFeed({
  items,
  loading,
  title = "Recent activity",
}: DashboardActivityFeedProps) {
  return (
    <GlassCard className="flex h-full min-h-[280px] flex-col">
      <h2 className="mb-4 text-lg font-semibold text-icvf-navy">{title}</h2>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recent activity to show.</p>
      ) : (
        <ul className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
          {items.map((item) => {
            const Icon = TYPE_ICONS[item.type];
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="flex items-start gap-3 rounded-lg border border-transparent p-2 transition-colors hover:border-icvf-border hover:bg-muted/50"
                >
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-icvf-navy/5">
                    <Icon className="size-4 text-icvf-accent" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{item.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {item.subtitle}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {formatRelativeTime(item.timestamp)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </GlassCard>
  );
}
