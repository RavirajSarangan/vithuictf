import type { MetadataRoute } from "next";
import { LOCATION_SLUGS, PROGRAM_PAGES } from "@/lib/seo/keywords";
import { SITE_URL } from "@/lib/seo/site";

const LOCALES = ["", "/ta", "/si"] as const;

function withLocales(path: string): string[] {
  return LOCALES.map((prefix) => `${prefix}${path}`);
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticPaths = [
    "/",
    "/rankings",
    "/register",
    "/login",
    "/network/paper-centers",
    "/about/founder",
    ...PROGRAM_PAGES.map((p) => p.path),
    ...LOCATION_SLUGS.map((slug) => `/locations/${slug}`),
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const path of staticPaths) {
    for (const localized of withLocales(path)) {
      entries.push({
        url: `${SITE_URL}${localized}`,
        lastModified: now,
        changeFrequency: path === "/" ? "daily" : "weekly",
        priority: path === "/" ? 1 : path.startsWith("/programs") ? 0.9 : 0.7,
      });
    }
  }

  return entries;
}
