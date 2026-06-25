"use client";

import { ComingSoonBackdrop, ComingSoonPanel } from "@/components/shared/coming-soon-panel";
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
      className="marketing-coming-soon-shell relative isolate mx-auto flex min-h-[calc(100dvh-var(--marketing-header-offset)-8rem)] w-full max-w-[100rem] items-center overflow-hidden"
      aria-labelledby="site-status-title"
    >
      <ComingSoonBackdrop dark />

      <div className="relative z-10 flex w-full items-center justify-center px-4 py-10 sm:px-6 sm:py-16">
        <ComingSoonPanel
          eyebrow={t(eyebrowKey)}
          title={t(titleKey)}
          subtitle={t(subtitleKey)}
          titleId="site-status-title"
          variant={isMaintenance ? "maintenance" : "status"}
          headingLevel="h1"
          footer={
            !isMaintenance ? (
              <p className="text-sm text-icvf-navy/70">
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
      </div>
    </section>
  );
}
