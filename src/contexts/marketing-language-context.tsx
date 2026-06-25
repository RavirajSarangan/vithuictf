"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import { LOCALE_COOKIE } from "@/lib/seo/locale";

export type MarketingLocale = "en" | "ta" | "si";

const STORAGE_KEY = "icvf-marketing-locale";
const LOCALE_CHANGE_EVENT = "icvf-locale-change";

function getLocaleSnapshot(): MarketingLocale {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "en" || stored === "ta" || stored === "si" ? stored : "en";
}

function subscribeLocale(onStoreChange: () => void) {
  const handler = () => onStoreChange();
  window.addEventListener(LOCALE_CHANGE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(LOCALE_CHANGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

interface MarketingLanguageContextValue {
  locale: MarketingLocale;
  setLocale: (locale: MarketingLocale) => void;
  toggleLocale: () => void;
}

const MarketingLanguageContext = createContext<MarketingLanguageContextValue | null>(null);

const LOCALE_CYCLE: MarketingLocale[] = ["en", "ta", "si"];

export function MarketingLanguageProvider({
  children,
  initialLocale = "en",
}: {
  children: React.ReactNode;
  initialLocale?: MarketingLocale;
}) {
  const storedLocale = useSyncExternalStore(subscribeLocale, getLocaleSnapshot, () => initialLocale);
  const locale = storedLocale || initialLocale;

  const setLocale = useCallback((next: MarketingLocale) => {
    localStorage.setItem(STORAGE_KEY, next);
    document.cookie = `${LOCALE_COOKIE}=${next};path=/;max-age=31536000;SameSite=Lax`;
    window.dispatchEvent(new Event(LOCALE_CHANGE_EVENT));
  }, []);

  const toggleLocale = useCallback(() => {
    const idx = LOCALE_CYCLE.indexOf(locale);
    const next = LOCALE_CYCLE[(idx + 1) % LOCALE_CYCLE.length] ?? "en";
    setLocale(next);
  }, [locale, setLocale]);

  const value = useMemo(
    () => ({ locale, setLocale, toggleLocale }),
    [locale, setLocale, toggleLocale]
  );

  return <MarketingLanguageContext.Provider value={value}>{children}</MarketingLanguageContext.Provider>;
}

export function useMarketingLanguage() {
  const ctx = useContext(MarketingLanguageContext);
  if (!ctx) {
    throw new Error("useMarketingLanguage must be used within MarketingLanguageProvider");
  }
  return ctx;
}
