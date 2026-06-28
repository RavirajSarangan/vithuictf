"use client";

import { getAdminPortalTitle } from "@/lib/admin-access";
import type { UserRole } from "@/types";

interface DashboardHeroProps {
  role: UserRole;
  displayName?: string;
}

function formatToday() {
  return new Date().toLocaleDateString("en-LK", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function DashboardHero({ role, displayName }: DashboardHeroProps) {
  const firstName = displayName?.split(" ")[0] ?? "Admin";
  const isTeacher = role === "teacher";
  const portalTitle = getAdminPortalTitle(role);

  return (
    <div className="rounded-2xl border border-icvf-border bg-linear-to-br from-icvf-navy/5 via-card to-icvf-accent/5 p-5 shadow-xs sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-icvf-accent">{portalTitle}</p>
          <h1 className="text-2xl font-semibold tracking-tight text-icvf-navy sm:text-3xl">
            {isTeacher ? `Welcome, ${firstName}` : `Good day, ${firstName}`}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isTeacher
              ? "Your teaching workspace — students, courses, and schedule"
              : "Institute overview — students, revenue, and operations at a glance"}
          </p>
        </div>
        <p className="text-sm text-muted-foreground tabular-nums">{formatToday()}</p>
      </div>
    </div>
  );
}
