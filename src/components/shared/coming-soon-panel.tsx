"use client";

import type { ReactNode } from "react";
import { Clock, Wrench } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { CanvasEyebrow } from "@/components/canvas";
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
      className="mt-4 text-2xl font-bold leading-tight tracking-tight text-icvf-navy sm:text-3xl md:text-4xl"
    >
      {lead}
      {accent ? (
        <>
          {" "}
          <span className="text-icvf-accent">{accent}</span>
        </>
      ) : null}
    </Tag>
  );
}

function AnimatedIcon({ variant }: { variant: ComingSoonVariant }) {
  const reduceMotion = useReducedMotion();
  const Icon = variant === "maintenance" ? Wrench : Clock;

  return (
    <motion.div
      className="relative mx-auto mb-6 flex size-[4.25rem] items-center justify-center sm:mb-8 sm:size-[4.75rem]"
      animate={reduceMotion ? undefined : { y: [0, -4, 0] }}
      transition={
        reduceMotion
          ? undefined
          : { duration: 3, repeat: Infinity, ease: "easeInOut" }
      }
    >
      <span
        className="coming-soon-icon-ring pointer-events-none absolute -inset-1 rounded-2xl border border-icvf-border/60 motion-reduce:animate-none"
        aria-hidden
      />
      <div className="relative flex size-full items-center justify-center rounded-2xl border border-icvf-border bg-white shadow-sm">
        <Icon className="size-7 text-icvf-navy/75 sm:size-8" strokeWidth={1.75} aria-hidden />
      </div>
    </motion.div>
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

  const card = (
    <div
      className={cn(
        "relative w-full max-w-lg rounded-3xl border border-icvf-border bg-white px-7 py-10 text-center shadow-sm sm:px-9 sm:py-11",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <AnimatedIcon variant={variant} />
      <CanvasEyebrow variant="light" className="mb-1">
        {eyebrow}
      </CanvasEyebrow>
      <ComingSoonTitle title={title} id={titleId} as={headingLevel} />
      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-icvf-text-light sm:text-base">
        {subtitle}
      </p>
      {footer ? <div className="mt-6">{footer}</div> : null}
    </div>
  );

  if (reduceMotion) {
    return card;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full"
    >
      {card}
    </motion.div>
  );
}
