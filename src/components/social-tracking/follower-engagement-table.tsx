"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { SocialBrandIcon } from "@/components/social-tracking/social-brand-icon";
import { suggestPerformance, formatRelativeTime } from "@/lib/social-tracking-utils";
import { getPlatformMeta } from "@/lib/social-platform-meta";
import { isLiveSyncPlatform, type LiveSyncState } from "@/lib/social-live-sync";
import type { SocialFollowerMetric, SocialPerformance } from "@/types";
import { ArrowDown, ArrowUp, ExternalLink, Minus, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

interface FollowerEngagementTableProps {
  metrics: SocialFollowerMetric[];
  onUpdate: (
    platformId: string,
    previousCount: number,
    currentCount: number,
    performance?: SocialPerformance | null
  ) => void;
  liveSyncState: LiveSyncState;
  liveSyncPlatforms: readonly string[];
}

const performanceOptions: { value: SocialPerformance; label: string }[] = [
  { value: "up", label: "Up" },
  { value: "down", label: "Down" },
  { value: "stable", label: "Stable" },
];

function PlatformLiveBadge({
  platformLabel,
  syncing,
  lastSynced,
}: {
  platformLabel: string;
  syncing?: boolean;
  lastSynced?: string | null;
}) {
  const title = syncing
    ? `Updating ${platformLabel} follower count…`
    : lastSynced
      ? `Auto-sync · Last updated ${formatRelativeTime(lastSynced)}`
      : `Auto-sync · waiting for first update`;

  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        syncing
          ? "border-icvf-accent/40 bg-icvf-accent/10 text-icvf-navy"
          : "border-emerald-500/35 bg-emerald-50 text-emerald-700"
      )}
    >
      <span className="relative flex size-2">
        <span
          className={cn(
            "absolute inline-flex size-full rounded-full opacity-75",
            syncing ? "animate-ping bg-icvf-accent" : "animate-ping bg-emerald-500"
          )}
        />
        <span
          className={cn(
            "relative inline-flex size-2 rounded-full",
            syncing ? "bg-icvf-accent" : "bg-emerald-500"
          )}
        />
      </span>
      <Radio className="size-3 shrink-0 opacity-80" aria-hidden />
      {syncing ? "Live · syncing" : "Live"}
    </span>
  );
}

function DeltaBadge({ delta }: { delta: number }) {
  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-icvf-text-light">
        <Minus className="size-3" /> 0
      </span>
    );
  }

  const positive = delta > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-semibold",
        positive ? "text-emerald-600" : "text-red-600"
      )}
    >
      {positive ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
      {positive ? "+" : ""}
      {delta.toLocaleString()}
    </span>
  );
}

function FollowerMetricRow({
  metric,
  onUpdate,
  liveSyncState,
  liveSyncPlatforms,
}: {
  metric: SocialFollowerMetric;
  onUpdate: FollowerEngagementTableProps["onUpdate"];
  liveSyncState: LiveSyncState;
  liveSyncPlatforms: readonly string[];
}) {
  const [previous, setPrevious] = useState(String(metric.previousCount));
  const [current, setCurrent] = useState(String(metric.currentCount));
  const [performance, setPerformance] = useState<SocialPerformance | "">(
    metric.performance ?? ""
  );

  const platformMeta = getPlatformMeta(metric.platformSlug);
  const slug = metric.platformSlug;
  const isLivePlatform = isLiveSyncPlatform(slug, liveSyncPlatforms);
  const liveState = isLivePlatform ? liveSyncState[slug] : undefined;
  const previousNum = Math.max(0, parseInt(previous, 10) || 0);
  const currentNum = Math.max(0, parseInt(current, 10) || 0);
  const delta = currentNum - previousNum;

  const commit = () => {
    const perf = performance || suggestPerformance(previousNum, currentNum);
    onUpdate(metric.platformId, previousNum, currentNum, perf);
  };

  const displayPerformance = performance || suggestPerformance(previousNum, currentNum);

  return (
    <tr className="border-b border-icvf-border last:border-0">
      <td className="px-4 py-3 font-medium text-icvf-navy">
        <div className="flex items-center gap-3">
          <SocialBrandIcon slug={metric.platformSlug} kind="platform" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span>{metric.platformName ?? platformMeta?.label ?? metric.platformSlug}</span>
              {isLivePlatform && liveState ? (
                <PlatformLiveBadge
                  platformLabel={platformMeta?.label ?? slug ?? "Platform"}
                  syncing={liveState.syncing}
                  lastSynced={liveState.lastSynced}
                />
              ) : null}
              {platformMeta?.url ? (
                <a
                  href={platformMeta.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-icvf-text-light hover:text-icvf-navy"
                  aria-label={`Open ${platformMeta.label}`}
                >
                  <ExternalLink className="size-3.5" />
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-2">
        <Input
          type="number"
          min={0}
          className="h-9 w-28"
          value={previous}
          onChange={(e) => setPrevious(e.target.value)}
          onBlur={commit}
        />
      </td>
      <td className="px-4 py-2">
        <Input
          type="number"
          min={0}
          className={cn("h-9 w-28", isLivePlatform && "border-emerald-200 bg-emerald-50/40")}
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          onBlur={commit}
          readOnly={isLivePlatform}
          title={
            isLivePlatform
              ? `Updated automatically from ${platformMeta?.label ?? slug}`
              : undefined
          }
        />
      </td>
      <td className="px-4 py-2">
        <DeltaBadge delta={delta} />
      </td>
      <td className="px-4 py-2">
        <Select
          value={displayPerformance}
          onValueChange={(value) => {
            if (!value) return;
            const perf = value as SocialPerformance;
            setPerformance(perf);
            onUpdate(metric.platformId, previousNum, currentNum, perf);
          }}
        >
          <SelectTrigger className="h-9 w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {performanceOptions.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                <span className="inline-flex items-center gap-1">
                  {value === "up" && <ArrowUp className="size-3" />}
                  {value === "down" && <ArrowDown className="size-3" />}
                  {value === "stable" && <Minus className="size-3" />}
                  {label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
    </tr>
  );
}

export function FollowerEngagementTable({
  metrics,
  onUpdate,
  liveSyncState,
  liveSyncPlatforms,
}: FollowerEngagementTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-icvf-border bg-white">
      <table className="w-full min-w-[680px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-icvf-border bg-icvf-surface/60">
            <th className="px-4 py-3 text-left font-semibold text-icvf-navy">Platform</th>
            <th className="px-4 py-3 text-left font-semibold text-icvf-navy">Previous</th>
            <th className="px-4 py-3 text-left font-semibold text-icvf-navy">Current</th>
            <th className="px-4 py-3 text-left font-semibold text-icvf-navy">Change</th>
            <th className="px-4 py-3 text-left font-semibold text-icvf-navy">Performance</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((metric) => (
            <FollowerMetricRow
              key={`${metric.weekId}-${metric.platformId}-${metric.updatedAt}`}
              metric={metric}
              onUpdate={onUpdate}
              liveSyncState={liveSyncState}
              liveSyncPlatforms={liveSyncPlatforms}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
