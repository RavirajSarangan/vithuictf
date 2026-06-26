import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { MarketingContainer, MarketingSection } from "@/components/landing/marketing-layout";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { LOCATION_SLUGS, formatDistrictName } from "@/lib/seo/keywords";
import { getMarketingHomeData } from "@/lib/marketing-data";
import { ButtonLink } from "@/components/shared/button-link";

export const metadata: Metadata = buildPageMetadata({
  title: "ICT Paper Centers Sri Lanka | ICTF Islandwide Network",
  description:
    "Find ICTF paper centers across Sri Lanka for O/L and A/L ICT past paper practice. Islandwide network from Jaffna to Colombo with online Zoom classes.",
  path: "/network/paper-centers",
});

export default async function PaperCentersPage() {
  const marketing = await getMarketingHomeData();
  const centers = marketing.paperCenters.filter((c) => c.isActive);

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Paper Centers", path: "/network/paper-centers" },
        ]}
      />
      <MarketingSection tone="light" className="pt-8">
        <MarketingContainer className="max-w-4xl">
          <h1 className="text-3xl font-bold text-icvf-navy sm:text-4xl">ICT Paper Center Network — Sri Lanka</h1>
          <p className="mt-4 text-lg text-icvf-text-light">
            ICTF operates an islandwide paper center network for O/L and A/L ICT past paper practice. Combine
            in-person paper sessions with live Zoom institute programs and the ICTF Student Portal.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {centers.map((center) => (
              <article key={center.id} className="rounded-2xl border border-icvf-border bg-white p-5">
                <h2 className="font-semibold text-icvf-navy">{center.name}</h2>
                <p className="mt-1 text-sm font-medium text-icvf-accent">{center.district}</p>
                <p className="mt-2 text-sm text-icvf-text-light">{center.address}</p>
                {center.district ? (
                  <Link
                    href={`/locations/${center.district.toLowerCase()}`}
                    className="mt-3 inline-block text-sm text-icvf-navy underline"
                  >
                    ICT institute in {center.district}
                  </Link>
                ) : null}
              </article>
            ))}
          </div>

          <section className="mt-12">
            <h2 className="text-xl font-semibold text-icvf-navy">Districts we serve</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {LOCATION_SLUGS.map((slug) => (
                <li key={slug}>
                  <Link
                    href={`/locations/${slug}`}
                    className="rounded-full border border-icvf-border bg-white px-4 py-2 text-sm text-icvf-navy hover:border-icvf-accent"
                  >
                    {formatDistrictName(slug)}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <div className="mt-12">
            <ButtonLink href="/register" variant="icvf" size="lg">
              Register for ICT classes
            </ButtonLink>
          </div>
        </MarketingContainer>
      </MarketingSection>
    </>
  );
}
