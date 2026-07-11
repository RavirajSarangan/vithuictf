import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbJsonLd, ItemListJsonLd, WebPageJsonLd } from "@/components/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getPublicCourses } from "@/lib/marketing-data";
import { CourseCard } from "@/components/courses/course-card";
import {
  MarketingContainer,
  MarketingSection,
  MarketingSectionIntro,
} from "@/components/landing/marketing-layout";

export const revalidate = 300;

const PAGE_TITLE = "ICT Courses | ICTF";
const PAGE_DESCRIPTION =
  "Browse all ICTF courses — O/L and A/L ICT classes with live Zoom sessions, experienced teachers, and islandwide paper centers across Sri Lanka.";

export const metadata: Metadata = buildPageMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  path: "/courses",
  keywords: [
    "ICT courses Sri Lanka",
    "O/L ICT class",
    "A/L ICT class",
    "ICT Zoom classes",
    "ICTF courses",
    "ICT tuition Sri Lanka",
  ],
  alternateLocales: ["en"],
});

export default async function CoursesPage() {
  const courses = await getPublicCourses();

  return (
    <>
      <WebPageJsonLd title={PAGE_TITLE} description={PAGE_DESCRIPTION} path="/courses" />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Courses", path: "/courses" },
        ]}
      />
      <ItemListJsonLd
        name="ICTF Courses"
        itemType="Course"
        items={courses.map((course) => ({
          name: course.name,
          url: `/courses/${course.slug}`,
          description: course.description || undefined,
        }))}
      />
      <MarketingSection tone="light">
        <MarketingSectionIntro
          as="h1"
          badge="Courses"
          title="Every ICTF course,"
          accent="one catalog"
          subtitle="Live Zoom classes for O/L and A/L ICT with structured schedules, session tracking, and support from the islandwide ICTF paper center network."
          light={false}
          badgeVariant="accent"
        />
        <MarketingContainer className="mt-10">
          {courses.length === 0 ? (
            <p className="text-center text-icvf-text-light">
              Courses are being updated — check back soon or{" "}
              <Link href="/register" className="font-semibold text-icvf-accent hover:underline">
                register your interest
              </Link>
              .
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  title={course.name}
                  description={course.description}
                  coverImageUrl={course.coverImageUrl}
                  category={course.category}
                  durationMonths={course.durationMonths}
                  teacherName={course.teacherName}
                  href={`/courses/${course.slug}`}
                />
              ))}
            </div>
          )}
        </MarketingContainer>
      </MarketingSection>
    </>
  );
}
