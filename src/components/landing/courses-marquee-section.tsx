"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/shared/button-link";
import {
  MarketingSection,
  MarketingSectionIntro,
} from "@/components/landing/marketing-layout";
import { CourseCard } from "@/components/courses/course-card";
import { useCourses } from "@/hooks/use-data";
import { useMarketingText } from "@/hooks/use-marketing-text";
import { useMarqueeInView } from "@/hooks/use-marquee-in-view";

export function CoursesMarqueeSection() {
  const courses = useCourses();
  const { t } = useMarketingText();
  const { ref, inView } = useMarqueeInView<HTMLDivElement>();

  if (courses.length === 0) return null;

  // Looping the marquee only reads as "infinite" once there are enough real
  // cards that the seam isn't obvious — with only a couple of courses, the
  // cloned copy just looks like the same course appearing twice in a row.
  const MIN_COURSES_TO_LOOP = 5;
  const shouldLoop = courses.length >= MIN_COURSES_TO_LOOP;
  const track = shouldLoop ? [...courses, ...courses] : courses;

  const cards = track.map((course, index) => (
    <Link
      key={`${course.id}-${index}`}
      href={course.slug ? `/courses/${course.slug}` : "/register"}
      className="group block w-64 shrink-0 sm:w-72"
      aria-hidden={shouldLoop && index >= courses.length}
      tabIndex={shouldLoop && index >= courses.length ? -1 : undefined}
    >
      <CourseCard
        compact
        showStats
        title={course.name}
        description={course.description}
        coverImageUrl={course.coverImageUrl}
        category={course.category}
        durationMonths={course.durationMonths}
        classDaysPerWeek={course.classDaysPerWeek}
        classDays={course.classDays}
        startTime={course.startTime}
        endTime={course.endTime}
        totalSessions={course.totalSessions}
        completedSessions={course.completedSessions}
        teacherName={course.teacherName}
        studentCount={course.studentCount}
      />
    </Link>
  ));

  return (
    <MarketingSection id="courses" tone="surface">
      <MarketingSectionIntro
        badge={t("programs.badge")}
        title={t("programs.tab.courses")}
        subtitle={t("programs.subtitle")}
        badgeVariant="accent"
        light={false}
      />

      {shouldLoop ? (
        <div
          ref={ref}
          data-marquee-in-view={inView ? "true" : "false"}
          className="marketing-marquee-track"
        >
          <div className="courses-marquee flex w-max gap-5 py-2 motion-reduce:animate-none">{cards}</div>
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-5 py-2">{cards}</div>
      )}

      <div className="mt-10 flex justify-center">
        <ButtonLink href="/register" variant="icvf" className="gap-2" size="lg">
          {t("programs.applyProgram")}
          <ArrowRight className="size-4" />
        </ButtonLink>
      </div>
    </MarketingSection>
  );
}
