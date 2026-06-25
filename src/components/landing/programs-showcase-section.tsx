"use client";

import {
  ArrowRight,
  BookOpen,
  Clock,
  FileText,
  FlaskConical,
  RefreshCw,
  Zap,
} from "lucide-react";
import { ButtonLink } from "@/components/shared/button-link";
import Link from "next/link";
import {
  MarketingNumberedCard,
  MarketingSection,
  MarketingSectionCta,
  MarketingSectionIntro,
} from "@/components/landing/marketing-layout";
import { MotionStagger, MotionStaggerItem } from "@/components/shared/motion-section";
import { useClassPrograms, useCourses } from "@/hooks/use-data";
import { useMarketingText } from "@/hooks/use-marketing-text";

const programIconMap = {
  BookOpen,
  RefreshCw,
  FileText,
  FlaskConical,
  Zap,
} as const;

export function ProgramsShowcaseSection() {
  const programs = useClassPrograms().filter((p) => p.isActive);
  const dbCourses = useCourses();
  const { t, field } = useMarketingText();

  const courseItems = dbCourses.map((course) => ({
    id: course.id,
    title: course.name,
    description: course.description ?? "",
    duration: course.durationMonths ? `${course.durationMonths} ${t("programs.months")}` : "—",
  }));

  return (
    <MarketingSection id="programs" tone="surface">
      <MarketingSectionIntro
        badge={t("programs.badge")}
        title={t("programs.title")}
        subtitle={t("programs.subtitle")}
        badgeVariant="accent"
        light={false}
      />

      <p className="-mt-8 mb-10 text-sm font-medium text-icvf-text-light sm:text-base">
        {t("programs.registerNote")}
      </p>

      <MotionStagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5" stagger={0.05}>
        {programs.map((program, i) => {
          const Icon = programIconMap[program.icon as keyof typeof programIconMap] ?? BookOpen;
          return (
            <MotionStaggerItem key={program.id}>
              <MarketingNumberedCard
                index={i + 1}
                icon={Icon}
                title={field(program, "title")}
                description={field(program, "description")}
                featured={i === 0}
              />
            </MotionStaggerItem>
          );
        })}
      </MotionStagger>

      {courseItems.length > 0 ? (
        <div className="mt-14">
          <h3 className="mb-6 text-lg font-bold text-icvf-navy sm:text-xl">{t("programs.tab.courses")}</h3>
          <MotionStagger className="grid gap-5 md:grid-cols-2 lg:grid-cols-3" stagger={0.05}>
            {courseItems.map((course, i) => (
              <MotionStaggerItem key={course.id}>
                <MarketingNumberedCard
                  index={i + 1}
                  title={course.title}
                  description={course.description}
                  footer={
                    <div className="flex items-center justify-between border-t border-icvf-border pt-4">
                      <span className="flex items-center gap-1.5 text-xs text-icvf-text-light">
                        <Clock className="size-3.5" />
                        {course.duration}
                      </span>
                      <Link
                        href="/register"
                        className="inline-flex items-center gap-1 text-sm font-medium text-icvf-navy transition-colors hover:text-icvf-accent"
                      >
                        {t("programs.viewProgram")}
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </div>
                  }
                />
              </MotionStaggerItem>
            ))}
          </MotionStagger>
        </div>
      ) : null}

      <MarketingSectionCta title={t("programs.ready")} subtitle={t("programs.readySub")}>
        <div className="flex justify-center">
          <ButtonLink href="/register" variant="icvf" className="gap-2" size="lg">
            {t("programs.applyProgram")}
            <ArrowRight className="size-4" />
          </ButtonLink>
        </div>
      </MarketingSectionCta>
    </MarketingSection>
  );
}
