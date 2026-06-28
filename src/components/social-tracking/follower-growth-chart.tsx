"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GlassCard } from "@/components/shared/glass-card";
import { SocialBrandIcon } from "@/components/social-tracking/social-brand-icon";
import { getPlatformMeta } from "@/lib/social-platform-meta";
import type { FollowerHistoryPoint, SocialFollowerMetric } from "@/types";
import { useMemo } from "react";

interface FollowerGrowthChartProps {
  metrics: SocialFollowerMetric[];
  history?: FollowerHistoryPoint[];
  showHistory?: boolean;
}

export function FollowerGrowthChart({
  metrics,
  history = [],
  showHistory = false,
}: FollowerGrowthChartProps) {
  const barData = metrics.map((m) => {
    const meta = getPlatformMeta(m.platformSlug);
    return {
      slug: m.platformSlug ?? "unknown",
      name: meta?.label ?? (m.platformName ?? m.platformSlug ?? "Platform")
        .replace(" Followers", "")
        .replace(" Channel", "")
        .replace(" Page", "")
        .replace(" Members", ""),
      fullName: m.platformName ?? m.platformSlug,
      count: m.currentCount,
      color: meta?.color ?? "#273461",
    };
  });

  const lineData = useMemo(() => {
    if (!showHistory || !history.length) return [];
    const weeks = [...new Set(history.map((h) => h.weekStart))].sort();
    return weeks.map((weekStart) => {
      const point: Record<string, string | number> = {
        week: new Date(`${weekStart}T00:00:00.000Z`).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          timeZone: "UTC",
        }),
      };
      for (const row of history.filter((h) => h.weekStart === weekStart)) {
        point[row.platformSlug] = row.currentCount;
      }
      return point;
    });
  }, [history, showHistory]);

  const platformSlugs = [...new Set(history.map((h) => h.platformSlug))];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <GlassCard>
        <h3 className="mb-4 font-semibold text-icvf-navy">Growth Graph</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="name"
              tick={{ fill: "#64748b", fontSize: 10 }}
              angle={-25}
              textAnchor="end"
              interval={0}
              height={60}
            />
            <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
            <Tooltip
              formatter={(value) => [
                typeof value === "number" ? value.toLocaleString() : String(value ?? ""),
                "Followers",
              ]}
              labelFormatter={(_, payload) =>
                (payload?.[0]?.payload as { fullName?: string } | undefined)?.fullName ?? ""
              }
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {barData.map((entry) => (
                <Cell key={entry.slug} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-3 flex flex-wrap gap-3">
          {barData.map((entry) => (
            <span key={entry.slug} className="inline-flex items-center gap-1.5 text-xs text-icvf-text-light">
              <SocialBrandIcon slug={entry.slug} kind="platform" size="sm" />
              {entry.name}
            </span>
          ))}
        </div>
      </GlassCard>

      {showHistory && lineData.length > 1 ? (
        <GlassCard>
          <h3 className="mb-4 font-semibold text-icvf-navy">Follower History</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="week" tick={{ fill: "#64748b", fontSize: 10 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
              <Tooltip />
              {platformSlugs.map((slug) => {
                const meta = getPlatformMeta(slug);
                return (
                  <Line
                    key={slug}
                    type="monotone"
                    dataKey={slug}
                    name={meta?.label ?? slug}
                    stroke={meta?.color ?? "#273461"}
                    strokeWidth={2}
                    dot={false}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-3 flex flex-wrap gap-3">
            {platformSlugs.map((slug) => (
              <span key={slug} className="inline-flex items-center gap-1.5 text-xs text-icvf-text-light">
                <SocialBrandIcon slug={slug} kind="platform" size="sm" />
                {getPlatformMeta(slug)?.label ?? slug}
              </span>
            ))}
          </div>
        </GlassCard>
      ) : null}
    </div>
  );
}
