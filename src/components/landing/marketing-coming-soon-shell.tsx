"use client";

import { Clock } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { MarketingContainer } from "@/components/landing/marketing-layout";
import { useMarketingText } from "@/hooks/use-marketing-text";
import { cn } from "@/lib/utils";

const ORBIT_DOTS = [
  { angle: 0, size: 4 },
  { angle: 72, size: 3.5 },
  { angle: 144, size: 4 },
  { angle: 216, size: 3.5 },
  { angle: 288, size: 4 },
] as const;

function OrbitClock() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative flex size-[6.75rem] items-center justify-center sm:size-[7.75rem]">
      <span
        className="coming-soon-pulse-ring pointer-events-none absolute inset-0 rounded-full border border-icvf-accent/25 motion-reduce:hidden"
        aria-hidden
      />
      <span
        className="coming-soon-pulse-ring coming-soon-pulse-ring-delay pointer-events-none absolute inset-3 rounded-full border border-icvf-navy/10 motion-reduce:hidden"
        aria-hidden
      />

      <svg viewBox="0 0 120 120" className="absolute inset-0 size-full" aria-hidden>
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke="rgba(39, 52, 97, 0.14)"
          strokeWidth="1.5"
          strokeDasharray="5 7"
          className="coming-soon-orbit-dash motion-reduce:animate-none"
        />
        <circle
          cx="60"
          cy="60"
          r="44"
          fill="none"
          stroke="rgba(245, 166, 35, 0.2)"
          strokeWidth="1"
          strokeDasharray="2 8"
          className={cn(
            "motion-reduce:animate-none",
            !reduceMotion && "coming-soon-orbit-spin-reverse"
          )}
        />
        <g className={cn(!reduceMotion && "coming-soon-orbit-spin")}>
          {ORBIT_DOTS.map((dot) => (
            <circle
              key={dot.angle}
              cx={60 + 54 * Math.cos((dot.angle * Math.PI) / 180)}
              cy={60 + 54 * Math.sin((dot.angle * Math.PI) / 180)}
              r={dot.size}
              fill="rgba(245, 166, 35, 0.85)"
              className="coming-soon-orbit-dot motion-reduce:opacity-80"
            />
          ))}
        </g>
      </svg>

      <motion.div
        className="relative z-10 flex size-14 items-center justify-center rounded-2xl border border-icvf-border bg-white shadow-md sm:size-[3.75rem]"
        animate={reduceMotion ? undefined : { y: [0, -6, 0], scale: [1, 1.03, 1] }}
        transition={
          reduceMotion
            ? undefined
            : { duration: 2.8, repeat: Infinity, ease: "easeInOut" }
        }
      >
        <span
          className="coming-soon-icon-ring pointer-events-none absolute -inset-2 rounded-2xl border-2 border-icvf-accent/25 motion-reduce:animate-none"
          aria-hidden
        />
        <Clock className="size-7 text-icvf-navy/80 sm:size-8" strokeWidth={1.75} aria-hidden />
      </motion.div>
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
      <h2 id={id} className="relative z-10 text-2xl font-bold tracking-tight text-icvf-navy sm:text-3xl">
        {lead} <span className="text-icvf-accent">{accent}</span>
      </h2>
    );
  }

  return (
    <motion.h2
      id={id}
      className="relative z-10 flex flex-wrap items-center justify-center gap-x-2.5 text-2xl font-bold tracking-tight sm:text-[2rem] md:text-[2.15rem]"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.8 }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.14, delayChildren: 0.04 } },
      }}
    >
      <motion.span
        className="text-icvf-navy"
        variants={{
          hidden: { opacity: 0, y: 14, filter: "blur(6px)" },
          visible: {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
          },
        }}
      >
        {lead}
      </motion.span>
      <motion.span
        className="coming-soon-accent-text text-icvf-accent"
        variants={{
          hidden: { opacity: 0, y: 14, scale: 0.88 },
          visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
          },
        }}
      >
        {accent}
      </motion.span>
    </motion.h2>
  );
}

function LoadingDots() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative z-10 flex items-center gap-2" aria-hidden>
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          className="size-2.5 rounded-full bg-icvf-accent shadow-[0_0_12px_rgba(245,166,35,0.45)] sm:size-3"
          animate={
            reduceMotion
              ? undefined
              : { y: [0, -7, 0], opacity: [0.4, 1, 0.4], scale: [0.92, 1.08, 0.92] }
          }
          transition={
            reduceMotion
              ? undefined
              : { duration: 1.15, repeat: Infinity, ease: "easeInOut", delay: index * 0.16 }
          }
        />
      ))}
    </div>
  );
}

export function MarketingComingSoonShell() {
  const { t } = useMarketingText();

  return (
    <section
      className="relative scroll-mt-20 py-8 sm:py-10"
      aria-labelledby="marketing-coming-soon-title"
    >
      <MarketingContainer className="flex flex-col items-center">
        <motion.div
          className="coming-soon-hub relative flex flex-col items-center gap-3 sm:gap-4"
          role="status"
          aria-live="polite"
          aria-label={`${t("marketing.comingSoon.titleLead")} ${t("marketing.comingSoon.titleAccent")}`}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
        >
          <div className="coming-soon-glow pointer-events-none absolute rounded-full motion-reduce:hidden" aria-hidden />

          <AnimatedTitle id="marketing-coming-soon-title" />
          <OrbitClock />
          <LoadingDots />
        </motion.div>
      </MarketingContainer>
    </section>
  );
}
