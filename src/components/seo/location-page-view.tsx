import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BreadcrumbJsonLd, LocalBusinessJsonLd } from "@/components/seo/json-ld";
import { SeoContentPage } from "@/components/seo/seo-content-page";
import type { MarketingLocale } from "@/contexts/marketing-language-context";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  LOCATION_SLUGS,
  type LocationSlug,
  formatDistrictName,
  getLocationSeo,
} from "@/lib/seo/keywords";
import { SRI_LANKA_DISTRICT_COORDS } from "@/lib/data/sri-lanka-map-projection";
import { getMarketingHomeData } from "@/lib/marketing-data";
import type { ProgramContent } from "@/lib/seo/program-content";

export function generateStaticParams() {
  return LOCATION_SLUGS.map((district) => ({ district }));
}

function buildLocationContent(slug: LocationSlug, locale: MarketingLocale): ProgramContent {
  const name = formatDistrictName(slug);
  const centersNote =
    locale === "ta"
      ? `${name} மாவட்டத்தில் ICTF பேப்பர் மையங்கள் மற்றும் ஆன்லைன் Zoom வகுப்புகள் கிடைக்கின்றன.`
      : locale === "si"
        ? `${name} දිස්ත්‍රික්කයේ ICTF ප්‍රශ්න පත්‍ර මධ්‍යස්ථාන සහ අන්තර්ජාල Zoom පන්ති ලබා ගත හැක.`
        : `ICTF offers paper center access and online Zoom ICT classes for students in ${name} district, Sri Lanka.`;

  return {
    intro: getLocationSeo(slug).description[locale],
    sections: [
      {
        heading: locale === "ta" ? `${name} மாணவர்களுக்கு` : locale === "si" ? `${name} ශිෂ්‍යයින් සඳහා` : `For students in ${name}`,
        paragraphs: [centersNote],
        bullets:
          locale === "en"
            ? ["O/L ICT classes", "A/L ICT institute", "Online Zoom delivery", "Register at ictf.lk"]
            : undefined,
      },
      {
        heading: locale === "ta" ? "பதிவு" : locale === "si" ? "ලියාපදිංචි වන්න" : "Enroll from your district",
        paragraphs: [
          locale === "ta"
            ? "ictf.lk/register-ல் பதிவு செய்யுங்கள் அல்லது WhatsApp +94 77 459 1161."
            : locale === "si"
              ? "ictf.lk/register හරහා ලියාපදිංචි වන්න හෝ WhatsApp +94 77 459 1161."
              : "Register at ictf.lk/register or WhatsApp +94 77 459 1161 with your name, grade, and district.",
        ],
      },
    ],
    cta: locale === "ta" ? "இப்போது பதிவு செய்யுங்கள்" : locale === "si" ? "දැන් ලියාපදිංචි වන්න" : "Register now",
  };
}

export function createLocationMetadata(district: string, locale: MarketingLocale): Metadata {
  if (!LOCATION_SLUGS.includes(district as LocationSlug)) return {};
  const seo = getLocationSeo(district as LocationSlug);
  return buildPageMetadata({
    title: seo.title[locale],
    description: seo.description[locale],
    path: seo.path,
    locale,
  });
}

export async function LocationPageView({
  district,
  locale,
}: {
  district: string;
  locale: MarketingLocale;
}) {
  if (!LOCATION_SLUGS.includes(district as LocationSlug)) notFound();

  const slug = district as LocationSlug;
  const seo = getLocationSeo(slug);
  const content = buildLocationContent(slug, locale);
  const coords = SRI_LANKA_DISTRICT_COORDS[slug];
  const marketing = await getMarketingHomeData();
  const districtCenters = marketing.paperCenters.filter(
    (c) => c.district.toLowerCase() === slug && c.isActive
  );

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Locations", path: "/network/paper-centers" },
          { name: formatDistrictName(slug), path: seo.path },
        ]}
      />
      <LocalBusinessJsonLd district={slug} latitude={coords?.lat} longitude={coords?.lon} />
      <SeoContentPage
        locale={locale}
        h1={seo.h1[locale]}
        intro={content.intro}
        content={content}
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Network", path: "/network/paper-centers" },
          { name: formatDistrictName(slug), path: seo.path },
        ]}
      >
        {districtCenters.length > 0 ? (
          <section className="mt-10">
            <h2 className="text-xl font-semibold text-icvf-navy">
              {locale === "ta" ? "பேப்பர் மையங்கள்" : locale === "si" ? "ප්‍රශ්න පත්‍ර මධ්‍යස්ථාන" : "Paper centers"}
            </h2>
            <ul className="mt-4 space-y-3">
              {districtCenters.map((center) => (
                <li key={center.id} className="rounded-xl border border-icvf-border bg-white p-4">
                  <p className="font-medium text-icvf-navy">{center.name}</p>
                  <p className="text-sm text-icvf-text-light">{center.address}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        <p className="mt-6 text-sm">
          <Link href="/programs/online-zoom" className="text-icvf-navy underline">
            {locale === "ta" ? "ஆன்லைன் Zoom வகுப்புகள்" : locale === "si" ? "අන්තර්ජාල Zoom පන්ති" : "Online Zoom classes"}
          </Link>
        </p>
      </SeoContentPage>
    </>
  );
}
