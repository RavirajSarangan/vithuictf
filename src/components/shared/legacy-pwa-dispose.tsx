"use client";

import { useEffect } from "react";

/** One-time unregister of legacy PWA workers (does not wipe dev caches). */
export function LegacyPwaDispose() {
  useEffect(() => {
    if (typeof window === "undefined" || sessionStorage.getItem("icvf-pwa-disposed") === "1") {
      return;
    }

    sessionStorage.setItem("icvf-pwa-disposed", "1");

    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          void registration.unregister();
        }
      });
    }
  }, []);

  return null;
}
