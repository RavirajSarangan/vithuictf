"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getMarketingLocaleFromPath } from "@/lib/seo/locale";

export function HtmlLangSync() {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.lang = getMarketingLocaleFromPath(pathname);
  }, [pathname]);

  return null;
}
