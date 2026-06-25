import type { MarketingLocale } from "@/contexts/marketing-language-context";

const VALID_LOCALES = new Set<MarketingLocale>(["en", "ta", "si"]);

export function parseMarketingLocale(value?: string | null): MarketingLocale {
  if (value && VALID_LOCALES.has(value as MarketingLocale)) {
    return value as MarketingLocale;
  }
  return "en";
}

export function stripLocalePrefix(pathname: string): { locale: MarketingLocale; pathname: string } {
  const match = pathname.match(/^\/(ta|si)(\/.*)?$/);
  if (!match) return { locale: "en", pathname };
  const locale = parseMarketingLocale(match[1]);
  const rest = match[2] ?? "/";
  return { locale, pathname: rest };
}

export const LOCALE_COOKIE = "icvf-marketing-locale";
