import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { SeoContentPage } from "@/components/seo/seo-content-page";
import type { MarketingLocale } from "@/contexts/marketing-language-context";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { FOUNDER_SEO } from "@/lib/seo/keywords";
import { FOUNDER } from "@/lib/seo/site";
import { getMarketingHomeData } from "@/lib/marketing-data";
import type { ProgramContent } from "@/lib/seo/program-content";
import { PersonJsonLd } from "@/components/seo/json-ld";
import Image from "next/image";

function founderContent(locale: MarketingLocale, bio: string, credentials: string): ProgramContent {
  return {
    intro: FOUNDER_SEO.description[locale],
    sections: [
      {
        heading:
          locale === "ta" ? "ஆசிரியர் பற்றி" : locale === "si" ? "ගුරුවරයා ගැන" : "About the educator",
        paragraphs: [bio || "Vithoosan Sivanathan leads ICT Foundation with a focus on O/L and A/L ICT excellence across Sri Lanka."],
      },
      {
        heading: locale === "ta" ? "சான்றிதழ்கள்" : locale === "si" ? "සුදුසුකම්" : "Credentials",
        paragraphs: [credentials],
      },
      {
        heading: locale === "ta" ? "ICTF பயிற்சி" : locale === "si" ? "ICTF ටියුෂන්" : "ICT Foundation tuition",
        paragraphs: [
          locale === "ta"
            ? "ICT அடித்தளம் (ICTF) இலங்கை முழுவதும் O/L மற்றும் A/L ICT பயிற்சியை வழங்குகிறது — யாழ்ப்பாணம் தலைமையகம், தீவு முழுவதும் Zoom வகுப்புகள்."
            : locale === "si"
              ? "ICT Foundation (ICTF) ශ්‍රී ලංකාව පුරා O/L සහ A/L ICT ටියුෂන් ලබා දෙයි — යාපනය ප්‍රධාන කාර්යාලය, දිවයින පුරා Zoom පන්ති."
              : "ICT Foundation (ICTF) delivers islandwide O/L and A/L ICT tuition — headquartered in Jaffna with Zoom classes serving every Sri Lankan district.",
        ],
      },
    ],
    cta: locale === "ta" ? "ICTF வகுப்புகளில் சேருங்கள்" : locale === "si" ? "ICTF පන්ති වලට සම්බන්ධ වන්න" : "Join ICTF classes",
  };
}

export function createFounderMetadata(locale: MarketingLocale): Metadata {
  return buildPageMetadata({
    title: FOUNDER_SEO.title[locale],
    description: FOUNDER_SEO.description[locale],
    path: FOUNDER_SEO.path,
    locale,
    ogType: "profile",
  });
}

export async function FounderPageView({ locale }: { locale: MarketingLocale }) {
  const marketing = await getMarketingHomeData();
  const about = marketing.homeAbout;
  const content = founderContent(locale, about?.bio ?? "", about?.credentials ?? "");

  return (
    <>
      <PersonJsonLd />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "About", path: "/#about" },
          { name: FOUNDER.name, path: FOUNDER_SEO.path },
        ]}
      />
      <SeoContentPage
        locale={locale}
        h1={FOUNDER_SEO.h1[locale]}
        intro={content.intro}
        content={content}
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "About", path: "/#about" },
          { name: FOUNDER.name, path: FOUNDER_SEO.path },
        ]}
      >
        <div className="mt-8 flex justify-center">
          <Image
            src={about?.photoUrl || FOUNDER.imagePath}
            alt={FOUNDER.name}
            width={320}
            height={400}
            className="rounded-2xl object-cover shadow-lg"
            unoptimized={(about?.photoUrl || FOUNDER.imagePath).endsWith(".svg")}
          />
        </div>
        <p className="mt-6 text-center text-sm text-icvf-text-light">
          <Link href="/rankings" className="text-icvf-navy underline">
            {locale === "ta" ? "தேர்வு முடிவுகள்" : locale === "si" ? "විභාග ප්‍රතිඵල" : "View examination results"}
          </Link>
        </p>
      </SeoContentPage>
    </>
  );
}
