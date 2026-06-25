import Link from "next/link";
import type { MarketingLocale } from "@/contexts/marketing-language-context";
import { ButtonLink } from "@/components/shared/button-link";
import { MarketingContainer, MarketingSection } from "@/components/landing/marketing-layout";
import type { ProgramContent } from "@/lib/seo/program-content";

interface SeoContentPageProps {
  locale: MarketingLocale;
  h1: string;
  intro: string;
  content: ProgramContent;
  breadcrumbs: { name: string; path: string }[];
  children?: React.ReactNode;
}

export function SeoContentPage({ locale, h1, intro, content, breadcrumbs, children }: SeoContentPageProps) {
  const homePrefix = locale === "en" ? "" : `/${locale}`;

  return (
    <MarketingSection tone="light" className="pt-8">
      <MarketingContainer className="max-w-4xl">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-icvf-text-light">
          <ol className="flex flex-wrap items-center gap-2">
            {breadcrumbs.map((crumb, i) => (
              <li key={crumb.path} className="flex items-center gap-2">
                {i > 0 ? <span aria-hidden>/</span> : null}
                <Link href={`${homePrefix}${crumb.path}`} className="hover:text-icvf-navy">
                  {crumb.name}
                </Link>
              </li>
            ))}
          </ol>
        </nav>

        <h1 className="text-3xl font-bold tracking-tight text-icvf-navy sm:text-4xl">{h1}</h1>
        <p className="mt-4 text-lg leading-relaxed text-icvf-text-light">{intro}</p>

        <div className="mt-10 space-y-10">
          {content.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-xl font-semibold text-icvf-navy sm:text-2xl">{section.heading}</h2>
              {section.paragraphs.map((p) => (
                <p key={p.slice(0, 40)} className="mt-3 leading-relaxed text-icvf-text-light">
                  {p}
                </p>
              ))}
              {section.bullets ? (
                <ul className="mt-4 list-disc space-y-2 pl-6 text-icvf-text-light">
                  {section.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>

        {children}

        <div className="mt-12 flex flex-wrap gap-4">
          <ButtonLink href="/register" variant="icvf" size="lg">
            {content.cta}
          </ButtonLink>
          <ButtonLink href={`${homePrefix}/#contact`} variant="outline" size="lg">
            Contact ICTF
          </ButtonLink>
        </div>

        <p className="mt-8 text-sm text-icvf-text-light">
          ICT Foundation (ICTF) · Jaffna, Sri Lanka ·{" "}
          <a href="tel:+94774591161" className="text-icvf-navy underline">
            +94 77 459 1161
          </a>{" "}
          · info@ictf.lk
        </p>
      </MarketingContainer>
    </MarketingSection>
  );
}
