"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getAdminPortalTitle } from "@/lib/admin-access";
import type { UserRole } from "@/types";

interface DashboardHeroProps {
  role: UserRole;
  displayName?: string;
}

function useLiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return now;
}

function LiveClock({ className }: { className?: string }) {
  const now = useLiveClock();

  if (!now) {
    return <p className={className}>&nbsp;</p>;
  }

  const date = now.toLocaleDateString("en-LK", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const time = now.toLocaleTimeString("en-LK", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <p className={className}>
      {date} · {time}
    </p>
  );
}

export function DashboardHero({ role, displayName }: DashboardHeroProps) {
  const firstName = displayName?.split(" ")[0] ?? "Admin";
  const isTeacher = role === "teacher";
  const portalTitle = getAdminPortalTitle(role);

  if (role === "super_admin") {
    return (
      <section className="relative min-h-40 overflow-hidden rounded-2xl bg-icvf-navy-dark shadow-md sm:min-h-48 md:min-h-52">
        <Image
          src="/landing/coverpage.png"
          alt=""
          fill
          priority
          sizes="(max-width: 1280px) 100vw, 1200px"
          className="object-cover object-right"
        />
        <div
          className="absolute inset-0 bg-linear-to-r from-icvf-navy-dark/95 via-icvf-navy/70 to-transparent"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-y-0 left-[38%] hidden w-40 md:block lg:w-48" aria-hidden>
          <Image
            src="/landing/hero-founder.webp"
            alt=""
            fill
            sizes="12rem"
            className="object-contain object-bottom"
          />
        </div>
        <div className="relative z-10 flex min-h-40 flex-col justify-center gap-2 p-5 sm:min-h-48 sm:flex-row sm:items-end sm:justify-between sm:p-6 md:min-h-52 md:p-8">
          <div className="max-w-md">
            <p className="text-sm font-medium text-icvf-accent">{portalTitle}</p>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Good day, {firstName}
            </h1>
          </div>
          <LiveClock className="text-sm text-white/70 tabular-nums" />
        </div>
      </section>
    );
  }

  return (
    <div className="rounded-2xl border border-icvf-border bg-linear-to-br from-icvf-navy/5 via-card to-icvf-accent/5 p-5 shadow-xs sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-icvf-accent">{portalTitle}</p>
          <h1 className="text-2xl font-semibold tracking-tight text-icvf-navy sm:text-3xl">
            {isTeacher ? `Welcome, ${firstName}` : `Good day, ${firstName}`}
          </h1>
          {isTeacher ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Your teaching workspace — students, courses, and schedule
            </p>
          ) : null}
        </div>
        <LiveClock className="text-sm text-muted-foreground tabular-nums" />
      </div>
    </div>
  );
}
