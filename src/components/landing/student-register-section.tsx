"use client";

import Link from "next/link";
import {
  MarketingBleedCtaSection,
  MarketingCtaActions,
  MarketingSectionCta,
} from "@/components/landing/marketing-layout";
import { MotionSection } from "@/components/shared/motion-section";
import { useMarketingText } from "@/hooks/use-marketing-text";

export function StudentRegisterSection() {
  const { t } = useMarketingText();

  return (
    <MarketingBleedCtaSection id="register">
      <MotionSection>
        <MarketingSectionCta
          badge={t("auth.registerBadge")}
          title={t("auth.registerTitle")}
          subtitle={t("auth.registerSubtitle")}
          variant="flat"
        >
          <MarketingCtaActions
            registerLabel={t("btn.register")}
            loginLabel={t("btn.login")}
            showRegisterArrow
          />
          <p className="mt-6 text-sm text-white/65">
            {t("auth.haveAccount")}{" "}
            <Link href="/login" className="font-semibold text-icvf-accent hover:underline">
              {t("btn.login")}
            </Link>
          </p>
        </MarketingSectionCta>
      </MotionSection>
    </MarketingBleedCtaSection>
  );
}
