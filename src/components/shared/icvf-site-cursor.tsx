"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

const POINTER_SPRING = { stiffness: 620, damping: 40, mass: 0.32 };
const RING_SPRING = { stiffness: 260, damping: 26, mass: 0.62 };
const LABEL_SPRING = { stiffness: 200, damping: 24, mass: 0.72 };

const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], label, summary, input[type="checkbox"], input[type="radio"], select, [data-cursor-hover]';

const TEXT_FIELD_SELECTOR =
  'input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="reset"]), textarea, [contenteditable="true"]';

function getCustomCursorEnabled() {
  if (typeof window === "undefined") return false;

  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return !coarsePointer && !reducedMotion;
}

function subscribeToCursorPreference(onStoreChange: () => void) {
  const coarsePointer = window.matchMedia("(pointer: coarse)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  coarsePointer.addEventListener("change", onStoreChange);
  reducedMotion.addEventListener("change", onStoreChange);

  return () => {
    coarsePointer.removeEventListener("change", onStoreChange);
    reducedMotion.removeEventListener("change", onStoreChange);
  };
}

function useCustomCursorEnabled() {
  return useSyncExternalStore(
    subscribeToCursorPreference,
    getCustomCursorEnabled,
    () => false,
  );
}

function resolveHoverState(target: Element | null) {
  if (!target) {
    return { interactive: false, textField: false };
  }

  const textField = Boolean(target.closest(TEXT_FIELD_SELECTOR));
  const interactive = !textField && Boolean(target.closest(INTERACTIVE_SELECTOR));

  return { interactive, textField };
}

export function IcvfSiteCursor() {
  const enabled = useCustomCursorEnabled();
  const [visible, setVisible] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [pressing, setPressing] = useState(false);
  const [textField, setTextField] = useState(false);

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const ringX = useMotionValue(0);
  const ringY = useMotionValue(0);
  const labelX = useMotionValue(0);
  const labelY = useMotionValue(0);

  const springPointerX = useSpring(pointerX, POINTER_SPRING);
  const springPointerY = useSpring(pointerY, POINTER_SPRING);
  const springRingX = useSpring(ringX, RING_SPRING);
  const springRingY = useSpring(ringY, RING_SPRING);
  const springLabelX = useSpring(labelX, LABEL_SPRING);
  const springLabelY = useSpring(labelY, LABEL_SPRING);

  const active = enabled && !textField;
  const label = "ICTF";
  const isShown = visible && active;

  useEffect(() => {
    if (!enabled) {
      document.documentElement.classList.remove("icvf-custom-cursor");
      return;
    }

    const styleId = "__icvf-cursor-none";
    let style = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        html.icvf-custom-cursor,
        html.icvf-custom-cursor * {
          cursor: none !important;
        }
        html.icvf-custom-cursor input,
        html.icvf-custom-cursor textarea,
        html.icvf-custom-cursor select,
        html.icvf-custom-cursor [contenteditable="true"] {
          cursor: text !important;
        }
      `;
      document.head.appendChild(style);
    }

    document.documentElement.classList.add("icvf-custom-cursor");

    const onMove = (event: PointerEvent) => {
      const x = event.clientX;
      const y = event.clientY;
      const target = document.elementFromPoint(x, y);
      const hoverState = resolveHoverState(target);

      pointerX.set(x);
      pointerY.set(y);
      ringX.set(x);
      ringY.set(y);
      labelX.set(x + 18);
      labelY.set(y + 22);

      setTextField(hoverState.textField);
      setHovering(hoverState.interactive);
      setVisible(true);
    };

    const onLeave = () => setVisible(false);
    const onBlur = () => {
      if (document.visibilityState === "hidden") setVisible(false);
    };
    const onDown = () => setPressing(true);
    const onUp = () => setPressing(false);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onBlur);

    return () => {
      document.documentElement.classList.remove("icvf-custom-cursor");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onBlur);
    };
  }, [enabled, labelX, labelY, pointerX, pointerY, ringX, ringY]);

  if (!enabled) return null;

  const ringSize = hovering ? 44 : pressing ? 26 : 34;
  const pointerScale = pressing ? 0.88 : hovering ? 1.06 : 1;

  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[10000] will-change-transform"
        style={{ x: springRingX, y: springRingY }}
        initial={false}
        animate={{
          opacity: isShown ? (hovering ? 0.95 : 0.72) : 0,
          scale: isShown ? 1 : 0.85,
        }}
        transition={{ duration: 0.14 }}
      >
        <motion.div
          className={cn(
            "absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-icvf-accent/55 bg-icvf-accent/[0.08] shadow-[0_0_24px_-4px_rgba(245,166,35,0.45)] backdrop-blur-[2px]",
            hovering && "border-icvf-accent bg-icvf-accent/15",
          )}
          animate={{
            width: ringSize,
            height: ringSize,
          }}
          transition={{ type: "spring", stiffness: 420, damping: 28, mass: 0.45 }}
        />
      </motion.div>

      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[10001] will-change-transform"
        style={{ x: springPointerX, y: springPointerY }}
        initial={false}
        animate={{
          opacity: isShown ? 1 : 0,
          scale: isShown ? pointerScale : 0.85,
        }}
        transition={{ type: "spring", stiffness: 520, damping: 32, mass: 0.35 }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 40 40"
          className="text-icvf-accent"
          style={{
            transform: "translate(1px, 1px)",
            filter: "drop-shadow(0 0 8px color-mix(in srgb, var(--icvf-accent) 50%, transparent))",
          }}
        >
          <path
            fill="currentColor"
            d="M1.8 4.4 7 36.2c.3 1.8 2.6 2.3 3.6.8l3.9-5.7c1.7-2.5 4.5-4.1 7.5-4.3l6.9-.5c1.8-.1 2.5-2.4 1.1-3.5L5 2.5c-1.4-1.1-3.5 0-3.3 1.9Z"
          />
        </svg>
      </motion.div>

      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9999] will-change-transform"
        style={{ x: springLabelX, y: springLabelY }}
        initial={false}
        animate={{
          opacity: isShown ? (hovering ? 1 : 0.92) : 0,
          scale: isShown ? (hovering ? 1.04 : 1) : 0.9,
          y: isShown ? 0 : 4,
        }}
        transition={{ type: "spring", stiffness: 280, damping: 26, mass: 0.5 }}
      >
        <span
          className={cn(
            "inline-block rounded-md border px-2.5 py-0.5 text-[11px] font-medium italic tracking-wide shadow-md backdrop-blur-sm transition-colors duration-200",
            hovering
              ? "border-icvf-accent/50 bg-icvf-navy text-white"
              : "border-icvf-accent/30 bg-icvf-navy/90 text-white",
          )}
        >
          {label}
        </span>
      </motion.div>
    </>
  );
}
