"use client";

import { ArrowRight, Trophy } from "lucide-react";
import { ButtonLink } from "@/components/shared/button-link";
import {
  MarketingHorizontalRankCard,
  MarketingHorizontalRankList,
  MarketingPanel,
  MarketingSection,
  MarketingSectionCta,
  MarketingSectionIntro,
  MarketingStatHero,
} from "@/components/landing/marketing-layout";
import { MotionStagger, MotionStaggerItem } from "@/components/shared/motion-section";
import { useFeaturedRankings } from "@/hooks/use-data";
import { useMarketingText } from "@/hooks/use-marketing-text";
import { resultsHighlights, resultsStats } from "@/lib/data/results-content";

const rankTypeLabel = {
  island: "rank.island",
  district: "rank.district",
  class: "rank.class",
} as const;

export function ResultsShowcaseSection() {
  const rankings = useFeaturedRankings();
  const { t, locale } = useMarketingText();
  const topRankings = rankings.slice(0, 8);

  const statCards = [
    { label: t("results.islandRank"), value: `#${resultsStats.islandRank}`, featured: true },
    { label: t("results.districtTop10"), value: String(resultsStats.districtTop10), featured: false },
    { label: t("results.aGrades"), value: String(resultsStats.aGrades), featured: false },
    { label: t("results.bGrades"), value: String(resultsStats.bGrades), featured: false },
  ];

  return (
    <MarketingSection id="results" tone="light">
      <MarketingSectionIntro
        badge={t("results.badge")}
        title={t("results.title")}
        subtitle={t("results.subtitle")}
        light={false}
        badgeVariant="accent"
      />

      <MotionStagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" stagger={0.06}>
        {statCards.map((stat) => (
          <MotionStaggerItem key={stat.label}>
            <MarketingStatHero value={stat.value} label={stat.label} featured={stat.featured} />
          </MotionStaggerItem>
        ))}
      </MotionStagger>

      <MotionStagger className="mt-10 grid gap-6 lg:grid-cols-2" stagger={0.1}>
        {resultsHighlights.map((highlight) => (
          <MotionStaggerItem key={highlight.id}>
            <MarketingPanel featured>
              <div className="mb-6 flex items-center gap-4">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-white/15 text-xl font-bold text-white">
                  {highlight.studentName.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-icvf-accent">
                    {locale === "ta" ? highlight.examYearTa : highlight.examYear}
                  </p>
                  <p className="text-xs uppercase tracking-[0.16em] text-white/70">
                    {locale === "ta" ? highlight.rankLabelTa : highlight.rankLabel}
                  </p>
                </div>
              </div>
              <p className="text-4xl font-bold text-icvf-accent sm:text-5xl lg:text-6xl">#{highlight.rankNumber}</p>
              <h3 className="mt-4 text-2xl font-bold text-white">{highlight.studentName}</h3>
              <p className="mt-1 text-white/75">{locale === "ta" ? highlight.schoolTa : highlight.school}</p>
              <p className="mt-2 text-sm text-white/60">Index: {highlight.indexNo}</p>
            </MarketingPanel>
          </MotionStaggerItem>
        ))}
      </MotionStagger>

      <div className="mt-12">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h3 className="text-xl font-bold text-icvf-navy sm:text-2xl">{t("results.topRankings")}</h3>
          <Trophy className="size-6 text-icvf-accent" />
        </div>
        <MarketingHorizontalRankList>
          {topRankings.map((r, i) => (
            <MarketingHorizontalRankCard
              key={r.id}
              rank={i + 1}
              name={r.studentName}
              meta={`${t(rankTypeLabel[r.rankType])} · ${r.score}%`}
            />
          ))}
        </MarketingHorizontalRankList>
        {rankings.length > 0 ? (
          <p className="mt-4 text-center text-sm text-icvf-text-light">
            {rankings.length} {t("results.totalAchievers")}
          </p>
        ) : null}
      </div>

      <MarketingSectionCta title={t("results.cta")}>
        <div className="flex justify-center">
          <ButtonLink href="/register" variant="icvf" className="gap-2" size="lg">
            {t("btn.register")}
            <ArrowRight className="size-4" />
          </ButtonLink>
        </div>
      </MarketingSectionCta>
    </MarketingSection>
  );
}
