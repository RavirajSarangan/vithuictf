"use client";

import { BrandLogo } from "@/components/shared/brand-logo";
import { GlassCard } from "@/components/shared/glass-card";
import { CanvasEyebrow } from "@/components/canvas";
import { MarketingContainer, MarketingSection } from "@/components/landing/marketing-layout";
import { MotionStagger, MotionStaggerItem } from "@/components/shared/motion-section";
import { instituteAbout } from "@/lib/data/marketing-content";
import { BRAND } from "@/lib/constants";
import { useMarketingText } from "@/hooks/use-marketing-text";

export function AboutInstituteSection() {
  const { field } = useMarketingText();

  return (
    <MarketingSection id="about" tone="surface">
      <MarketingContainer>
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <BrandLogo size="lg" className="mx-auto" />
          <CanvasEyebrow variant="accent" className="mt-6">
            {BRAND.name}
          </CanvasEyebrow>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-icvf-navy sm:text-4xl">
            {field(instituteAbout, "title")}
          </h2>
          <p className="mt-3 text-base text-icvf-text-light sm:text-lg">{field(instituteAbout, "subtitle")}</p>
        </div>

        <MotionStagger className="mt-12 grid gap-10 lg:grid-cols-2 lg:items-start" stagger={0.08}>
          <MotionStaggerItem className="space-y-5">
            <p className="text-lg leading-relaxed text-icvf-text-light">{field(instituteAbout, "intro")}</p>
            <p className="rounded-2xl border border-icvf-border bg-white p-5 text-sm leading-relaxed text-icvf-text-light">
              {instituteAbout.note}
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "Mission", text: instituteAbout.mission },
                { label: "Vision", text: instituteAbout.vision },
                { label: "Philosophy", text: instituteAbout.philosophy },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-icvf-border bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-icvf-accent">{item.label}</p>
                  <p className="mt-2 text-sm text-icvf-text-light">{item.text}</p>
                </div>
              ))}
            </div>
          </MotionStaggerItem>

          <MotionStaggerItem className="grid gap-4">
            {instituteAbout.pillars.map((pillar) => (
              <GlassCard key={pillar.title} className="bg-white">
                <h3 className="text-lg font-bold text-icvf-text-dark">{field(pillar, "title")}</h3>
                <p className="mt-3 text-sm text-icvf-text-light">{pillar.description}</p>
              </GlassCard>
            ))}
          </MotionStaggerItem>
        </MotionStagger>
      </MarketingContainer>
    </MarketingSection>
  );
}
