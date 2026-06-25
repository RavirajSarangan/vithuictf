"use client";

import { ComingSoonBackdrop, ComingSoonPanel } from "@/components/shared/coming-soon-panel";
import { useMarketingText } from "@/hooks/use-marketing-text";

export function MarketingComingSoonShell() {
  const { t } = useMarketingText();

  return (
    <section
      className="marketing-coming-soon-shell relative isolate mx-auto w-full max-w-[100rem] overflow-hidden"
      aria-labelledby="marketing-coming-soon-title"
    >
      <ComingSoonBackdrop />

      <div className="relative z-10 flex min-h-[min(52vh,480px)] items-center justify-center px-4 py-10 sm:min-h-[min(48vh,440px)] sm:px-6 sm:py-12">
        <ComingSoonPanel
          eyebrow={t("marketing.comingSoon.eyebrow")}
          title={t("marketing.comingSoon.title")}
          subtitle={t("marketing.comingSoon.subtitle")}
          titleId="marketing-coming-soon-title"
          variant="update"
        />
      </div>
    </section>
  );
}
