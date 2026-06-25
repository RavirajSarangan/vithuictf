"use client";

import type { LucideIcon } from "lucide-react";
import { Bot, FileText, Monitor, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MarketingUiKey } from "@/lib/i18n/marketing-ui";
import { useMarketingText } from "@/hooks/use-marketing-text";

const topicKeys = [
  "platform.topicProgramming",
  "platform.topicDatabases",
  "platform.topicNetworking",
  "hero.topicWebDev",
] as const satisfies readonly MarketingUiKey[];

const featureCards: {
  icon: LucideIcon;
  titleKey: MarketingUiKey;
  descKey: MarketingUiKey;
  variant: "light" | "gold" | "navy";
}[] = [
  { icon: Video, titleKey: "hero.liveZoom", descKey: "platform.liveClassesDesc", variant: "gold" },
  { icon: Monitor, titleKey: "hero.lmsPortal", descKey: "platform.subtitle", variant: "light" },
  { icon: Bot, titleKey: "platform.aiTutor", descKey: "platform.aiTutorDesc", variant: "navy" },
  { icon: FileText, titleKey: "centers.paperCenters", descKey: "centers.realExam", variant: "light" },
];

const cardStyles = {
  light: "border-white/70 bg-gradient-to-br from-[#e8f0ff] to-[#f4f8ff] shadow-lg shadow-icvf-navy/5",
  gold: "border-icvf-accent/25 bg-gradient-to-br from-[#fff4dc] to-[#ffeec2] shadow-lg shadow-icvf-accent/10",
  navy: "border-white/10 bg-gradient-to-br from-icvf-navy to-icvf-navy-dark text-white shadow-lg shadow-icvf-navy/20",
};

const iconStyles = {
  light: "bg-icvf-navy/10 text-icvf-navy",
  gold: "bg-icvf-accent/20 text-icvf-accent",
  navy: "bg-white/15 text-icvf-accent",
};

export function HeroIctTopicPills() {
  const { t } = useMarketingText();

  return (
    <div className="mt-5 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] md:flex-wrap md:overflow-visible [&::-webkit-scrollbar]:hidden">
      {topicKeys.map((key) => (
        <span
          key={key}
          className="shrink-0 rounded-full border border-icvf-accent/35 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-icvf-navy sm:text-sm"
        >
          {t(key)}
        </span>
      ))}
    </div>
  );
}

export function HeroIctFeatureCards() {
  const { t } = useMarketingText();

  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {featureCards.map(({ icon: Icon, titleKey, descKey, variant }) => (
        <div key={titleKey} className={cn("rounded-2xl border p-4", cardStyles[variant])}>
          <div
            className={cn(
              "mb-3 flex size-10 items-center justify-center rounded-xl",
              iconStyles[variant]
            )}
          >
            <Icon className="size-5" />
          </div>
          <p
            className={cn(
              "text-sm font-bold leading-snug",
              variant === "navy" ? "text-white" : "text-icvf-navy"
            )}
          >
            {t(titleKey)}
          </p>
          <p
            className={cn(
              "mt-1.5 line-clamp-2 text-[11px] leading-relaxed sm:text-xs",
              variant === "navy" ? "text-white/65" : "text-icvf-text-light"
            )}
          >
            {t(descKey)}
          </p>
        </div>
      ))}
    </div>
  );
}
