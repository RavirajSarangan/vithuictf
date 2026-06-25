"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Globe, Monitor, Radio, Video } from "lucide-react";
import { ButtonLink } from "@/components/shared/button-link";
import { HeroDecor } from "@/components/landing/hero-decor";
import { HeroIctFeatureCards, HeroIctTopicPills } from "@/components/landing/hero-ict-features";
import {
  HeroMobileLearningChips,
  HeroMobileProofStrip,
} from "@/components/landing/hero-mobile-highlights";
import { MarketingContainer } from "@/components/landing/marketing-layout";
import {
  getMarketingSectionHref,
  handleMarketingSectionClick,
  scrollToMarketingSection,
} from "@/lib/marketing-scroll";
import { resultsHighlights } from "@/lib/data/results-content";
import { trustPills } from "@/lib/data/marketing-content";
import { useHomeAbout } from "@/hooks/use-data";
import { useMarketingText } from "@/hooks/use-marketing-text";
import { BRAND } from "@/lib/constants";
import { cn } from "@/lib/utils";

const HERO_FOUNDER_IMAGE = "/landing/vithoo.svg";
const heroTrustIcons = [Video, Globe, Monitor, Radio] as const;

const heroCtaClass =
  "inline-flex h-12 w-full min-w-0 items-center justify-center gap-2 rounded-full px-3 text-xs font-semibold sm:h-14 sm:px-5 sm:text-sm lg:min-w-[11.25rem] lg:w-auto lg:px-7";

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
      <div className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[#0a1628] to-transparent sm:w-14"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[#0a1628] to-transparent sm:w-14"
          aria-hidden
        />
        <div className="hero-trust-marquee flex w-max gap-10 whitespace-nowrap px-6 sm:gap-14 sm:px-10 motion-reduce:animate-none">
          {track.map(({ icon: Icon, label }, i) => (
            <div key={`${label}-${i}`} className="flex shrink-0 items-center gap-2.5">
              <Icon className="size-4 text-white/55" aria-hidden />
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45 sm:text-xs">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
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

function HeroScrollIndicator({ pathname }: { pathname: string }) {
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
      className="hero-scroll-indicator mt-5 flex motion-reduce:opacity-100"
      aria-label="Scroll to explore"
    >
      <span className="hero-scroll-mouse" aria-hidden>
        <span className="hero-scroll-wheel" />
      </span>
    </button>
  );
}

function HeroMobileCtaButtons({ pathname }: { pathname: string }) {
  const { t } = useMarketingText();

  return (
    <div className="mt-5 w-full min-w-0 lg:hidden">
      <div className="grid w-full grid-cols-2 gap-3">
        <ButtonLink
          href="/register"
          variant="icvf"
          className={cn(
            heroCtaClass,
            "relative z-10 !text-icvf-navy-dark shadow-sm"
          )}
        >
          <span className="truncate">{t("btn.register")}</span>
        </ButtonLink>
        <ButtonLink
          href="/login"
          className={cn(heroCtaClass, "hero-glass-btn relative z-10 h-12 text-icvf-navy sm:h-14")}
        >
          <span className="truncate">{t("btn.login")}</span>
        </ButtonLink>
      </div>
      <Link
        href={getMarketingSectionHref("#programs", pathname)}
        onClick={(event) => handleMarketingSectionClick(event, "#programs", pathname)}
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-icvf-navy transition-colors hover:text-icvf-accent"
      >
        {t("btn.viewPrograms")}
        <ArrowRight className="size-4 shrink-0" aria-hidden />
      </Link>
    </div>
  );
}

function HeroDesktopCtaButtons({ pathname }: { pathname: string }) {
  const { t } = useMarketingText();

  return (
    <div className="mt-8 hidden lg:block">
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
        <ButtonLink
          href="/register"
          variant="icvf"
          className={cn(heroCtaClass, "h-14 shrink-0 px-5 text-sm shadow-lg shadow-icvf-accent/15 sm:px-7")}
        >
          {t("btn.register")}
          <ArrowRight className="size-4" aria-hidden />
        </ButtonLink>
        <ButtonLink
          href="/login"
          className={cn(
            heroCtaClass,
            "h-14 shrink-0 border border-icvf-navy/15 bg-white px-5 text-sm text-icvf-navy shadow-sm hover:bg-icvf-surface sm:px-7"
          )}
        >
          {t("btn.login")}
        </ButtonLink>
        <ButtonLink
          href={getMarketingSectionHref("#programs", pathname)}
          variant="icvf-outline-navy"
          className={cn(heroCtaClass, "h-14 shrink-0 px-5 text-sm sm:px-7")}
          onClick={(event) => handleMarketingSectionClick(event, "#programs", pathname)}
        >
          {t("btn.viewPrograms")}
        </ButtonLink>
      </div>
      <HeroScrollIndicator pathname={pathname} />
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
          sizes="(max-width: 768px) 78vw, (max-width: 1024px) 46vw, 42vw"
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
      className="hero-section relative -mt-[var(--marketing-header-offset)] flex min-h-[100dvh] max-h-[100dvh] flex-col overflow-hidden px-4 pt-[var(--marketing-header-offset)] md:px-8 lg:max-h-none lg:overflow-x-clip"
    >
      <HeroDecor />

      <MarketingContainer className="hero-section-main relative z-10 flex w-full min-w-0 flex-1 flex-col min-h-0 overflow-y-auto overflow-x-clip pt-2 pb-0 sm:pt-6 lg:overflow-visible lg:pt-10">
        <div className="hero-section-grid flex w-full min-w-0 max-w-full flex-col gap-3 overflow-x-clip sm:gap-4 lg:grid lg:grid-cols-[0.92fr_1.08fr] lg:items-end lg:gap-14">
          <div className="hero-content-col relative order-1 min-w-0 w-full max-w-full shrink-0 overflow-x-clip lg:order-2">
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

            <div className="lg:hidden">
              <HeroMobileProofStrip />
              <HeroMobileLearningChips />
            </div>

            <HeroMobileCtaButtons pathname={pathname} />

            <div className="hidden lg:block">
              <HeroIctTopicPills />
              <HeroIctFeatureCards />

              {topHighlight ? (
                <HeroFounderRankBanner highlight={topHighlight} locale={locale} />
              ) : null}
            </div>

            <HeroDesktopCtaButtons pathname={pathname} />
          </div>

          <div className="hero-founder-slot order-2 mt-auto w-full min-w-0 shrink-0 lg:order-1 lg:mt-0 lg:self-end">
            <HeroFounderPhoto src={founderImage} />
          </div>
        </div>
      </MarketingContainer>

      <div className="hero-trust-bar-wrap relative z-20 shrink-0 -mx-4 w-[calc(100%+2rem)] md:-mx-8 md:w-[calc(100%+4rem)]">
        <HeroTrustBar />
      </div>
    </section>
  );
}
