"use client";

import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const BINARY_BITS = [
  { char: "1", left: "6%", delay: "0s", duration: "14s" },
  { char: "0", left: "24%", delay: "2.2s", duration: "16s" },
  { char: "1", left: "68%", delay: "1.1s", duration: "15s" },
  { char: "0", left: "86%", delay: "3.4s", duration: "17s" },
] as const;

const ORBIT_DOT_ANGLES = [0, 72, 144, 216, 288] as const;

const ORBIT_DOT_POSITIONS = ORBIT_DOT_ANGLES.map((angle) => {
  const rad = (angle * Math.PI) / 180;
  return {
    key: angle,
    cx: (50 + 42 * Math.cos(rad)).toFixed(2),
    cy: (50 + 42 * Math.sin(rad)).toFixed(2),
  };
});

export function FooterTechDecor() {
  const reduceMotion = useReducedMotion();
  const gold = "rgba(245,166,35,0.3)";
  const goldSoft = "rgba(245,166,35,0.15)";
  const navyFill = "rgba(245,166,35,0.12)";

  const flowClass = cn(!reduceMotion && "hero-circuit-flow");
  const pulseClass = cn(!reduceMotion && "hero-node-pulse");
  const binaryClass = cn(!reduceMotion && "hero-binary-bit");

  return (
    <div
      className="footer-tech-decor pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <div className="hero-ict-grid absolute inset-0 opacity-[0.18]" />

      {BINARY_BITS.map((bit, index) => (
        <span
          key={index}
          className={cn(
            "absolute bottom-[14%] font-mono text-[10px] font-semibold text-white/12 sm:text-xs",
            binaryClass
          )}
          style={{
            left: bit.left,
            animationDelay: bit.delay,
            animationDuration: bit.duration,
          }}
        >
          {bit.char}
        </span>
      ))}

      <svg
        viewBox="0 0 200 140"
        className="absolute -left-2 top-[8%] hidden w-[min(28vw,160px)] opacity-35 sm:block md:w-[180px] md:opacity-40"
        fill="none"
      >
        <path
          d="M16 32 H80 V16 H120 V52 H176"
          stroke={gold}
          strokeWidth="1.4"
          strokeLinecap="round"
          className={flowClass}
        />
        <path
          d="M16 72 H60 V96 H100 V72 H176"
          stroke={goldSoft}
          strokeWidth="1.2"
          strokeLinecap="round"
          className={flowClass}
          style={reduceMotion ? undefined : { animationDelay: "0.7s" }}
        />
        {[
          [16, 32],
          [80, 16],
          [120, 52],
          [176, 52],
          [60, 72],
          [100, 96],
        ].map(([cx, cy], i) => (
          <circle
            key={`${cx}-${cy}`}
            cx={cx}
            cy={cy}
            r="3.5"
            fill={navyFill}
            stroke={gold}
            strokeWidth="1"
            className={pulseClass}
            style={reduceMotion ? undefined : { animationDelay: `${i * 0.35}s` }}
          />
        ))}
      </svg>

      <svg
        viewBox="0 0 200 140"
        className="absolute -right-2 top-[22%] hidden w-[min(26vw,150px)] opacity-30 sm:block md:w-[170px] md:opacity-35"
        fill="none"
      >
        <path
          d="M184 108 H120 V124 H80 V88 H24"
          stroke={goldSoft}
          strokeWidth="1.3"
          strokeLinecap="round"
          className={flowClass}
          style={reduceMotion ? undefined : { animationDelay: "1.2s" }}
        />
        {[
          [184, 108],
          [120, 124],
          [80, 88],
          [24, 88],
        ].map(([cx, cy], i) => (
          <circle
            key={`r-${cx}-${cy}`}
            cx={cx}
            cy={cy}
            r="3"
            fill={navyFill}
            stroke={gold}
            strokeWidth="1"
            className={pulseClass}
            style={reduceMotion ? undefined : { animationDelay: `${0.5 + i * 0.4}s` }}
          />
        ))}
      </svg>

      <div className="absolute right-[4%] top-[10%] hidden size-24 opacity-25 sm:block md:size-28 md:opacity-30">
        <svg viewBox="0 0 100 100" className="size-full" fill="none">
          <circle
            cx="50"
            cy="50"
            r="42"
            stroke="rgba(245, 166, 35, 0.2)"
            strokeWidth="1"
            strokeDasharray="4 6"
            className={cn(!reduceMotion && "coming-soon-orbit-dash")}
          />
          <g className={cn(!reduceMotion && "coming-soon-orbit-spin")}>
            {ORBIT_DOT_POSITIONS.map((dot) => (
              <circle
                key={dot.key}
                cx={dot.cx}
                cy={dot.cy}
                r="3"
                fill="rgba(245, 166, 35, 0.7)"
                className={cn(!reduceMotion && "coming-soon-orbit-dot")}
              />
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}
