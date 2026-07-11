import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarDays, Clock, GraduationCap, ListChecks, Users } from "lucide-react";
import { ButtonLink } from "@/components/shared/button-link";
import { BreadcrumbJsonLd, CourseJsonLd } from "@/components/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getPublicCourseBySlug, getPublicCourses } from "@/lib/marketing-data";
import {
  MarketingContainer,
  MarketingPanel,
  MarketingSection,
} from "@/components/landing/marketing-layout";
import type { CourseLevel } from "@/types";

export const revalidate = 300;

const LEVEL_LABELS: Record<CourseLevel, string> = {
  OL: "G.C.E. Ordinary Level (O/L)",
  AL: "G.C.E. Advanced Level (A/L)",
  University: "University",
  Professional: "Professional",
};

const WEEKDAY_LABELS: Record<string, string> = {
  sun: "Sunday",
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
};

/** "16:00:00" → "4:00 PM". Returns null for unparseable input. */
function formatTime(time: string): string | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(time);
  if (!match) return null;
  const hours = Number(match[1]);
  if (hours > 23) return null;
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${match[2]} ${suffix}`;
}

function truncate(text: string, max = 160): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

interface CoursePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const courses = await getPublicCourses();
    return courses
      .filter((course) => course.slug)
      .map((course) => ({ slug: course.slug as string }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getPublicCourseBySlug(slug);
  if (!course) {
    return { title: "Course not found" };
  }

  const levelLabel = LEVEL_LABELS[course.level] ?? course.level;
  return buildPageMetadata({
    title: `${course.name} — ${levelLabel} | ICTF`,
    description: course.description
      ? truncate(course.description)
      : `${course.name} at ICTF — live Zoom ICT classes with ${course.teacherName || "experienced teachers"} for students across Sri Lanka.`,
    path: `/courses/${slug}`,
    keywords: [course.name, `${course.name} class`, "ICT course Sri Lanka", "ICTF", levelLabel],
    ogImage: course.coverImageUrl || null,
    alternateLocales: ["en"],
  });
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { slug } = await params;
  const course = await getPublicCourseBySlug(slug);
  if (!course) notFound();

  const levelLabel = LEVEL_LABELS[course.level] ?? course.level;
  const dayLabels = (course.classDays ?? [])
    .map((day) => WEEKDAY_LABELS[day.toLowerCase()])
    .filter(Boolean);
  const startLabel = course.startTime ? formatTime(course.startTime) : null;
  const endLabel = course.endTime ? formatTime(course.endTime) : null;
  const timeLabel = startLabel && endLabel ? `${startLabel} – ${endLabel}` : startLabel ?? endLabel;

  const facts = [
    { icon: GraduationCap, label: "Level", value: levelLabel },
    course.durationMonths
      ? {
          icon: Clock,
          label: "Duration",
          value: `${course.durationMonths} ${course.durationMonths === 1 ? "month" : "months"}`,
        }
      : null,
    dayLabels.length
      ? {
          icon: CalendarDays,
          label: "Class days",
          value: dayLabels.join(", ") + (timeLabel ? ` · ${timeLabel}` : ""),
        }
      : null,
    course.studentCount
      ? { icon: Users, label: "Students", value: `${course.studentCount}+ enrolled` }
      : null,
    course.totalSessions
      ? {
          icon: ListChecks,
          label: "Sessions",
          value: `${course.completedSessions ?? 0}/${course.totalSessions} completed this batch`,
        }
      : null,
  ].filter((fact): fact is NonNullable<typeof fact> => Boolean(fact));

  return (
    <>
      <CourseJsonLd
        name={course.name}
        description={course.description || `${course.name} — ICT course at ICTF, Sri Lanka.`}
        path={`/courses/${course.slug}`}
        educationalLevel={levelLabel}
        image={course.coverImageUrl}
        instructorName={course.teacherName || undefined}
        durationMonths={course.durationMonths}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Courses", path: "/courses" },
          { name: course.name, path: `/courses/${course.slug}` },
        ]}
      />

      <MarketingSection tone="light">
        <MarketingContainer className="max-w-5xl">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 text-sm font-semibold text-icvf-accent hover:underline"
          >
            All courses
          </Link>

          <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-start">
            <div>
              {course.category ? (
                <span className="text-xs font-semibold uppercase tracking-wide text-icvf-accent">
                  {course.category}
                </span>
              ) : null}
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-icvf-navy md:text-4xl">
                {course.name}
              </h1>
              {course.teacherName ? (
                <p className="mt-3 text-sm font-medium text-icvf-text-light">
                  Conducted by {course.teacherName}
                </p>
              ) : null}
              {course.description ? (
                <p className="mt-5 text-base leading-relaxed text-icvf-text-light">
                  {course.description}
                </p>
              ) : null}

              <dl className="mt-8 grid gap-4 sm:grid-cols-2">
                {facts.map((fact) => (
                  <div key={fact.label} className="flex items-start gap-3">
                    <fact.icon className="mt-0.5 size-4 shrink-0 text-icvf-accent" />
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-icvf-text-light">
                        {fact.label}
                      </dt>
                      <dd className="mt-0.5 text-sm font-medium text-icvf-navy">{fact.value}</dd>
                    </div>
                  </div>
                ))}
              </dl>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <ButtonLink href="/register" variant="icvf" size="lg" className="gap-2">
                  Register for this course
                  <ArrowRight className="size-4" />
                </ButtonLink>
                <Link
                  href="/network/paper-centers"
                  className="text-sm font-semibold text-icvf-navy hover:text-icvf-accent"
                >
                  Find a paper center near you
                </Link>
              </div>
            </div>

            <MarketingPanel className="overflow-hidden p-0">
              <div className="relative aspect-square w-full">
                {course.coverImageUrl ? (
                  <Image
                    src={course.coverImageUrl}
                    alt={course.name}
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-icvf-navy/10 to-icvf-accent/25 text-4xl font-bold text-icvf-navy">
                    {course.name
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((word) => word[0])
                      .join("")
                      .toUpperCase()}
                  </div>
                )}
              </div>
            </MarketingPanel>
          </div>
        </MarketingContainer>
      </MarketingSection>
    </>
  );
}
