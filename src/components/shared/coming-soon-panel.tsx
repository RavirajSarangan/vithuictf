"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Clock, Sparkles, Wrench } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type ComingSoonVariant = "update" | "maintenance" | "status";

interface ComingSoonPanelProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  titleId: string;
  variant?: ComingSoonVariant;
  footer?: ReactNode;
  headingLevel?: "h1" | "h2";
  className?: string;
}

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.09, delayChildren: 0.06 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

function splitTitle(title: string) {
  const parts = title.trim().split(/\s+/);
  if (parts.length < 2) {
    return { lead: title, accent: null };
  }

  const accent = parts.pop() ?? "";
  return { lead: parts.join(" "), accent };
}

function ComingSoonTitle({
  title,
  id,
  as: Tag,
}: {
  title: string;
  id: string;
  as: "h1" | "h2";
}) {
  const { lead, accent } = splitTitle(title);

  return (
    <Tag
      id={id}
      className="mt-3 text-[2.15rem] font-bold leading-[1.1] tracking-tight sm:text-[2.5rem]"
    >
      <span className="text-icvf-navy">{lead}</span>
      {accent ? (
        <>
          {" "}
          <span className="marketing-coming-soon-title-accent">{accent}</span>
        </>
      ) : null}
    </Tag>
  );
}

function PanelIcon({ variant }: { variant: ComingSoonVariant }) {
  const Icon: LucideIcon = variant === "maintenance" ? Wrench : Clock;

  return (
    <div className="relative mx-auto mb-6 flex size-[5.25rem] items-center justify-center">
      <span
        className="marketing-coming-soon-aurora pointer-events-none absolute inset-[-18%] rounded-full"
        aria-hidden
      />
      <span
        className="marketing-coming-soon-clock-ring marketing-coming-soon-clock-ring-outer absolute inset-0 rounded-full border border-icvf-accent/20"
        aria-hidden
      />
      <span
        className="marketing-coming-soon-clock-ring absolute inset-2 rounded-full border border-icvf-accent/35"
        aria-hidden
      />
      <div className="marketing-coming-soon-clock relative flex size-[3.65rem] items-center justify-center rounded-full border border-white/80 bg-gradient-to-br from-icvf-accent/30 via-white to-icvf-navy/5 shadow-[0_12px_40px_-16px_rgba(245,166,35,0.55),inset_0_1px_0_rgba(255,255,255,0.9)]">
        <Icon className="size-7 text-icvf-accent" aria-hidden />
      </div>
      {variant !== "maintenance" ? (
        <>
          <Sparkles
            className="marketing-coming-soon-sparkle absolute -right-0.5 -top-0.5 size-4 text-icvf-accent motion-reduce:hidden"
            aria-hidden
          />
          <Sparkles
            className="marketing-coming-soon-sparkle marketing-coming-soon-sparkle-delayed absolute -bottom-1 -left-1 size-3 text-icvf-accent/75 motion-reduce:hidden"
            aria-hidden
          />
        </>
      ) : null}
    </div>
  );
}

export function ComingSoonBackdrop({ dark = false }: { dark?: boolean }) {
  return (
    <>
      <div
        className="marketing-coming-soon-blur pointer-events-none absolute inset-0 select-none opacity-[0.28]"
        aria-hidden
      >
        <div className="flex h-full flex-col gap-5 p-6 sm:p-10">
          <div
            className={cn(
              "marketing-coming-soon-skeleton h-16 rounded-2xl sm:h-20",
              dark ? "bg-white/10" : "bg-icvf-navy/12"
            )}
          />
          <div className="grid flex-1 gap-4 sm:grid-cols-2">
            <div className="marketing-coming-soon-skeleton rounded-2xl bg-icvf-accent/10" />
            <div
              className={cn(
                "marketing-coming-soon-skeleton rounded-2xl",
                dark ? "bg-white/8" : "bg-icvf-navy/8"
              )}
            />
          </div>
          <div
            className={cn(
              "marketing-coming-soon-skeleton h-12 rounded-xl sm:h-14",
              dark ? "bg-white/6" : "bg-icvf-navy/6"
            )}
          />
        </div>
      </div>
      <div
        className="marketing-coming-soon-veil pointer-events-none absolute inset-0 z-[5]"
        aria-hidden
      />
    </>
  );
}

export function ComingSoonPanel({
  eyebrow,
  title,
  subtitle,
  titleId,
  variant = "update",
  footer,
  headingLevel = "h2",
  className,
}: ComingSoonPanelProps) {
  const reduceMotion = useReducedMotion();

  const content = (
    <div
      className={cn(
        "marketing-coming-soon-card relative w-full max-w-[28rem] overflow-hidden rounded-[1.85rem] border border-icvf-accent/15 bg-white/94 px-7 py-10 text-center shadow-[0_36px_110px_-32px_rgba(39,52,97,0.38)] backdrop-blur-2xl sm:px-9 sm:py-11",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div
        className="marketing-coming-soon-card-border pointer-events-none absolute inset-0 rounded-[1.85rem]"
        aria-hidden
      />
      <div
        className="marketing-coming-soon-card-shine pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-icvf-accent/80 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-icvf-accent/14 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-14 -left-14 size-44 rounded-full bg-icvf-navy/8 blur-3xl"
        aria-hidden
      />
      <div
        className="marketing-coming-soon-card-grid pointer-events-none absolute inset-0 opacity-[0.35]"
        aria-hidden
      />

      <motion.div
        variants={reduceMotion ? undefined : stagger}
        initial={reduceMotion ? false : "hidden"}
        whileInView={reduceMotion ? undefined : "visible"}
        viewport={{ once: true, amount: 0.35 }}
      >
        <motion.div variants={reduceMotion ? undefined : fadeUp}>
          <PanelIcon variant={variant} />
        </motion.div>

        <motion.p
          variants={reduceMotion ? undefined : fadeUp}
          className="marketing-coming-soon-eyebrow inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.26em] text-icvf-navy/50"
        >
          <span
            className="marketing-coming-soon-live-dot size-1.5 shrink-0 rounded-full bg-icvf-accent motion-reduce:animate-none"
            aria-hidden
          />
          {eyebrow}
        </motion.p>

        <motion.div variants={reduceMotion ? undefined : fadeUp}>
          <ComingSoonTitle title={title} id={titleId} as={headingLevel} />
        </motion.div>

        <motion.div
          variants={reduceMotion ? undefined : fadeUp}
          className="marketing-coming-soon-dots mt-4 flex items-center justify-center gap-2"
          aria-hidden
        >
          <span className="size-1.5 rounded-full bg-icvf-accent" />
          <span className="size-1.5 rounded-full bg-icvf-accent" />
          <span className="size-1.5 rounded-full bg-icvf-accent" />
        </motion.div>

        <motion.p
          variants={reduceMotion ? undefined : fadeUp}
          className="mx-auto mt-5 max-w-[20rem] text-sm leading-relaxed text-icvf-text-light sm:text-[0.95rem]"
        >
          {subtitle}
        </motion.p>

        {footer ? (
          <motion.div variants={reduceMotion ? undefined : fadeUp} className="mt-5">
            {footer}
          </motion.div>
        ) : null}
      </motion.div>

      <div
        className="marketing-coming-soon-progress-track pointer-events-none absolute inset-x-0 bottom-0 h-1 overflow-hidden bg-icvf-navy/5"
        aria-hidden
      >
        <div className="marketing-coming-soon-progress-bar h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-icvf-accent to-transparent" />
      </div>
    </div>
  );

  if (reduceMotion) {
    return content;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 22, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      {content}
    </motion.div>
  );
}
