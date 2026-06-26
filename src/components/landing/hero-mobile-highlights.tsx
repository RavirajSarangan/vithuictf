"use client";

import type { LucideIcon } from "lucide-react";
import { FileText, Monitor, Video } from "lucide-react";
import { AnimatedCounter } from "@/components/magic-ui/animated-counter";
import { MotionStagger, MotionStaggerItem } from "@/components/shared/motion-section";
import type { MarketingUiKey } from "@/lib/i18n/marketing-ui";
import { resultsHighlights, resultsStats } from "@/lib/data/results-content";
import { useMarketingText } from "@/hooks/use-marketing-text";
import { cn } from "@/lib/utils";

const learningChips: { icon: LucideIcon; titleKey: MarketingUiKey }[] = [
  { icon: Video, titleKey: "hero.liveZoom" },
  { icon: Monitor, titleKey: "hero.lmsPortal" },
  { icon: FileText, titleKey: "centers.paperCenters" },
];

function ProofStatCard({
  value,
  prefix,
  suffix,
  label,
  accent = false,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[4.25rem] min-w-0 flex-col justify-center rounded-xl border px-2 py-2 sm:min-h-[4.5rem] sm:px-3 sm:py-2.5",
        accent
          ? "border-icvf-accent/30 bg-gradient-to-br from-[#fff8eb] to-[#fff4dc]"
          : "border-icvf-border/80 bg-white/90 shadow-sm"
      )}
    >
      <p
        className={cn(
          "text-base font-bold tabular-nums leading-none sm:text-lg",
          accent ? "text-icvf-accent" : "text-icvf-navy"
        )}
      >
        <AnimatedCounter value={value} prefix={prefix} suffix={suffix} duration={1600} />
      </p>
      <p className="mt-1.5 text-[10px] font-semibold uppercase leading-tight tracking-[0.1em] text-icvf-text-light">
        {label}
      </p>
    </div>
  );
}

export function HeroMobileProofStrip() {
  const { t } = useMarketingText();
  const topHighlight = resultsHighlights[0];
  const abTotal = resultsStats.aGrades + resultsStats.bGrades;

  return (
    <MotionStagger className="mt-4 min-w-0 max-w-full" stagger={0.08}>
      <MotionStaggerItem>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-icvf-navy/55">
          {t("hero.mobileProofTitle")}
        </p>
      </MotionStaggerItem>
      <MotionStaggerItem className="grid min-w-0 max-w-full grid-cols-3 gap-2">
        {topHighlight ? (
          <ProofStatCard
            value={topHighlight.rankNumber}
            prefix="#"
            label={t("rank.island")}
            accent
          />
        ) : null}
        <ProofStatCard value={abTotal} label={t("hero.abGrades")} />
        <ProofStatCard value={100} suffix="%" label={t("hero.passRate")} />
      </MotionStaggerItem>
    </MotionStagger>
  );
}

function LearningChip({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-icvf-navy/15 bg-white px-3.5 py-2 text-xs font-semibold text-[#1c2547] shadow-sm sm:px-4 sm:py-2.5 sm:text-sm">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#fff4dc] text-icvf-accent sm:size-8">
        <Icon className="size-3.5 sm:size-4" aria-hidden />
      </span>
      <span className="whitespace-nowrap text-[#1c2547]">{label}</span>
    </span>
  );
}

export function HeroMobileLearningChips() {
  const { t } = useMarketingText();
  const chipItems = learningChips.map(({ icon, titleKey }) => ({
    icon,
    label: t(titleKey),
    key: titleKey,
  }));

  const loop = Array.from({ length: 4 }, () => chipItems).flat();
  const track = [...loop, ...loop];

  return (
    <MotionStagger className="mt-3 min-w-0 max-w-full" stagger={0.06}>
      <MotionStaggerItem className="marketing-full-bleed min-w-0">
        <div className="marketing-marquee-track py-0.5">
          <div
            className="marketing-marquee-fade-left bg-gradient-to-r from-[var(--marketing-page-bg)] via-[var(--marketing-page-bg)]/90 to-transparent"
            aria-hidden
          />
          <div
            className="marketing-marquee-fade-right bg-gradient-to-l from-[var(--marketing-page-bg-mid)] via-[var(--marketing-page-bg-mid)]/90 to-transparent"
            aria-hidden
          />
          <div className="hero-learning-chips-marquee flex w-max items-center gap-2.5 motion-reduce:animate-none sm:gap-3">
            {track.map(({ icon, label, key }, index) => (
              <LearningChip key={`${key}-${index}`} icon={icon} label={label} />
            ))}
          </div>
        </div>
      </MotionStaggerItem>
    </MotionStagger>
  );
}
