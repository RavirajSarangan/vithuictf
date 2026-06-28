import { BRAND } from "@/lib/constants";

/** Canonical public site URL — must match the primary domain (www) in production. */
function resolveSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  if (process.env.VERCEL_ENV === "production") {
    const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
    if (productionHost) {
      const host = productionHost.replace(/^https?:\/\//, "").replace(/\/$/, "");
      if (!host.endsWith(".vercel.app")) {
        return `https://${host}`;
      }
    }
  }

  return "https://www.ictf.lk";
}

export const SITE_URL = resolveSiteUrl();

export const SEO_LOCALES = ["en-LK", "ta-LK", "si-LK"] as const;
export type SeoLocale = (typeof SEO_LOCALES)[number];

export const MARKETING_LOCALE_PREFIX: Record<string, SeoLocale> = {
  en: "en-LK",
  ta: "ta-LK",
  si: "si-LK",
};

export const FOUNDER = {
  name: "Vithoosan Sivanathan",
  jobTitle: "Founder & Lead ICT Educator",
  imagePath: "/landing/hero-founder.webp",
} as const;

export const ORG_GEO = {
  latitude: 9.6615,
  longitude: 80.0074,
} as const;

export const DEFAULT_OG_IMAGE = "/opengraph-image";

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}

export function socialSameAs(): string[] {
  const { social } = BRAND.contact;
  return [
    social.facebook,
    social.instagram,
    social.youtube,
    social.linkedin,
    social.telegram,
    social.whatsappChannel,
  ];
}
