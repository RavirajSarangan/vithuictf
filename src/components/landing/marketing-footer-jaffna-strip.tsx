"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

export function MarketingFooterJaffnaStrip() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="relative w-full overflow-hidden bg-icvf-navy-dark"
      initial={reduceMotion ? false : { opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.55, ease: EASE }}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent via-icvf-accent/50 to-transparent"
        initial={reduceMotion ? false : { scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.65, ease: EASE }}
      />

      <div className="relative aspect-[2172/724] w-full min-h-40 max-h-64 sm:min-h-48 sm:max-h-72 lg:min-h-56 lg:max-h-[22rem]">
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src="/landing/jaffna-footer.webp"
            alt="Jaffna landmarks — Nallur Kovil, Jaffna Fort, and Sri Lankan heritage"
            fill
            className={cn(
              "object-cover object-bottom",
              !reduceMotion && "sm:marketing-footer-jaffna-pan"
            )}
            sizes="(max-width: 768px) 100vw, 1200px"
            quality={75}
          />
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-12 bg-gradient-to-b from-icvf-navy-dark via-icvf-navy-dark/70 to-transparent sm:h-16"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-transparent via-transparent to-[#0f1528]/70"
        />
      </div>
    </motion.div>
  );
}
