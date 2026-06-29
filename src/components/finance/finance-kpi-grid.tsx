"use client";

import Link from "next/link";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { FinanceOverview } from "@/types";
import { BookOpen, CreditCard, Layers, Users } from "lucide-react";

const cardGridClassName =
  "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4";

interface FinanceKpiGridProps {
  overview: FinanceOverview | null;
  loading?: boolean;
}

export function FinanceKpiGrid({ overview, loading }: FinanceKpiGridProps) {
  if (loading || !overview) {
    return (
      <div className={cardGridClassName}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Session revenue",
      value: `Rs. ${overview.totalSessionRevenueLkr.toLocaleString()}`,
      hint: "Paid per-class charges",
      icon: CreditCard,
      href: "/admin/finance/ledger?status=paid",
    },
    {
      title: "Outstanding",
      value: `Rs. ${overview.totalOutstandingLkr.toLocaleString()}`,
      hint: "Pending session fees",
      icon: Layers,
      href: "/admin/finance/students",
      alert: overview.totalOutstandingLkr > 0,
    },
    {
      title: "Sessions this month",
      value: overview.sessionsBilledThisMonth.toLocaleString(),
      hint: `At Rs. ${overview.perClassFeeLkr.toLocaleString()} per class`,
      icon: BookOpen,
      href: "/admin/finance/ledger",
    },
    {
      title: "Multi-course students",
      value: overview.multiCourseStudentCount.toLocaleString(),
      hint: "Students in 2+ billed courses",
      icon: Users,
      href: "/admin/finance/students",
    },
  ] as const;

  return (
    <div className={cardGridClassName}>
      {cards.map((card) => (
        <Card key={card.title} className="@container/card">
          <CardHeader>
            <CardDescription>{card.title}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {card.value}
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="flex gap-2 font-medium">
              <card.icon className="size-4 text-icvf-accent" />
              Per-class billing
            </div>
            <Link href={card.href} className="text-muted-foreground hover:text-foreground">
              {card.hint}
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
