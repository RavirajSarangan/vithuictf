"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { scrollToMarketingHashOnLoad } from "@/lib/marketing-scroll";

/** Scrolls to /#section after navigation or refresh. Header offset is synced by the marketing navbar. */
export function MarketingHashSync() {
  const pathname = usePathname();

  useEffect(() => {
    const isMarketingHome = pathname === "/" || pathname === "/ta" || pathname === "/si";
    if (!isMarketingHome) return;

    const hash = window.location.hash;
    if (!hash) return;

    scrollToMarketingHashOnLoad(pathname);

    const onPopState = () => scrollToMarketingHashOnLoad(pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [pathname]);

  return null;
}
