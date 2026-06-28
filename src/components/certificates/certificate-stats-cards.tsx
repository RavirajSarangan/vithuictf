"use client";

import { Award, Clock, Mail } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface CertificateStatsCardsProps {
  stats: { total: number; thisMonth: number; pendingDelivery: number } | null;
  loading?: boolean;
}

export function CertificateStatsCards({ stats, loading }: CertificateStatsCardsProps) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  const items = [
    { label: "Total issued", value: stats.total, icon: Award, hint: "All certificates" },
    { label: "This month", value: stats.thisMonth, icon: Clock, hint: "Issued this month" },
    { label: "Pending delivery", value: stats.pendingDelivery, icon: Mail, hint: "Not yet emailed" },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-3">
      {items.map((item) => (
        <Card key={item.label} className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <div>
              <CardDescription>{item.label}</CardDescription>
              <CardTitle className="text-3xl tabular-nums">{item.value}</CardTitle>
            </div>
            <item.icon className="size-8 text-muted-foreground/60" />
          </CardHeader>
          <p className="px-6 pb-4 text-xs text-muted-foreground">{item.hint}</p>
        </Card>
      ))}
    </div>
  );
}
