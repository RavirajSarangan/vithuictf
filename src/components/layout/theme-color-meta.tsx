"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";
import { BRAND } from "@/lib/constants";

const DARK_THEME_COLOR = "#09090b";

export function ThemeColorMeta() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const color = resolvedTheme === "dark" ? DARK_THEME_COLOR : BRAND.colors.navy;
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');

    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }

    meta.content = color;
  }, [resolvedTheme]);

  return null;
}
