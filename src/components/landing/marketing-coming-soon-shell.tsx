"use client";

import {
  BookOpen,
  CircleHelp,
  MapPin,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { MarketingContainer } from "@/components/landing/marketing-layout";
import { useMarketingText } from "@/hooks/use-marketing-text";
import { cn } from "@/lib/utils";

type SectionKey =
  | "programs"
  | "results"
  | "centers"
  | "faq";

const SECTION_CONFIG: ReadonlyArray<{
  key: SectionKey;
  labelKey:
    | "marketing.comingSoon.chipPrograms"
    | "marketing.comingSoon.chipResults"
    | "marketing.comingSoon.chipCenters"
    | "marketing.comingSoon.chipFaq";
  icon: LucideIcon;
}> = [
  { key: "programs", labelKey: "marketing.comingSoon.chipPrograms", icon: BookOpen },
  { key: "results", labelKey: "marketing.comingSoon.chipResults", icon: Trophy },
  { key: "centers", labelKey: "marketing.comingSoon.chipCenters", icon: MapPin },
  { key: "faq", labelKey: "marketing.comingSoon.chipFaq", icon: CircleHelp },
];

function LiveStatusBadge() {
  const { t } = useMarketingText();

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-icvf-border bg-white/90 px-2.5 py-1 text-[0.6875rem] font-semibold tracking-wide text-icvf-navy shadow-sm sm:gap-2 sm:px-3 sm:py-1.5 sm:text-[0.8125rem]">
      <span
        className="coming-soon-live-dot size-2 shrink-0 rounded-full bg-icvf-accent motion-reduce:opacity-90"
        aria-hidden
      />
      {t("marketing.comingSoon.statusBadge")}
    </div>
  );
}

function AnimatedTitle({ id }: { id: string }) {
  const { t } = useMarketingText();
  const reduceMotion = useReducedMotion();

  const lead = t("marketing.comingSoon.titleLead");
  const accent = t("marketing.comingSoon.titleAccent");

  if (reduceMotion) {
    return (
      <h2 id={id} className="text-xl font-bold tracking-tight text-icvf-navy sm:text-[2rem]">
        {lead} {accent}
      </h2>
    );
  }

  return (
    <motion.h2
      id={id}
      className="text-xl font-bold tracking-tight text-icvf-navy sm:text-[2rem]"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.8 }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.12, delayChildren: 0.04 } },
      }}
    >
      <motion.span
        className="text-icvf-navy"
        variants={{
          hidden: { opacity: 0, y: 12, filter: "blur(5px)" },
          visible: {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
          },
        }}
      >
        {lead}
      </motion.span>{" "}
      <motion.span
        className="coming-soon-accent-text text-icvf-accent"
        variants={{
          hidden: { opacity: 0, y: 12, scale: 0.9 },
          visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
          },
        }}
      >
        {accent}
      </motion.span>
    </motion.h2>
  );
}

function BuildProgressTrack({ activeIndex }: { activeIndex: number }) {
  return (
    <div
      className="flex w-full gap-1.5 sm:gap-2"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={SECTION_CONFIG.length}
      aria-valuenow={activeIndex + 1}
      aria-label="Site section build progress"
    >
      {SECTION_CONFIG.map((section, index) => {
        const isActive = index === activeIndex;
        const isComplete = index < activeIndex;

        return (
          <div
            key={section.key}
            className="h-1.5 flex-1 overflow-hidden rounded-full bg-icvf-navy/8 sm:h-2"
          >
            <motion.div
              className={cn(
                "h-full rounded-full",
                isActive
                  ? "coming-soon-segment-shimmer bg-icvf-accent motion-reduce:bg-icvf-accent"
                  : isComplete
                    ? "bg-icvf-accent/70"
                    : "bg-transparent"
              )}
              initial={false}
              animate={{
                width: isActive || isComplete ? "100%" : "0%",
                opacity: isActive ? 1 : isComplete ? 0.75 : 0,
              }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        );
      })}
    </div>
  );
}

function OngoingSectionCard({
  label,
  icon: Icon,
  active,
  delay,
}: {
  label: string;
  icon: LucideIcon;
  active: boolean;
  delay: number;
}) {
  const { t } = useMarketingText();
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={cn(
        "flex min-w-0 flex-1 items-center gap-2 rounded-xl border px-2.5 py-2 transition-colors sm:min-w-[10.5rem] sm:gap-2.5 sm:rounded-2xl sm:px-3.5 sm:py-2.5",
        active
          ? "border-icvf-accent/35 bg-gradient-to-br from-white to-icvf-accent/8 shadow-sm"
          : "border-icvf-border/80 bg-white/80"
      )}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-lg border sm:size-8 sm:rounded-xl",
          active
            ? "border-icvf-accent/25 bg-icvf-accent/12 text-icvf-navy"
            : "border-icvf-border bg-icvf-navy/5 text-icvf-navy/70"
        )}
      >
        <Icon className="size-3.5 sm:size-4" strokeWidth={1.75} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.6875rem] font-semibold leading-tight text-icvf-navy sm:text-[0.8125rem]">
          {label}
        </span>
        <span className="mt-0.5 inline-flex items-center gap-1 text-[0.625rem] font-medium text-icvf-text-light sm:text-[0.6875rem]">
          <span
            className={cn(
              "size-1.5 rounded-full",
              active ? "coming-soon-live-dot bg-icvf-accent" : "bg-icvf-navy/25"
            )}
            aria-hidden
          />
          {t("marketing.comingSoon.sectionStatus")}
        </span>
      </span>
    </motion.div>
  );
}

