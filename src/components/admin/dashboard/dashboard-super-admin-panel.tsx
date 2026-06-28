"use client";

import Link from "next/link";
import { FileText, FolderOpen, MapPin, Upload } from "lucide-react";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdminSuperAdminStats } from "@/hooks/use-admin-dashboard";

interface DashboardSuperAdminPanelProps {
  stats: AdminSuperAdminStats | null;
  loading?: boolean;
}

const cardGrid =
  "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card";

export function DashboardSuperAdminPanel({ stats, loading }: DashboardSuperAdminPanelProps) {
  if (loading || !stats) {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-icvf-navy">Operations</h2>
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
      title: "Paper Centers",
      value: stats.paperCenterCount,
      hint: "Active exam paper centers",
      href: "/admin/paper-centers",
      icon: MapPin,
    },
    {
      title: "Exam Paper Batches",
      value: stats.examBatchCount,
      hint: "Uploaded batches to review",
      href: "/admin/exam-papers",
      icon: Upload,
    },
    {
      title: "Pass Paper Folders",
      value: stats.passPaperFolderCount,
      hint: "Pass papers library folders",
      href: "/admin/pass-papers",
      icon: FolderOpen,
    },
    {
      title: "Pass Paper Items",
      value: stats.passPaperItemCount,
      hint: "Published drive links",
      href: "/admin/pass-papers",
      icon: FileText,
    },
  ] as const;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-icvf-navy">Operations</h2>
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
