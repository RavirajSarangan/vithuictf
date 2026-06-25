import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND.platformName,
    short_name: BRAND.name,
    description:
      "ICT Foundation student portal — O/L & A/L ICT tuition across Sri Lanka with Zoom classes and study resources.",
    start_url: "/",
    display: "standalone",
    background_color: BRAND.colors.surface,
    theme_color: BRAND.colors.navy,
    icons: [
      { src: BRAND.favicon, sizes: "512x512", type: "image/png" },
      { src: BRAND.logoLight, sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