function OngoingSectionsGrid({ activeIndex }: { activeIndex: number }) {
  const { t } = useMarketingText();

  return (
    <div className="grid w-full grid-cols-2 gap-1.5 sm:grid-cols-2 sm:gap-2 lg:grid-cols-3">
      {SECTION_CONFIG.map((section, index) => (
        <OngoingSectionCard
          key={section.key}
          label={t(section.labelKey)}
          icon={section.icon}
          active={index === activeIndex}
          delay={index * 0.05}
        />
      ))}
    </div>
  );
}

function FocusCaption({ activeIndex }: { activeIndex: number }) {
  const { t } = useMarketingText();
  const reduceMotion = useReducedMotion();
  const section = SECTION_CONFIG[activeIndex];
  const label = section ? t(section.labelKey) : "";

  return (
    <p className="flex flex-wrap items-center justify-center gap-x-1 text-xs leading-5 text-icvf-text-light sm:gap-x-1.5 sm:text-[0.9375rem] sm:leading-6">
      <span className="shrink-0">{t("marketing.comingSoon.focusLabel")}</span>
      <span
        className="relative inline-block h-5 min-w-[8.5rem] overflow-hidden align-bottom sm:min-w-[12.5rem] sm:h-6"
        aria-live="polite"
        aria-atomic="true"
      >
        {reduceMotion ? (
          <span className="block whitespace-nowrap font-semibold leading-5 text-icvf-navy sm:leading-6">
            {label}
          </span>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={label}
              className="block h-5 whitespace-nowrap font-semibold leading-5 text-icvf-navy sm:h-6 sm:leading-6"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            >
              {label}
            </motion.span>
          </AnimatePresence>
        )}
      </span>
    </p>
  );
}

export function MarketingComingSoonShell() {
  const { t } = useMarketingText();
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);

  const sectionCount = SECTION_CONFIG.length;

  useEffect(() => {
    if (reduceMotion || sectionCount <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % sectionCount);
    }, 2800);
    return () => window.clearInterval(timer);
  }, [reduceMotion, sectionCount]);

  const ariaSection = SECTION_CONFIG[activeIndex];
  const ariaLabel = ariaSection
    ? `${t("marketing.comingSoon.titleLead")} ${t("marketing.comingSoon.titleAccent")}. ${t("marketing.comingSoon.statusBadge")}. ${t("marketing.comingSoon.focusLabel")} ${t(ariaSection.labelKey)}`
    : `${t("marketing.comingSoon.titleLead")} ${t("marketing.comingSoon.titleAccent")}`;

  return (
    <section
      className="relative scroll-mt-20 py-4 sm:py-8 lg:py-10"
      aria-labelledby="marketing-coming-soon-title"
    >
      <MarketingContainer>
        <motion.div
          className="relative mx-auto w-full max-w-3xl"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            className="coming-soon-hub relative overflow-hidden rounded-2xl border border-icvf-border bg-white/95 px-3.5 py-4 shadow-sm sm:rounded-3xl sm:px-8 sm:py-8"
            role="status"
            aria-live="polite"
            aria-label={ariaLabel}
          >
            <div
              className="coming-soon-panel-glow pointer-events-none absolute inset-x-0 top-0 h-20 motion-reduce:hidden sm:h-36"
              aria-hidden
            />

            <div className="relative z-10 flex flex-col items-center gap-3 sm:gap-5">
              <LiveStatusBadge />
              <AnimatedTitle id="marketing-coming-soon-title" />

              <p className="max-w-lg text-center text-xs leading-snug text-icvf-text-light sm:text-[0.9375rem] sm:leading-relaxed">
                {t("marketing.comingSoon.subtitle")}
              </p>

              <div className="w-full space-y-2 sm:space-y-3.5">
                <BuildProgressTrack activeIndex={activeIndex} />
                <OngoingSectionsGrid activeIndex={activeIndex} />
              </div>

              <FocusCaption activeIndex={activeIndex} />
            </div>
          </div>
        </motion.div>
      </MarketingContainer>
    </section>
  );
}
