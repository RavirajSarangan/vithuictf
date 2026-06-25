import { BRAND } from "@/lib/constants";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://ictf.lk").replace(/\/$/, "");

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
  imagePath: "/landing/vithoo.svg",
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
