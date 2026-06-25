import type { Metadata } from "next";
import type { MarketingLocale } from "@/contexts/marketing-language-context";
import { BRAND } from "@/lib/constants";
import { DEFAULT_OG_IMAGE, SEO_LOCALES, SITE_URL, absoluteUrl } from "@/lib/seo/site";

export type PageLocale = MarketingLocale;

function localeToHreflang(locale: PageLocale): string {
  if (locale === "ta") return "ta-LK";
  if (locale === "si") return "si-LK";
  return "en-LK";
}

function localizedPath(path: string, locale: PageLocale): string {
  if (locale === "en") return path;
  return `/${locale}${path === "/" ? "" : path}`;
}

export function buildLanguageAlternates(path: string): Metadata["alternates"] {
  const languages: Record<string, string> = {};
  for (const locale of ["en", "ta", "si"] as const) {
    languages[localeToHreflang(locale)] = absoluteUrl(localizedPath(path, locale));
  }
  languages["x-default"] = absoluteUrl(path);
  return {
    canonical: absoluteUrl(path),
    languages,
  };
}

export interface BuildPageMetadataInput {
  title: string;
  description: string;
  path: string;
  locale?: PageLocale;
  ogImage?: string;
  ogType?: "website" | "article" | "profile";
  noIndex?: boolean;
}

export function buildPageMetadata({
  title,
  description,
  path,
  locale = "en",
  ogImage = DEFAULT_OG_IMAGE,
  ogType = "website",
  noIndex = false,
}: BuildPageMetadataInput): Metadata {
  const canonicalPath = localizedPath(path, locale);
  const url = absoluteUrl(canonicalPath);
  const imageUrl = ogImage.startsWith("http") ? ogImage : absoluteUrl(ogImage);

  return {
    title,
    description,
    metadataBase: new URL(SITE_URL),
    alternates: buildLanguageAlternates(path),
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: { index: true, follow: true } },
    openGraph: {
      type: ogType,
      locale: localeToHreflang(locale),
      alternateLocale: SEO_LOCALES.filter((l) => l !== localeToHreflang(locale)),
      url,
      siteName: BRAND.fullName,
      title,
      description,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: `${BRAND.name} — ${BRAND.tagline}` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export const rootMetadata: Metadata = buildPageMetadata({
  title: `${BRAND.name} — O/L & A/L ICT Tuition Sri Lanka`,
  description:
    "ICT Foundation (ICTF) — Sri Lanka's trusted O/L & A/L ICT tuition. Live Zoom classes, islandwide paper centers, student portal. Founded by Vithoosan Sivanathan. Jaffna HQ, serving all districts.",
  path: "/",
});

export const portalRobotsMetadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};
