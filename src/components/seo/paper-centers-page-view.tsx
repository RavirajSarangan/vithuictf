import Link from "next/link";
import { BreadcrumbJsonLd, ItemListJsonLd } from "@/components/seo/json-ld";
import { MarketingContainer, MarketingSection } from "@/components/landing/marketing-layout";
import type { MarketingLocale } from "@/contexts/marketing-language-context";
import { absoluteUrl } from "@/lib/seo/site";
import { LOCATION_SLUGS, formatDistrictName } from "@/lib/seo/keywords";
import { localizedPath } from "@/lib/seo/metadata";
import { getPaperCentersOnly } from "@/lib/marketing-data";
import { ButtonLink } from "@/components/shared/button-link";

const COPY = {
  en: {
    home: "Home",
    paperCenters: "Paper Centers",
    h1: "ICT Paper Center Network — Sri Lanka",
    intro:
      "ICTF operates an islandwide paper center network for O/L and A/L ICT past paper practice. Combine in-person paper sessions with live Zoom institute programs and the ICTF Student Portal.",
    instituteIn: (district: string) => `ICT institute in ${district}`,
    districtsHeading: "Districts we serve",
    cta: "Register for ICT classes",
  },
  ta: {
    home: "முகப்பு",
    paperCenters: "பேப்பர் மையங்கள்",
    h1: "ICT பேப்பர் மைய வலையமைப்பு — இலங்கை",
    intro:
      "O/L மற்றும் A/L ICT பேப்பர் பயிற்சிக்காக ICTF இலங்கை முழுவதும் பேப்பர் மைய வலையமைப்பை இயக்குகிறது. நேரடி பேப்பர் அமர்வுகளை Zoom நேரடி வகுப்புகள் மற்றும் ICTF மாணவர் போர்ட்டலுடன் இணைக்கவும்.",
    instituteIn: (district: string) => `${district} மாவட்டத்தில் ICT நிறுவனம்`,
    districtsHeading: "நாங்கள் சேவை செய்யும் மாவட்டங்கள்",
    cta: "ICT வகுப்புகளுக்கு பதிவு செய்யுங்கள்",
  },
  si: {
    home: "මුල් පිටුව",
    paperCenters: "ප්‍රශ්න පත්‍ර මධ්‍යස්ථාන",
    h1: "ICT ප්‍රශ්න පත්‍ර මධ්‍යස්ථාන ජාලය — ශ්‍රී ලංකාව",
    intro:
      "O/L සහ A/L ICT ප්‍රශ්න පත්‍ර පුහුණුව සඳහා ICTF ශ්‍රී ලංකාව පුරා ප්‍රශ්න පත්‍ර මධ්‍යස්ථාන ජාලයක් ක්‍රියාත්මක කරයි. සජීවී Zoom පන්ති සහ ICTF ශිෂ්‍ය ද්වාරය සමඟ ප්‍රශ්න පත්‍ර සැසි ඒකාබද්ධ කරන්න.",
    instituteIn: (district: string) => `${district} දිස්ත්‍රික්කයේ ICT ආයතනය`,
    districtsHeading: "අප සේවය සපයන දිස්ත්‍රික්ක",
    cta: "ICT පන්ති සඳහා ලියාපදිංචි වන්න",
  },
} as const;

export async function PaperCentersPageView({ locale }: { locale: MarketingLocale }) {
  const copy = COPY[locale];
  const centers = (await getPaperCentersOnly()).filter((c) => c.isActive);
  const path = "/network/paper-centers";

  return (
    <>
      <BreadcrumbJsonLd
        locale={locale}
        items={[
          { name: copy.home, path: "/" },
          { name: copy.paperCenters, path },
        ]}
      />
      <ItemListJsonLd
        name={copy.h1}
        items={centers.map((center) => ({
          name: center.name,
          url: absoluteUrl(localizedPath(path, locale)),
          description: [center.district, center.address].filter(Boolean).join(" — "),
        }))}
      />
      <MarketingSection tone="light" className="pt-8">
        <MarketingContainer className="max-w-4xl">
          <h1 className="text-3xl font-bold text-icvf-navy sm:text-4xl">{copy.h1}</h1>
          <p className="mt-4 text-lg text-icvf-text-light">{copy.intro}</p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {centers.map((center) => (
              <article key={center.id} className="rounded-2xl border border-icvf-border bg-white p-5">
                <h2 className="font-semibold text-icvf-navy">{center.name}</h2>
                <p className="mt-1 text-sm font-medium text-icvf-accent">{center.district}</p>
                <p className="mt-2 text-sm text-icvf-text-light">{center.address}</p>
                {center.district ? (
                  <Link
                    href={localizedPath(`/locations/${center.district.toLowerCase()}`, locale)}
                    className="mt-3 inline-block text-sm text-icvf-navy underline"
                  >
                    {copy.instituteIn(center.district)}
                  </Link>
                ) : null}
              </article>
            ))}
          </div>

          <section className="mt-12">
            <h2 className="text-xl font-semibold text-icvf-navy">{copy.districtsHeading}</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {LOCATION_SLUGS.map((slug) => (
                <li key={slug}>
                  <Link
                    href={localizedPath(`/locations/${slug}`, locale)}
                    className="rounded-full border border-icvf-border bg-white px-4 py-2 text-sm text-icvf-navy hover:border-icvf-accent"
                  >
                    {formatDistrictName(slug)}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <div className="mt-12">
            <ButtonLink href={localizedPath("/register", locale)} variant="icvf" size="lg">
              {copy.cta}
            </ButtonLink>
          </div>
        </MarketingContainer>
      </MarketingSection>
    </>
  );
}
