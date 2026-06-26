"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpenIcon,
  CreditCardIcon,
  GraduationCapIcon,
  UsersIcon,
} from "lucide-react";

type AdminStats = {
  totalStudents: number;
  totalTeachers: number;
  totalRevenue: number;
  totalCourses: number;
};

interface AdminDashboardSectionCardsProps {
  stats: AdminStats | null;
}

const cardGridClassName =
  "grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4";

export function AdminDashboardSectionCards({ stats }: AdminDashboardSectionCardsProps) {
  if (!stats) {
    return (
      <div className={`${cardGridClassName}`}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-40 rounded-xl" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Students",
      value: stats.totalStudents.toLocaleString(),
      href: "/admin/students",
      hint: "View and manage enrolled students",
      icon: UsersIcon,
    },
    {
      title: "Total Teachers",
      value: stats.totalTeachers.toLocaleString(),
      href: "/admin/teachers",
      hint: "View teaching staff roster",
      icon: GraduationCapIcon,
    },
    {
      title: "Total Revenue",
      value: `Rs. ${stats.totalRevenue.toLocaleString()}`,
      href: "/admin/payments",
      hint: "Track institute fee collections",
      icon: CreditCardIcon,
    },
    {
      title: "Total Courses",
      value: stats.totalCourses.toLocaleString(),
      href: "/admin/courses",
      hint: "Manage active course catalog",
      icon: BookOpenIcon,
    },
  ] as const;

  return (
    <div className={cardGridClassName}>
      {cards.map((card) => (
        <Card key={card.title} className="@container/card">
          <CardHeader>
            <CardDescription>{card.title}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {card.value}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">Live</Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              <card.icon className="size-4 text-icvf-accent" />
              Institute metric
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
