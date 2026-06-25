"use client";

import { ComingSoonPanel } from "@/components/shared/coming-soon-panel";
import { MarketingContainer } from "@/components/landing/marketing-layout";
import { useMarketingText } from "@/hooks/use-marketing-text";
import { BRAND } from "@/lib/constants";
import type { SitePublicMode } from "@/types";

interface SiteStatusPageProps {
  variant: Extract<SitePublicMode, "coming_soon" | "maintenance">;
}

export function SiteStatusPage({ variant }: SiteStatusPageProps) {
  const { t } = useMarketingText();
  const isMaintenance = variant === "maintenance";

  const eyebrowKey = isMaintenance
    ? "marketing.siteStatus.maintenance.eyebrow"
    : "marketing.siteStatus.comingSoon.eyebrow";
  const titleKey = isMaintenance
    ? "marketing.siteStatus.maintenance.title"
    : "marketing.siteStatus.comingSoon.title";
  const subtitleKey = isMaintenance
    ? "marketing.siteStatus.maintenance.subtitle"
    : "marketing.siteStatus.comingSoon.subtitle";

  return (
    <section
      className="flex min-h-[calc(100dvh-var(--marketing-header-offset)-8rem)] items-center py-20 sm:py-24"
      aria-labelledby="site-status-title"
    >
      <MarketingContainer className="flex w-full justify-center">
        <ComingSoonPanel
          eyebrow={t(eyebrowKey)}
          title={t(titleKey)}
          subtitle={t(subtitleKey)}
          titleId="site-status-title"
          variant={isMaintenance ? "maintenance" : "status"}
          headingLevel="h1"
          footer={
            !isMaintenance ? (
              <p className="text-sm text-icvf-text-light">
                <a
                  href={`mailto:${BRAND.contact.email}`}
                  className="font-medium text-icvf-navy underline-offset-4 transition-colors hover:text-icvf-accent hover:underline"
                >
                  {t("marketing.siteStatus.comingSoon.contact")}
                </a>
              </p>
            ) : null
          }
        />
      </MarketingContainer>
    </section>
  );
}
