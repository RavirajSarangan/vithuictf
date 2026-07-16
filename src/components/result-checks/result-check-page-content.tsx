"use client";

import Link from "next/link";
import { LightPremiumCard } from "@/components/canvas";
import { ResultCheckForm } from "@/components/result-checks/result-check-form";
import { useMarketingText } from "@/hooks/use-marketing-text";

interface ResultCheckPageContentProps {
  enabled: boolean;
  slug?: string;
  linkActive?: boolean;
  courseName?: string;
}

export function ResultCheckPageContent({ enabled, slug, linkActive = true, courseName }: ResultCheckPageContentProps) {
  const { t } = useMarketingText();

  return (
    <div className="mx-auto max-w-lg text-center">
      <h1 className="text-2xl font-semibold text-icvf-navy">{t("results.checkModalTitle")}</h1>
      <p className="mt-2 text-sm text-icvf-text-light">{t("results.checkModalDescription")}</p>

      {!enabled ? (
        <LightPremiumCard className="mt-8 p-8">
          <p className="font-medium text-icvf-danger">{t("results.checkFeatureUnavailable")}</p>
        </LightPremiumCard>
      ) : !linkActive ? (
        <LightPremiumCard className="mt-8 p-8">
          <p className="font-medium text-icvf-danger">{t("results.checkLinkInactive")}</p>
        </LightPremiumCard>
      ) : (
        <LightPremiumCard className="mt-8 p-8 text-left">
          {courseName ? (
            <>
              <p className="text-sm font-medium text-icvf-text-light">{t("results.checkCourseLabel")}</p>
              <p className="mb-6 text-lg font-semibold text-icvf-navy">{courseName}</p>
            </>
          ) : null}
          <ResultCheckForm slug={slug} />
        </LightPremiumCard>
      )}

      <Link href="/" className="mt-8 inline-block text-sm font-medium text-icvf-accent hover:underline">
        {t("results.backToHome")}
      </Link>
    </div>
  );
}
