"use client";

import Image from "next/image";

interface AcademicsDashboardHeroProps {
  teacherName?: string;
}

export function AcademicsDashboardHero({ teacherName }: AcademicsDashboardHeroProps) {
  const title = teacherName ? "My classes" : "Academics Dashboard";
  const description = teacherName
    ? `Welcome, ${teacherName} — your batches, sessions, and attendance at a glance`
    : "Batches, enrollments, and class attendance at a glance";

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
        className="absolute inset-0 bg-gradient-to-r from-icvf-navy-dark/95 via-icvf-navy/70 to-transparent"
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
      <div className="relative z-10 flex min-h-40 max-w-md flex-col justify-center gap-1 p-5 sm:min-h-48 sm:p-6 md:min-h-52 md:p-8">
        <p className="text-sm font-medium text-icvf-accent">Academics Portal</p>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
        <p className="text-sm text-white/80">{description}</p>
      </div>
    </section>
  );
}
