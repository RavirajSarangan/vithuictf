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
      className="footer-ict-marquee-bleed marketing-full-bleed relative z-10 mt-10 w-full border-y border-white/8 bg-black/20 py-3"
      aria-hidden
    >
      <div className="marketing-marquee-track">
        <div
          className="marketing-marquee-fade-left bg-gradient-to-r from-[#171f3d] to-transparent"
          aria-hidden
        />
        <div
          className="marketing-marquee-fade-right bg-gradient-to-l from-[#171f3d] to-transparent"
          aria-hidden
        />
        <div className="footer-ict-marquee flex w-max items-center gap-5 whitespace-nowrap sm:gap-12 motion-reduce:animate-none">
          {track.map((label, index) => {
            const Icon = MARQUEE_ICONS[index % MARQUEE_ICONS.length] ?? Video;
            return (
              <div key={`${label}-${index}`} className="flex shrink-0 items-center gap-2 sm:gap-2.5">
                <Icon className="size-3.5 shrink-0 text-icvf-accent/75 sm:size-4" aria-hidden />
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/55 sm:text-[11px] sm:tracking-[0.2em] sm:text-white/45">
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
