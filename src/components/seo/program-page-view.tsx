import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BreadcrumbJsonLd, CourseJsonLd, FaqPageJsonLd } from "@/components/seo/json-ld";
import { SeoContentPage } from "@/components/seo/seo-content-page";
import type { MarketingLocale } from "@/contexts/marketing-language-context";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getProgramBySlug } from "@/lib/seo/keywords";
import { PROGRAM_CONTENT, PROGRAM_FAQS } from "@/lib/seo/program-content";

export function createProgramMetadata(slug: string, locale: MarketingLocale): Metadata {
  const program = getProgramBySlug(slug);
  if (!program) return {};
  return buildPageMetadata({
    title: program.title[locale],
    description: program.description[locale],
    path: program.path,
    locale,
    keywords: program.keywords[locale],
    // English-only per-route opengraph-image.tsx; ta/si mirrors keep the global OG image.
    ogImage: locale === "en" ? null : undefined,
  });
}

export function ProgramPageView({ slug, locale }: { slug: string; locale: MarketingLocale }) {
  const program = getProgramBySlug(slug);
  if (!program) notFound();

  const content = PROGRAM_CONTENT[slug]?.[locale];
  if (!content) notFound();

  const faqs = PROGRAM_FAQS[slug]?.[locale] ?? [];

  const educationalLevel =
    slug === "ol-ict" ? "Ordinary Level (O/L)" : slug === "al-ict" ? "Advanced Level (A/L)" : "Secondary Education";

  const relatedLinks =
    locale === "ta"
      ? [
          ...(slug !== "ol-ict" ? [{ label: "O/L ICT வகுப்புகள்", path: "/programs/ol-ict" }] : []),
          ...(slug !== "al-ict" ? [{ label: "A/L ICT நிறுவனம்", path: "/programs/al-ict" }] : []),
          ...(slug !== "online-zoom" ? [{ label: "ஆன்லைன் Zoom வகுப்புகள்", path: "/programs/online-zoom" }] : []),
          { label: "பேப்பர் மையங்கள்", path: "/network/paper-centers" },
          { label: "ICT வலைப்பதிவு", path: "/blog" },
        ]
      : locale === "si"
        ? [
            ...(slug !== "ol-ict" ? [{ label: "O/L ICT පන්ති", path: "/programs/ol-ict" }] : []),
            ...(slug !== "al-ict" ? [{ label: "A/L ICT ආයතනය", path: "/programs/al-ict" }] : []),
            ...(slug !== "online-zoom" ? [{ label: "අන්තර්ජාල Zoom පන්ති", path: "/programs/online-zoom" }] : []),
            { label: "ප්‍රශ්න පත්‍ර මධ්‍යස්ථාන", path: "/network/paper-centers" },
            { label: "ICT බ්ලොග්", path: "/blog" },
          ]
        : [
            ...(slug !== "ol-ict" ? [{ label: "O/L ICT classes", path: "/programs/ol-ict" }] : []),
            ...(slug !== "al-ict" ? [{ label: "A/L ICT institute", path: "/programs/al-ict" }] : []),
            ...(slug !== "online-zoom" ? [{ label: "Online Zoom classes", path: "/programs/online-zoom" }] : []),
            { label: "Paper centers network", path: "/network/paper-centers" },
            { label: "ICT blog", path: "/blog" },
          ];

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Programs", path: "/#programs" },
          { name: program.h1[locale], path: program.path },
        ]}
        locale={locale}
      />
      <CourseJsonLd
        name={program.h1[locale]}
        description={program.description[locale]}
        path={program.path}
        educationalLevel={educationalLevel}
        locale={locale}
      />
      <FaqPageJsonLd faqs={faqs} />
      <SeoContentPage
        locale={locale}
        h1={program.h1[locale]}
        intro={content.intro}
        content={content}
        relatedLinks={relatedLinks}
        faqs={faqs}
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Programs", path: "/#programs" },
          { name: program.h1[locale], path: program.path },
        ]}
      />
    </>
  );
}
