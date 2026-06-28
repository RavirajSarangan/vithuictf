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
import type { TeacherDashboardStats } from "@/hooks/use-teacher-dashboard";
import { BarChart3Icon, BookOpenIcon, CalendarDaysIcon, UsersIcon } from "lucide-react";

interface TeacherSectionCardsProps {
  stats: TeacherDashboardStats;
}

const cardGridClassName =
  "grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4";

export function TeacherSectionCards({ stats }: TeacherSectionCardsProps) {
  if (stats.loading) {
    return (
      <div className={cardGridClassName}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-40 rounded-xl" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "My Students",
      value: stats.myStudents.toLocaleString(),
      href: "/admin/students",
      hint: "Students in your assigned courses",
      icon: UsersIcon,
    },
    {
      title: "My Courses",
      value: stats.myCourses.toLocaleString(),
      href: "/admin/courses",
      hint: "Courses you are assigned to",
      icon: BookOpenIcon,
    },
    {
      title: "Recent Results",
      value: stats.recentResults.toLocaleString(),
      href: "/admin/results",
      hint: "Results recorded in the last 7 days",
      icon: BarChart3Icon,
    },
    {
      title: "Upcoming Events",
      value: stats.upcomingEvents.toLocaleString(),
      href: "/admin/calendar",
      hint: "Scheduled calendar sessions",
      icon: CalendarDaysIcon,
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
              <Badge variant="outline">Your scope</Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              <card.icon className="size-4 text-icvf-accent" />
              Teaching workspace
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
