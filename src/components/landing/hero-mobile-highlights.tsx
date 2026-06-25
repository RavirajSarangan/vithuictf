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
        <ProofStatCard value={98} suffix="%" label={t("hero.passRate")} />
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
    <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-icvf-accent/35 bg-white/90 px-3.5 py-2 text-xs font-semibold text-icvf-navy shadow-sm">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-icvf-accent/15 text-icvf-accent">
        <Icon className="size-3.5" aria-hidden />
      </span>
      <span className="line-clamp-1 whitespace-nowrap">{label}</span>
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
  const loop = [...chipItems, ...chipItems];
  const marqueeTrack = [...loop, ...loop];

  return (
    <MotionStagger className="mt-3 min-w-0 max-w-full" stagger={0.06}>
      <MotionStaggerItem className="min-w-0 max-w-full">
        <div className="hero-learning-chips-track relative w-full max-w-full overflow-hidden pb-1">
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-[#fffdf8] to-transparent"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-[#fffdf8] to-transparent"
            aria-hidden
          />
          <div className="hero-learning-chips-marquee flex w-max gap-2 motion-reduce:animate-none">
            {marqueeTrack.map(({ icon, label, key }, index) => (
              <LearningChip key={`${key}-${index}`} icon={icon} label={label} />
            ))}
          </div>
        </div>
      </MotionStaggerItem>
    </MotionStagger>
  );
}
