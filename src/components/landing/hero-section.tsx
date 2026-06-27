"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { Globe, Monitor, Radio, Video } from "lucide-react";
import { HeroDecor } from "@/components/landing/hero-decor";
import { MarketingSessionActionsWithAuth } from "@/components/landing/marketing-session-actions-auth";
import { HeroIctFeatureCards, HeroIctTopicPills } from "@/components/landing/hero-ict-features";
import {
  HeroMobileLearningChips,
  HeroMobileProofStrip,
} from "@/components/landing/hero-mobile-highlights";
import { HeroFounderIslandMap } from "@/components/landing/hero-founder-island-map";
import { MarketingContainer } from "@/components/landing/marketing-layout";
import { scrollToMarketingSection } from "@/lib/marketing-scroll";
import { resultsHighlights } from "@/lib/data/results-content";
import { trustPills } from "@/lib/data/marketing-content";
import { useHomeAbout } from "@/hooks/use-data";
import { useMarketingText } from "@/hooks/use-marketing-text";
import { BRAND } from "@/lib/constants";
import { cn } from "@/lib/utils";

const HERO_FOUNDER_IMAGE = "/landing/hero-founder.webp";
const heroTrustIcons = [Video, Globe, Monitor, Radio] as const;

type ResultHighlight = (typeof resultsHighlights)[number];

