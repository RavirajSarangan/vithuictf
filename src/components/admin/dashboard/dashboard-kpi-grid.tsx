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
import type { AdminDashboardStats } from "@/hooks/use-admin-dashboard";
import {
  Award,
  BookOpen,
  CreditCard,
  FileText,
  FolderOpen,
  GraduationCapIcon,
  Mail,
  UserCheck,
  UsersIcon,
} from "lucide-react";

const cardGridClassName =
  "grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs sm:grid-cols-2 xl:grid-cols-4";

interface DashboardKpiGridProps {
  stats: AdminDashboardStats | null;
  loading?: boolean;
}

export function DashboardKpiGrid({ stats, loading }: DashboardKpiGridProps) {
  if (loading || !stats) {
    return (
      <div className={cardGridClassName}>
        {Array.from({ length: 9 }).map((_, index) => (
          <Skeleton key={index} className="h-36 rounded-xl" />
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
      title: "Total Staff",
      value: stats.totalTeachers.toLocaleString(),
      href: "/admin/people",
      hint: "Staff roster and portal access",
      icon: GraduationCapIcon,
    },
    {
      title: "Total Revenue",
      value: `Rs. ${stats.totalRevenue.toLocaleString()}`,
      href: "/admin/payments",
      hint: "Fee collections and payment records",
      icon: CreditCard,
    },
    {
      title: "Session fees due",
      value: `Rs. ${stats.outstandingSessionFeesLkr.toLocaleString()}`,
      href: "/admin/finance",
      hint: "Outstanding per-class session charges",
      icon: CreditCard,
      alert: stats.outstandingSessionFeesLkr > 0,
    },
    {
      title: "Total Courses",
      value: stats.totalCourses.toLocaleString(),
      href: "/admin/courses",
      hint: "Active course catalog",
      icon: BookOpen,
    },
    {
      title: "Certificates",
      value: stats.totalCertificates.toLocaleString(),
      href: "/admin/certificates",
      hint: "Issued certificates",
      icon: Award,
    },
    {
      title: "Resources",
      value: stats.totalResources.toLocaleString(),
      href: "/admin/resources",
      hint: "Study materials library",
      icon: FolderOpen,
    },
    {
      title: "Pending Payments",
      value: stats.pendingPayments.toLocaleString(),
      href: "/admin/payments",
      hint: "Awaiting payment confirmation",
      icon: CreditCard,
      alert: stats.pendingPayments > 0,
    },
    {
      title: "Pending Registrations",
      value: stats.pendingRegistrations.toLocaleString(),
      href: "/academics/enrollments",
      hint: "Review and approve new student sign-ups",
      icon: UserCheck,
      alert: stats.pendingRegistrations > 0,
    },
    {
      title: "Unread Inquiries",
      value: stats.unreadInquiries.toLocaleString(),
      href: "/admin/inquiries",
      hint: "New contact form messages",
      icon: Mail,
      alert: stats.unreadInquiries > 0,
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
              <Badge variant={"alert" in card && card.alert ? "destructive" : "outline"}>
                {"alert" in card && card.alert ? "Action" : "Live"}
              </Badge>
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
      {stats.overduePayments > 0 ? (
        <Card className="border-destructive/30 @container/card sm:col-span-2 xl:col-span-4">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardDescription>Overdue payments</CardDescription>
              <CardTitle className="text-xl text-destructive">
                {stats.overduePayments} payment{stats.overduePayments === 1 ? "" : "s"} overdue
              </CardTitle>
            </div>
            <FileText className="size-5 text-destructive" />
          </CardHeader>
          <CardFooter>
            <Link href="/admin/payments" className="text-sm text-destructive hover:underline">
              Review overdue payments →
            </Link>
          </CardFooter>
        </Card>
      ) : null}
    </div>
  );
}
