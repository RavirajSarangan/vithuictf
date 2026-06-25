import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BreadcrumbJsonLd, CourseJsonLd } from "@/components/seo/json-ld";
import { SeoContentPage } from "@/components/seo/seo-content-page";
import type { MarketingLocale } from "@/contexts/marketing-language-context";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getProgramBySlug } from "@/lib/seo/keywords";
import { PROGRAM_CONTENT } from "@/lib/seo/program-content";

export function createProgramMetadata(slug: string, locale: MarketingLocale): Metadata {
  const program = getProgramBySlug(slug);
  if (!program) return {};
  return buildPageMetadata({
    title: program.title[locale],
    description: program.description[locale],
    path: program.path,
    locale,
  });
}

export function ProgramPageView({ slug, locale }: { slug: string; locale: MarketingLocale }) {
  const program = getProgramBySlug(slug);
  if (!program) notFound();

  const content = PROGRAM_CONTENT[slug]?.[locale];
  if (!content) notFound();

  const educationalLevel =
    slug === "ol-ict" ? "Ordinary Level (O/L)" : slug === "al-ict" ? "Advanced Level (A/L)" : "Secondary Education";

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Programs", path: "/#programs" },
          { name: program.h1[locale], path: program.path },
        ]}
      />
      <CourseJsonLd
        name={program.h1[locale]}
        description={program.description[locale]}
        path={program.path}
        educationalLevel={educationalLevel}
      />
      <SeoContentPage
        locale={locale}
        h1={program.h1[locale]}
        intro={content.intro}
        content={content}
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Programs", path: "/#programs" },
          { name: program.h1[locale], path: program.path },
        ]}
      />
    </>
  );
}
