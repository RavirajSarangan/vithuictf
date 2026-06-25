"use client";

import Link from "next/link";
import { ArrowLeft, Trophy } from "lucide-react";
import { CanvasSection, LightPremiumCard } from "@/components/canvas";
import { SectionHeading } from "@/components/shared/section-heading";
import { useFeaturedRankings } from "@/hooks/use-data";
import { useMarketingText } from "@/hooks/use-marketing-text";
import { ButtonLink } from "@/components/shared/button-link";

const rankTypeLabel = {
  island: "rank.island",
  district: "rank.district",
  class: "rank.class",
} as const;

export default function PublicRankingsPage() {
  const rankings = useFeaturedRankings();
  const { t } = useMarketingText();

  return (
    <CanvasSection tone="light" className="pt-24">
      <div className="mb-8">
        <Link
          href="/#results"
          className="inline-flex items-center gap-2 text-sm font-medium text-icvf-navy hover:text-icvf-accent"
        >
          <ArrowLeft className="size-4" />
          {t("results.backToHome")}
        </Link>
      </div>

      <SectionHeading
        badge={t("results.badge")}
        title={t("results.fullHistoryTitle")}
        subtitle={t("results.fullHistorySubtitle")}
        light={false}
        badgeVariant="accent"
      />

      <div className="mb-6 flex items-center gap-2 text-icvf-navy">
        <Trophy className="size-5 text-icvf-accent" />
        <p className="text-sm text-icvf-text-light">
          {rankings.length} {t("results.totalAchievers")}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rankings.map((r, i) => (
          <LightPremiumCard key={r.id} className="flex items-center gap-4 p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-icvf-accent/15 text-sm font-semibold text-icvf-accent">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-icvf-navy">{r.studentName}</p>
              <p className="text-xs text-icvf-text-light">
                {t(rankTypeLabel[r.rankType])} · {r.score}%
              </p>
            </div>
          </LightPremiumCard>
        ))}
      </div>

      {rankings.length === 0 ? (
        <p className="mt-8 text-center text-icvf-text-light">{t("results.noRankings")}</p>
      ) : null}

      <div className="mt-12 text-center">
        <ButtonLink href="/register" variant="icvf" size="lg">
          {t("btn.register")}
        </ButtonLink>
      </div>
    </CanvasSection>
  );
}
