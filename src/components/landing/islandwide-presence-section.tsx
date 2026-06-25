"use client";

import { MapPin, Monitor, Network, Video } from "lucide-react";
import {
  MarketingNumberedCard,
  MarketingSection,
  MarketingSectionIntro,
} from "@/components/landing/marketing-layout";
import { MotionStagger, MotionStaggerItem } from "@/components/shared/motion-section";
import { trustPills } from "@/lib/data/marketing-content";
import { useMarketingText } from "@/hooks/use-marketing-text";

const presenceIcons = [Video, Monitor, Network, MapPin] as const;

const presenceDescKeys = ["join.step1Desc", "join.step2Desc", "join.step3Desc", "join.step2Desc"] as const;

export function IslandwidePresenceSection() {
  const { t, field } = useMarketingText();

  return (
    <MarketingSection id="presence" tone="light">
      <MarketingSectionIntro
        badge={t("companies.badge")}
        title={t("companies.title")}
        subtitle={t("companies.subtitle")}
        badgeVariant="accent"
        light={false}
      />

      <MotionStagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" stagger={0.06}>
        {trustPills.map((pill, i) => {
          const Icon = presenceIcons[i % presenceIcons.length];
          return (
            <MotionStaggerItem key={pill.label}>
              <MarketingNumberedCard
                index={i + 1}
                icon={Icon}
                title={field(pill, "label")}
                description={t(presenceDescKeys[i % presenceDescKeys.length])}
              />
            </MotionStaggerItem>
          );
        })}
      </MotionStagger>
    </MarketingSection>
  );
}
