"use client";

import { ArrowRight, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CanvasEyebrow } from "@/components/canvas";
import { Button } from "@/components/ui/button";
import { MarketingContainer, MarketingSection } from "@/components/landing/marketing-layout";
import { MotionStagger, MotionStaggerItem } from "@/components/shared/motion-section";
import { useHomeAbout } from "@/hooks/use-data";
import { useMarketingText } from "@/hooks/use-marketing-text";
import { cn } from "@/lib/utils";

const FOUNDER_FALLBACK_IMAGE = "/landing/hero-founder.webp";

function splitCredentialPills(credentials: string): string[] {
  return credentials
    .split(/[·,]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function AboutFounderStat({
  value,
  label,
  accentValue = false,
}: {
  value: React.ReactNode;
  label: string;
  accentValue?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-icvf-border/70 bg-white px-3 py-4 text-center shadow-sm sm:px-4 sm:py-5">
      <p
        className={cn(
          "text-2xl font-bold sm:text-[1.75rem]",
          accentValue ? "text-emerald-600" : "text-icvf-navy"
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-icvf-text-light">
        {label}
      </p>
    </div>
  );
}

export function AboutFounderSection() {
  const about = useHomeAbout();
  const { t, field } = useMarketingText();

  if (!about) {
    return (
      <MarketingSection id="founder" tone="light">
        <div className="animate-pulse space-y-8">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="aspect-[3/4] rounded-3xl bg-icvf-surface" />
            <div className="space-y-4 rounded-3xl bg-icvf-surface/60 p-8">
              <div className="h-4 w-32 rounded bg-icvf-surface" />
              <div className="h-10 w-3/4 rounded bg-icvf-surface" />
              <div className="h-4 w-full rounded bg-icvf-surface" />
              <div className="h-4 w-5/6 rounded bg-icvf-surface" />
            </div>
          </div>
        </div>
      </MarketingSection>
    );
  }

  const founderImage = about.photoUrl || FOUNDER_FALLBACK_IMAGE;
  const isSvgImage = founderImage.endsWith(".svg");
  const isRemoteImage = founderImage.startsWith("http");
  const credentialPills = splitCredentialPills(about.credentials);

  return (
    <MarketingSection id="founder" tone="light" className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-50/70 via-white to-icvf-surface/40"
      />

      <MarketingContainer className="relative">
        <MotionStagger className="grid items-stretch gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16" stagger={0.1}>
          <MotionStaggerItem>
            <div className="relative mx-auto w-full max-w-lg overflow-hidden rounded-3xl bg-[#fffdf8] shadow-[0_24px_80px_-24px_rgba(39,52,97,0.35)] lg:max-w-none">
              <div className="relative w-full">
                <Image
                  src={founderImage}
                  alt={about.name}
                  width={960}
                  height={1280}
                  unoptimized={isSvgImage || isRemoteImage}
                  className="block h-auto w-full object-contain object-center"
                  sizes="(max-width: 1024px) 90vw, 46vw"
                />

                <div className="absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-white/95 px-3 py-1.5 shadow-md backdrop-blur-sm">
                  <Star className="size-3.5 fill-emerald-500 text-emerald-500" aria-hidden />
                  <span className="text-xs font-semibold text-emerald-700">{field(about, "title")}</span>
                </div>

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent px-5 pb-5 pt-16 sm:px-6 sm:pb-6">
                  <p className="text-xl font-bold text-white sm:text-2xl">{about.name}</p>
                  {credentialPills.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {credentialPills.map((pill) => (
                        <span
                          key={pill}
                          className="rounded-full border border-white/15 bg-black/35 px-3 py-1 text-[11px] font-medium text-white/90 backdrop-blur-sm"
                        >
                          {pill}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </MotionStaggerItem>

          <MotionStaggerItem className="flex">
            <div className="flex w-full flex-col rounded-3xl border border-emerald-100/80 bg-gradient-to-br from-[#eef8f4] via-white to-white p-6 shadow-sm sm:p-8 lg:p-10">
              <CanvasEyebrow variant="accent" className="mb-5 w-fit">
                {t("about.badge")}
              </CanvasEyebrow>

              <h2 className="max-w-xl bg-gradient-to-b from-icvf-navy via-icvf-navy to-emerald-600 bg-clip-text text-3xl font-bold leading-tight tracking-tight text-transparent sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
                {t("about.title")}
              </h2>

              <div className="mt-4 h-1 w-14 rounded-full bg-gradient-to-r from-emerald-500 to-icvf-accent" />

              <p className="mt-2 text-sm font-medium text-icvf-text-light">{t("about.subtitle")}</p>

              <p className="mt-6 text-base leading-relaxed text-icvf-text-light sm:text-lg">
                {field(about, "bio")}
              </p>

              <div className="mt-6 rounded-r-2xl border-l-4 border-emerald-500/80 bg-emerald-50/70 px-4 py-4 sm:px-5">
                <p className="text-sm leading-relaxed text-icvf-navy/80 sm:text-base">{about.credentials}</p>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <AboutFounderStat
                  value={`${about.highlightStudents.toLocaleString()}+`}
                  label={t("about.studentsGuided")}
                  accentValue
                />
                <AboutFounderStat value={t("about.islandFirst")} label={t("about.resultsProduced")} />
                <AboutFounderStat
                  value={`${about.highlightExperienceYears}+`}
                  label={t("about.yearsAt")}
                />
              </div>

              <Button
                nativeButton={false}
                render={
                  <Link href={about.ctaUrl} className="group mt-8 w-fit gap-2">
                    {about.ctaLabel}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </Link>
                }
                variant="icvf"
                size="lg"
              />
            </div>
          </MotionStaggerItem>
        </MotionStagger>
      </MarketingContainer>
    </MarketingSection>
  );
}
