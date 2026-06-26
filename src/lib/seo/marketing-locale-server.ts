import { cookies } from "next/headers";
import type { MarketingLocale } from "@/contexts/marketing-language-context";
import { LOCALE_COOKIE, parseMarketingLocale } from "@/lib/seo/locale";

/** Reads the marketing locale cookie for SSR so client hydration matches. */
export async function getMarketingLocaleFromCookies(): Promise<MarketingLocale> {
  const cookieStore = await cookies();
  return parseMarketingLocale(cookieStore.get(LOCALE_COOKIE)?.value);
}
