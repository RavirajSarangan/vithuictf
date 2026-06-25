"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  applyMarketingScrollPadding,
  scrollToMarketingHashOnLoad,
} from "@/lib/marketing-scroll";

/** Ensures /#section links scroll correctly after navigation or refresh. */
export function MarketingHashSync() {
  const pathname = usePathname();

  useEffect(() => {
    applyMarketingScrollPadding();

    const onResize = () => applyMarketingScrollPadding();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      document.documentElement.style.scrollPaddingTop = "";
      document.documentElement.style.removeProperty("--marketing-header-offset");
    };
  }, []);

  useEffect(() => {
    if (pathname !== "/") return;

    const hash = window.location.hash;
    if (!hash) return;

    scrollToMarketingHashOnLoad(pathname);

    const onPopState = () => scrollToMarketingHashOnLoad(pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [pathname]);

  return null;
}
