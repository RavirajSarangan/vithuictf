"use client";

import { CheckCircle2, FileText, Globe, MapPin } from "lucide-react";
import Image from "next/image";
import { AnimatedCounter } from "@/components/magic-ui/animated-counter";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MarketingDarkPanel, MarketingSection, MarketingSectionIntro } from "@/components/landing/marketing-layout";
import { MotionStagger, MotionStaggerItem } from "@/components/shared/motion-section";
import { SriLankaCentersMap } from "@/components/landing/sri-lanka-centers-map";
import { useNetworkStats, usePaperCenters } from "@/hooks/use-data";
import { useMarketingText } from "@/hooks/use-marketing-text";

export function PaperCenterNetworkSection() {
  const stats = useNetworkStats();
  const centers = usePaperCenters();
  const { t, field } = useMarketingText();

  if (!stats) {
    return (
      <MarketingSection id="centers" tone="gradient">
        <div className="mx-auto max-w-7xl animate-pulse space-y-6 px-6">
          <div className="h-8 w-56 rounded-lg bg-white/10" />
          <div className="grid gap-5 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-48 rounded-2xl bg-white/10" />
            ))}
          </div>
        </div>
      </MarketingSection>
    );
  }

  const statItems = [
    { icon: Globe, value: stats.districtsCovered, suffix: "+", labelKey: "centers.districts" as const },
    { icon: CheckCircle2, value: stats.passRate, suffix: "%", labelKey: "centers.passRate" as const },
    { icon: FileText, value: stats.papersWritten, suffix: "+", labelKey: "centers.papersWritten" as const },
  ];

  const spotlightCenter = centers[0];

  return (
    <MarketingSection id="centers" tone="gradient">
      <MarketingSectionIntro
        badge={t("centers.badge")}
        badgeVariant="accent"
        title={field(stats, "headline")}
        subtitle={field(stats, "subheadline")}
        light
      />

      <MotionStagger className="grid gap-5 lg:grid-cols-12" stagger={0.08}>
        <MotionStaggerItem className="lg:col-span-4">
          <MarketingDarkPanel featured className="relative h-full">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/45">{t("centers.paperCenters")}</p>
            <p className="mt-6 text-5xl font-bold leading-none text-white sm:text-7xl md:text-8xl lg:text-9xl">
              <AnimatedCounter value={stats.paperCentersCount} suffix="+" />
            </p>
            <p className="mt-3 text-2xl font-semibold text-icvf-accent">{t("centers.acrossSriLanka")}</p>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/55">
              {field(stats, "subheadline")}
            </p>
            <p className="mt-8 text-right text-xs font-medium uppercase tracking-[0.16em] text-icvf-accent/90">
              {t("centers.realExam")}
            </p>
          </MarketingDarkPanel>
        </MotionStaggerItem>

        <MotionStaggerItem className="lg:col-span-4">
          <MarketingDarkPanel className="flex h-full flex-col">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/45">{t("centers.spotlightTitle")}</p>
            {spotlightCenter ? (
              <>
                <div className="mt-4 flex items-center gap-2 text-icvf-accent">
                  <MapPin className="size-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">{spotlightCenter.district}</span>
                </div>
                <h3 className="mt-2 text-xl font-semibold text-white">{spotlightCenter.name}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-white/55">{spotlightCenter.address}</p>
              </>
            ) : (
              <p className="mt-4 text-sm text-white/55">{t("centers.spotlightDesc")}</p>
            )}
          </MarketingDarkPanel>
        </MotionStaggerItem>

        <MotionStaggerItem className="lg:col-span-4">
          <MarketingDarkPanel
            featured
            className="relative flex h-full flex-col items-center justify-center overflow-hidden text-center"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(245,166,35,0.22),_transparent_70%)]" />
            <div className="relative mb-6 flex size-48 items-center justify-center rounded-3xl border border-white/10 ring-1 ring-white/5 transition-shadow hover:shadow-[0_0_40px_-10px_rgba(245,166,35,0.5)]">
              <Image
                src="/landing/sri-lanka-map.svg"
                alt="Sri Lanka map"
                width={160}
                height={160}
                className="h-auto w-36 object-contain opacity-95"
                style={{ filter: "drop-shadow(0 0 24px rgba(245,166,35,0.45))" }}
              />
            </div>
            <p className="relative text-lg font-semibold text-white">{field(stats, "headline")}</p>
            <Button
              nativeButton={false}
              render={<Link href={stats.ctaUrl} />}
              variant="icvf"
              className="relative mt-6"
            >
              {field(stats, "ctaLabel") || t("btn.viewCenters")}
            </Button>
          </MarketingDarkPanel>
        </MotionStaggerItem>
      </MotionStagger>

      <MotionStagger className="mt-6 grid gap-4 md:grid-cols-3" stagger={0.06}>
        {statItems.map((item) => (
          <MotionStaggerItem key={item.labelKey}>
            <MarketingDarkPanel className="flex items-center gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-icvf-accent/15">
                <item.icon className="size-5 text-icvf-accent" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-white">
                  <AnimatedCounter value={item.value} suffix={item.suffix} />
                </p>
                <p className="text-xs font-medium uppercase tracking-wider text-white/45">{t(item.labelKey)}</p>
              </div>
            </MarketingDarkPanel>
          </MotionStaggerItem>
        ))}
      </MotionStagger>

      <MotionStagger className="mt-8" stagger={0.1}>
        <MotionStaggerItem>
          <SriLankaCentersMap centers={centers} />
        </MotionStaggerItem>
      </MotionStagger>
    </MarketingSection>
  );
}
