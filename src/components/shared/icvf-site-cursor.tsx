"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { motion, useMotionValue } from "framer-motion";

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

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const active = enabled && !textField;
  const isShown = visible && active;
  const pointerScale = pressing ? 0.82 : hovering ? 1.12 : 1;

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

      mouseX.set(x);
      mouseY.set(y);

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
  }, [enabled, mouseX, mouseY]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[10002] will-change-transform"
      style={{ x: mouseX, y: mouseY }}
      initial={false}
      animate={{
        opacity: isShown ? 1 : 0,
        scale: isShown ? pointerScale : 0.7,
      }}
      transition={{ type: "spring", stiffness: 700, damping: 32, mass: 0.25 }}
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 40 40"
        className="text-icvf-accent"
        style={{
          transform: "translate(-1px, -1px)",
          filter:
            "drop-shadow(0 1px 0 rgba(255,255,255,0.9)) drop-shadow(0 0 10px rgba(245,166,35,0.85))",
        }}
      >
        <path
          fill="currentColor"
          stroke="rgba(255,255,255,0.85)"
          strokeWidth="1.2"
          strokeLinejoin="round"
          d="M1.8 4.4 7 36.2c.3 1.8 2.6 2.3 3.6.8l3.9-5.7c1.7-2.5 4.5-4.1 7.5-4.3l6.9-.5c1.8-.1 2.5-2.4 1.1-3.5L5 2.5c-1.4-1.1-3.5 0-3.3 1.9Z"
        />
      </svg>
    </motion.div>
  );
}
