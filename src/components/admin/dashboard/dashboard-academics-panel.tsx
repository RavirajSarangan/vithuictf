"use client";

import Link from "next/link";
import { CalendarDays, ClipboardCheck, Layers, LineChart } from "lucide-react";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdminAcademicsStats } from "@/hooks/use-admin-dashboard";

interface DashboardAcademicsPanelProps {
  stats: AdminAcademicsStats | null;
  loading?: boolean;
}

const cardGrid =
  "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card";

export function DashboardAcademicsPanel({ stats, loading }: DashboardAcademicsPanelProps) {
  if (loading || !stats) {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-icvf-navy">Academics</h2>
        <div className={cardGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const cards = [
    {
      title: "Active batches",
      value: stats.activeBatches,
      hint: "Manage course batches",
      href: "/academics/batches",
      icon: Layers,
    },
    {
      title: "Today's classes",
      value: stats.todaysSessions,
      hint: "Class sessions scheduled today",
      href: "/academics/calendar",
      icon: CalendarDays,
    },
    {
      title: "Missing attendance",
      value: stats.missingAttendance,
      hint: "Today's sessions without marks",
      href: "/academics/attendance",
      icon: ClipboardCheck,
    },
    {
      title: "Weekly attendance",
      value: `${stats.weeklyAttendanceRate}%`,
      hint: "Present + late rate this week",
      href: "/academics/reports",
      icon: LineChart,
    },
  ] as const;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-icvf-navy">Academics</h2>
      <div className={cardGrid}>
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader>
              <CardDescription>{card.title}</CardDescription>
              <CardTitle className="text-2xl tabular-nums">{card.value}</CardTitle>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1 text-sm">
              <card.icon className="size-4 text-icvf-accent" />
              <Link href={card.href} className="text-muted-foreground hover:text-foreground">
                {card.hint}
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}