function HeroTrustBar() {
  const { field } = useMarketingText();

  const items = trustPills.map((pill, i) => ({
    icon: heroTrustIcons[i % heroTrustIcons.length],
    label: field(pill, "label"),
  }));

  const loop = Array.from({ length: 4 }, () => items).flat();
  const track = [...loop, ...loop];

  return (
    <div className="hero-trust-bar w-full bg-[#0a1628] py-3.5 sm:py-4">
      <div className="marketing-marquee-track">
        <div
          className="marketing-marquee-fade-left bg-gradient-to-r from-[#0a1628] to-transparent"
          aria-hidden
        />
        <div
          className="marketing-marquee-fade-right bg-gradient-to-l from-[#0a1628] to-transparent"
          aria-hidden
        />
        <div className="hero-trust-marquee flex w-max items-center gap-5 whitespace-nowrap sm:gap-14 motion-reduce:animate-none">
          {track.map(({ icon: Icon, label }, i) => (
            <div key={`${label}-${i}`} className="flex shrink-0 items-center gap-2 sm:gap-2.5">
              <Icon className="size-4 shrink-0 text-icvf-accent/80 sm:text-icvf-accent/75" aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-white/70 sm:text-xs sm:tracking-[0.18em] sm:text-white/55">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HeroScrollIndicator({ pathname }: { pathname: string }) {
  const { t } = useMarketingText();

  const handleScroll = () => {
    if (pathname === "/" && scrollToMarketingSection("#results", "smooth")) {
      return;
    }
    window.scrollBy({ top: window.innerHeight * 0.72, behavior: "smooth" });
  };

  return (
    <button
      type="button"
      onClick={handleScroll}
      className="hero-scroll-indicator mt-5 hidden motion-reduce:opacity-100 lg:flex"
      aria-label={t("hero.scrollHint")}
    >
      <span className="hero-scroll-mouse" aria-hidden>
        <span className="hero-scroll-wheel" />
      </span>
    </button>
  );
}

function HeroFounderRankBanner({
  highlight,
  locale,
}: {
  highlight: ResultHighlight;
  locale: string;
}) {
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-icvf-accent/20 bg-gradient-to-r from-icvf-navy via-icvf-navy-dark to-[#0d2137] p-4 shadow-xl sm:max-w-[85%]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-icvf-accent">
            {locale === "ta" ? highlight.examYearTa : highlight.examYear} ·{" "}
            {locale === "ta" ? highlight.rankLabelTa : highlight.rankLabel}
          </p>
          <p className="mt-1 text-lg font-bold text-white sm:text-xl">{highlight.studentName}</p>
          <p className="text-sm text-white/65">
            {locale === "ta" ? highlight.schoolTa : highlight.school}
          </p>
        </div>
        <p className="text-3xl font-bold text-icvf-accent sm:text-4xl">#{highlight.rankNumber}</p>
      </div>
    </div>
  );
}

function HeroFounderPhoto({ className, src }: { className?: string; src: string }) {
  const isSvg = src.endsWith(".svg");
  const isRemote = src.startsWith("http");

  return (
    <div className={cn("hero-photo-wrap min-w-0 w-full max-w-full shrink-0", className)}>
      <div className="hero-photo-glow" aria-hidden />
      <div className="hero-photo-stage">
        <Image
          src={src}
          alt={`${BRAND.name} Founder`}
          width={1024}
          height={1536}
          priority
          fetchPriority="high"
          unoptimized={isSvg || isRemote}
          className="hero-photo"
          sizes="(max-width: 768px) 80vw, (max-width: 1024px) 50vw, 46vw"
        />
      </div>
    </div>
  );
}

export function HeroSection() {
  const { t, locale } = useMarketingText();
  const pathname = usePathname();
  const about = useHomeAbout();
  const topHighlight = resultsHighlights[0];
  const founderImage = about?.photoUrl || HERO_FOUNDER_IMAGE;

  return (
    <section
      id="home"
      className="hero-section relative flex min-h-0 flex-col overflow-x-clip lg:overflow-x-visible -mt-[var(--marketing-header-offset)] pt-[calc(var(--marketing-header-offset)+1rem)] sm:pt-[calc(var(--marketing-header-offset)+0.5rem)] max-lg:max-h-none lg:max-h-none"
    >
      <HeroDecor />

      <MarketingContainer className="hero-section-main relative z-10 flex w-full min-w-0 flex-1 flex-col min-h-0 overflow-x-visible pt-2 pb-0 sm:pt-6 lg:overflow-visible lg:pt-10 lg:pb-6">
        <div className="hero-section-grid flex w-full min-w-0 max-w-full flex-col gap-3 overflow-x-visible sm:gap-4 lg:grid lg:grid-cols-[1.02fr_0.98fr] lg:items-end lg:gap-14 lg:overflow-x-visible">
          <div className="hero-content-col relative order-1 min-w-0 w-full max-w-full shrink-0 overflow-x-visible lg:order-2 lg:overflow-x-clip">
            <p className="hero-enter hero-enter-1 hero-badge-pulse mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-icvf-navy/70 sm:mb-4 sm:text-xs sm:tracking-[0.2em]">
              <span
                className="size-1.5 shrink-0 rounded-full bg-icvf-accent motion-reduce:animate-none"
                aria-hidden
              />
              {t("hero.badge")}
            </p>

            <h1 className="hero-enter hero-enter-2 max-w-4xl font-bold">
              <span className="hero-sub-line">{t("hero.title")}</span>
              <span className="hero-accent-line">{t("hero.accent")}</span>
            </h1>

            <p className="hero-enter hero-enter-3 mt-3 max-w-full text-sm leading-relaxed break-words text-icvf-text-light sm:mt-4 sm:max-w-2xl sm:text-base md:text-lg lg:max-w-2xl">
              <span className="lg:hidden">{t("hero.subtitleMobile")}</span>
              <span className="hidden lg:inline">{t("hero.subtitle")}</span>
            </p>

            <div className="lg:hidden overflow-x-visible">
              <HeroMobileProofStrip />
              <HeroMobileLearningChips />
            </div>

            <MarketingSessionActionsWithAuth variant="hero" className="mt-5 lg:hidden" />

            <div className="hidden lg:block">
              <HeroIctTopicPills />
              <HeroIctFeatureCards />

              {topHighlight ? (
                <HeroFounderRankBanner highlight={topHighlight} locale={locale} />
              ) : null}

              <MarketingSessionActionsWithAuth variant="hero" />
              <HeroScrollIndicator pathname={pathname} />
            </div>
          </div>

          <div className="hero-founder-slot order-2 mt-2 w-full min-w-0 shrink-0 overflow-visible sm:mt-3 lg:order-1 lg:mt-0 lg:self-end lg:overflow-visible">
            <div className="hero-founder-stage">
              <HeroFounderIslandMap />
              <HeroFounderPhoto src={founderImage} />
            </div>
          </div>
        </div>
      </MarketingContainer>

      <div className="hero-trust-bar-wrap relative z-20 w-full shrink-0 lg:mt-5">
        <HeroTrustBar />
      </div>
    </section>
  );
}
