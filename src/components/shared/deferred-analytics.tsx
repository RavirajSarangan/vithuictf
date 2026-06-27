"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const Analytics = dynamic(
  () => import("@vercel/analytics/react").then((mod) => mod.Analytics),
  { ssr: false }
);

const SpeedInsights = dynamic(
  () => import("@vercel/speed-insights/next").then((mod) => mod.SpeedInsights),
  { ssr: false }
);

export function DeferredAnalytics() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const enable = () => {
      if (!cancelled) setReady(true);
    };

    const onInteraction = () => enable();

    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(enable, { timeout: 3500 });
      window.addEventListener("pointerdown", onInteraction, { once: true, passive: true });
      window.addEventListener("keydown", onInteraction, { once: true });

      return () => {
        cancelled = true;
        window.cancelIdleCallback(id);
        window.removeEventListener("pointerdown", onInteraction);
        window.removeEventListener("keydown", onInteraction);
      };
    }

    const timer = window.setTimeout(enable, 2000);
    window.addEventListener("pointerdown", onInteraction, { once: true, passive: true });
    window.addEventListener("keydown", onInteraction, { once: true });

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener("pointerdown", onInteraction);
      window.removeEventListener("keydown", onInteraction);
    };
  }, []);

  if (!ready) return null;

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
