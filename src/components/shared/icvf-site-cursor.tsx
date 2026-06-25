"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { usePathname } from "next/navigation";

const POINTER_SPRING = { stiffness: 700, damping: 42, mass: 0.4 };
const LABEL_SPRING = { stiffness: 320, damping: 32, mass: 0.55 };

/** App routes use the native cursor for better usability. */
const NATIVE_CURSOR_PREFIXES = [
  "/",
  "/rankings",
  "/login",
  "/register",
  "/admin",
  "/parent",
  "/dashboard",
  "/onboarding",
  "/settings",
  "/results",
  "/resources",
  "/calendar",
  "/achievements",
  "/leaderboard",
  "/profile-card",
  "/ai-assistant",
];

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

function useNativeCursorRoute(pathname: string) {
  if (pathname === "/") return true;
  return NATIVE_CURSOR_PREFIXES.filter((p) => p !== "/").some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function IcvfSiteCursor() {
  const enabled = useCustomCursorEnabled();
  const pathname = usePathname();
  const useNative = useNativeCursorRoute(pathname);
  const [visible, setVisible] = useState(false);

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const labelX = useMotionValue(0);
  const labelY = useMotionValue(0);

  const springPointerX = useSpring(pointerX, POINTER_SPRING);
  const springPointerY = useSpring(pointerY, POINTER_SPRING);
  const springLabelX = useSpring(labelX, LABEL_SPRING);
  const springLabelY = useSpring(labelY, LABEL_SPRING);

  const active = enabled && !useNative;
  const label = "ICTF";
  const showLabel = pathname === "/" || pathname.startsWith("/coming-soon");

  useEffect(() => {
    if (!active) {
      document.documentElement.classList.remove("icvf-custom-cursor");
      return;
    }

    const styleId = "__icvf-cursor-none";
    let style = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement("style");
      style.id = styleId;
      style.textContent =
        "html.icvf-custom-cursor, html.icvf-custom-cursor * { cursor: none !important; }";
      document.head.appendChild(style);
    }

    document.documentElement.classList.add("icvf-custom-cursor");

    const onMove = (event: PointerEvent) => {
      pointerX.set(event.clientX);
      pointerY.set(event.clientY);
      labelX.set(event.clientX + 18);
      labelY.set(event.clientY + 22);
      setVisible(true);
    };

    const onLeave = () => setVisible(false);
    const onBlur = () => {
      if (document.visibilityState === "hidden") setVisible(false);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onBlur);

    return () => {
      document.documentElement.classList.remove("icvf-custom-cursor");
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onBlur);
    };
  }, [active, labelX, labelY, pointerX, pointerY]);

  if (!active) return null;

  const isShown = visible;

  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[10000] will-change-transform"
        style={{ x: springPointerX, y: springPointerY }}
        initial={false}
        animate={{ opacity: isShown ? 1 : 0, scale: isShown ? 1 : 0.85 }}
        transition={{ duration: 0.12 }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 40 40"
          className="text-icvf-accent"
          style={{
            transform: "translate(1px, 1px)",
            filter: "drop-shadow(0 0 6px color-mix(in srgb, var(--icvf-accent) 45%, transparent))",
          }}
        >
          <path
            fill="currentColor"
            d="M1.8 4.4 7 36.2c.3 1.8 2.6 2.3 3.6.8l3.9-5.7c1.7-2.5 4.5-4.1 7.5-4.3l6.9-.5c1.8-.1 2.5-2.4 1.1-3.5L5 2.5c-1.4-1.1-3.5 0-3.3 1.9Z"
          />
        </svg>
      </motion.div>

      {showLabel ? (
        <motion.div
          aria-hidden
          className="pointer-events-none fixed left-0 top-0 z-[9999] will-change-transform"
          style={{ x: springLabelX, y: springLabelY }}
          initial={false}
          animate={{ opacity: isShown ? 1 : 0, scale: isShown ? 1 : 0.9 }}
          transition={{ duration: 0.15 }}
        >
          <span className="inline-block rounded-md border border-icvf-accent/30 bg-icvf-navy/90 px-2.5 py-0.5 text-[11px] font-medium italic tracking-wide text-white shadow-md backdrop-blur-sm">
            {label}
          </span>
        </motion.div>
      ) : null}
    </>
  );
}
