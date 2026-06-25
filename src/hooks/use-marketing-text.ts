"use client";

import { useMarketingLanguage, type MarketingLocale } from "@/contexts/marketing-language-context";
import { getMarketingUi, type MarketingUiKey } from "@/lib/i18n/marketing-ui";

type LocalizedFields = { en: string; ta?: string; si?: string };

export function useMarketingText() {
  const { locale, setLocale, toggleLocale } = useMarketingLanguage();

  const t = (key: MarketingUiKey) => getMarketingUi(key, locale);

  const pick = (en: string, ta?: string, si?: string) => {
    if (locale === "si" && si) return si;
    if (locale === "ta" && ta) return ta;
    return en;
  };

  const bilingual = ({ en, ta, si }: LocalizedFields) => {
    if (locale === "si" && si) return si;
    if (locale === "ta" && ta) return ta;
    return en;
  };

  const field = (item: object, key: string) => {
    const record = item as Record<string, unknown>;
    const en = record[key] as string | undefined;
    const ta = record[`${key}Ta`] as string | undefined;
    const si = record[`${key}Si`] as string | undefined;
    if (locale === "si" && si) return si;
    if (locale === "ta" && ta) return ta;
    return en ?? "";
  };

  return { locale, setLocale, toggleLocale, t, pick, bilingual, field };
}

export function localizedField(
  locale: MarketingLocale,
  item: Record<string, unknown>,
  key: string
): string {
  const en = item[key] as string | undefined;
  const ta = item[`${key}Ta`] as string | undefined;
  const si = item[`${key}Si`] as string | undefined;
  if (locale === "si" && si) return si;
  if (locale === "ta" && ta) return ta;
  return en ?? "";
}
