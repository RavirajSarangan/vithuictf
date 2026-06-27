import { cookies, headers } from "next/headers";
import type { MarketingLocale } from "@/contexts/marketing-language-context";
import { LOCALE_COOKIE, parseMarketingLocale, getMarketingLocaleFromPath } from "@/lib/seo/locale";

/** Reads the marketing locale cookie for SSR so client hydration matches. */
export async function getMarketingLocaleFromCookies(): Promise<MarketingLocale> {
  try {
    const cookieStore = await cookies();
    return parseMarketingLocale(cookieStore.get(LOCALE_COOKIE)?.value);
  } catch {
    return "en";
  }
}

/** Resolves `<html lang>` for SSR from URL path (preferred) or locale cookie. */
export async function getMarketingHtmlLang(): Promise<MarketingLocale> {
  try {
    const headerStore = await headers();
    const pathname = headerStore.get("x-pathname") ?? "/";
    const pathLocale = getMarketingLocaleFromPath(pathname);
    if (pathLocale !== "en") return pathLocale;
    return getMarketingLocaleFromCookies();
  } catch {
    return "en";
  }
}
