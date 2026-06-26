"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const IcvfSiteCursor = dynamic(
  () => import("@/components/shared/icvf-site-cursor").then((mod) => mod.IcvfSiteCursor),
  { ssr: false }
);

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
