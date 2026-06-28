import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
import { getPaperCentersOnly } from "@/lib/marketing-data";
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
      {
        heading:
          locale === "ta"
            ? "ICTF நிரல்கள்"
            : locale === "si"
              ? "ICTF වැඩසටහන්"
              : "ICTF programs for your district",
        paragraphs: [
          locale === "ta"
            ? `${name} மாவட்ட மாணவர்கள் O/L ICT, A/L ICT மற்றும் ஆன்லைன் Zoom வகுப்புகளுக்கு ICTF-ல் பதிவு செய்யலாம். வகுப்புகள் நேரடி Zoom, பதிவுகள் மற்றும் ICTF மாணவர் தளத்துடன் வழங்கப்படுகின்றன.`
            : locale === "si"
              ? `${name} දිස්ත්‍රික්කයේ ශිෂ්‍යයින්ට O/L ICT, A/L ICT සහ අන්තර්ජාල Zoom පන්ති සඳහා ICTF හි ලියාපදිංචි විය හැක. පන්ති සජීවී Zoom, පටිගත කිරීම් සහ ICTF ශිෂ්‍ය ද්වාරය හරහා ලබා දෙයි.`
              : `Students in ${name} district can enroll in ICTF O/L ICT, A/L ICT, and online Zoom programs. Classes include live Zoom sessions, recordings, past paper support at nearby paper centers, and full access to the ICTF Student Portal.`,
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
  const marketing = await getPaperCentersOnly();
  const districtCenters = marketing.filter(
    (c) => c.district.toLowerCase() === slug && c.isActive
  );

  const relatedLinks =
    locale === "ta"
      ? [
          { label: "O/L ICT வகுப்புகள்", path: "/programs/ol-ict" },
          { label: "A/L ICT நிறுவனம்", path: "/programs/al-ict" },
          { label: "ஆன்லைன் Zoom வகுப்புகள்", path: "/programs/online-zoom" },
          { label: "பேப்பர் மையங்கள்", path: "/network/paper-centers" },
          { label: "ICT வலைப்பதிவு", path: "/blog" },
        ]
      : locale === "si"
        ? [
            { label: "O/L ICT පන්ති", path: "/programs/ol-ict" },
            { label: "A/L ICT ආයතනය", path: "/programs/al-ict" },
            { label: "අන්තර්ජාල Zoom පන්ති", path: "/programs/online-zoom" },
            { label: "ප්‍රශ්න පත්‍ර මධ්‍යස්ථාන", path: "/network/paper-centers" },
            { label: "ICT බ්ලොග්", path: "/blog" },
          ]
        : [
            { label: "O/L ICT classes", path: "/programs/ol-ict" },
            { label: "A/L ICT institute", path: "/programs/al-ict" },
            { label: "Online Zoom classes", path: "/programs/online-zoom" },
            { label: "Paper centers network", path: "/network/paper-centers" },
            { label: "ICT blog", path: "/blog" },
          ];

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Locations", path: "/network/paper-centers" },
          { name: formatDistrictName(slug), path: seo.path },
        ]}
        locale={locale}
      />
      <LocalBusinessJsonLd
        district={slug}
        latitude={coords?.lat}
        longitude={coords?.lon}
        locale={locale}
      />
      <SeoContentPage
        locale={locale}
        h1={seo.h1[locale]}
        intro={content.intro}
        content={content}
        relatedLinks={relatedLinks}
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
      </SeoContentPage>
    </>
  );
}
