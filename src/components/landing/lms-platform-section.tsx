"use client";

import {
  BarChart3,
  Bot,
  Download,
  PlayCircle,
  Radio,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  MarketingCtaActions,
  MarketingCtaBand,
  MarketingDarkTile,
  MarketingFeatureGrid,
  MarketingPanel,
  MarketingSection,
  MarketingSectionIntro,
  MarketingStatHero,
} from "@/components/landing/marketing-layout";
import { MotionStagger, MotionStaggerItem } from "@/components/shared/motion-section";
import { BRAND } from "@/lib/constants";
import { useMarketingText } from "@/hooks/use-marketing-text";

const features = [
  { icon: PlayCircle, titleKey: "platform.videoLibrary", descKey: "platform.videoLibraryDesc" },
  { icon: Radio, titleKey: "platform.liveClasses", descKey: "platform.liveClassesDesc" },
  { icon: Trophy, titleKey: "platform.leaderboard", descKey: "platform.leaderboardDesc" },
  { icon: Download, titleKey: "platform.studyMaterials", descKey: "platform.studyMaterialsDesc" },
] as const;

export function LmsPlatformSection() {
  const { t } = useMarketingText();

  const progressTopics = [
    { topic: t("platform.topicProgramming"), pct: 88 },
    { topic: t("platform.topicDatabases"), pct: 72 },
    { topic: t("platform.topicNetworking"), pct: 59 },
  ];

  const featureItems = features.map((f) => ({
    icon: f.icon,
    title: t(f.titleKey),
    description: t(f.descKey),
  }));

  return (
    <MarketingSection id="platform" tone="surface">
      <MarketingSectionIntro
        badge={t("platform.badge")}
        title={t("platform.title")}
        subtitle={t("platform.subtitle")}
        badgeVariant="accent"
        light={false}
      />

      <MotionStagger className="grid gap-8 lg:grid-cols-2" stagger={0.1}>
        <MotionStaggerItem>
          <MarketingPanel featured className="h-full">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-white/15">
                <Bot className="size-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{t("platform.aiTutor")}</h3>
                <p className="text-sm text-icvf-accent">{BRAND.name} · 24/7</p>
              </div>
            </div>
            <p className="mt-4 text-white/75">{t("platform.aiTutorDesc")}</p>
            <MarketingDarkTile className="mt-6 bg-black/20 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-icvf-accent">{BRAND.name} AI Assistant</p>
              <p className="mt-3 text-sm leading-relaxed text-white/90">{t("platform.aiTutorDesc")}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["ICT", "A/L", "Revision"].map((tag) => (
                  <span key={tag} className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/80">
                    {tag}
                  </span>
                ))}
              </div>
            </MarketingDarkTile>
            <Button nativeButton={false} render={<Link href="/login" />} variant="icvf" className="mt-6 w-full sm:w-auto">
              {t("btn.login")}
            </Button>
          </MarketingPanel>
        </MotionStaggerItem>

        <MotionStaggerItem>
          <MarketingPanel className="h-full">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-icvf-accent/15">
                <BarChart3 className="size-6 text-icvf-accent" />
              </div>
              <h3 className="text-xl font-bold text-icvf-navy">{t("platform.progressTracking")}</h3>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <MarketingStatHero value="92%" label={t("platform.latestScore")} className="py-4" />
              <MarketingStatHero value="#3" label={t("platform.batchRank")} className="py-4" />
              <MarketingStatHero value="14" label={t("platform.papersDone")} className="py-4" />
            </div>
            <div className="mt-6 space-y-4">
              {progressTopics.map((topic) => (
                <div key={topic.topic}>
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span className="font-medium text-icvf-navy">{topic.topic}</span>
                    <span className="font-bold text-icvf-accent">{topic.pct}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-icvf-border">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-icvf-navy to-icvf-accent"
                      style={{ width: `${topic.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </MarketingPanel>
        </MotionStaggerItem>
      </MotionStagger>

      <div className="mt-10">
        <MarketingFeatureGrid items={featureItems} />
      </div>

      <MarketingCtaBand className="mt-10">
        <MarketingCtaActions registerLabel={t("btn.register")} loginLabel={t("btn.login")} />
      </MarketingCtaBand>
    </MarketingSection>
  );
}
