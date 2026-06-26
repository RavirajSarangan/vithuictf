"use client";

import { useEffect, useState } from "react";
import { IcvfSiteCursor } from "@/components/shared/icvf-site-cursor";

/** Defers custom cursor paint until idle — no dynamic import to avoid stale chunk errors. */
export function IcvfSiteCursorLazy() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const enable = () => setReady(true);

    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(enable, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }

    const timer = window.setTimeout(enable, 2500);
    return () => window.clearTimeout(timer);
  }, []);

  if (!ready) return null;

  return <IcvfSiteCursor />;
}
