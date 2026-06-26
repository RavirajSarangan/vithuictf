"use client";

import { Globe, Monitor, Radio, Trophy, Video } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { trustPills } from "@/lib/data/marketing-content";
import { useMarketingText } from "@/hooks/use-marketing-text";

const MARQUEE_ICONS: LucideIcon[] = [Video, Globe, Monitor, Radio, Trophy, Video];

export function FooterIctMarquee() {
  const { field, t } = useMarketingText();

  const items = [
    ...trustPills.map((pill) => field(pill, "label")),
    t("footer.marquee.lms"),
    t("footer.marquee.results"),
  ];

  const loop = Array.from({ length: 3 }, () => items).flat();
  const track = [...loop, ...loop];

  return (
    <div
      className="relative mt-10 overflow-hidden border-y border-white/8 bg-black/20 py-3"
      aria-hidden
    >
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-[#1c2547] to-transparent sm:w-12 md:w-16"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-[#171f3d] to-transparent sm:w-12 md:w-16"
        aria-hidden
      />
      <div className="footer-ict-marquee flex w-max gap-8 whitespace-nowrap px-6 sm:gap-12 sm:px-10 motion-reduce:animate-none">
        {track.map((label, index) => {
          const Icon = MARQUEE_ICONS[index % MARQUEE_ICONS.length] ?? Video;
          return (
            <div key={`${label}-${index}`} className="flex shrink-0 items-center gap-2.5">
              <Icon className="size-3.5 text-icvf-accent/70" aria-hidden />
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40 sm:text-[11px]">
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
