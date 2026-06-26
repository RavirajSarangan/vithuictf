"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import { usePathname } from "next/navigation";
import {
  LOCALE_COOKIE,
  getMarketingLocaleFromPath,
  parseMarketingLocale,
} from "@/lib/seo/locale";

export type MarketingLocale = "en" | "ta" | "si";

const STORAGE_KEY = "icvf-marketing-locale";
const LOCALE_CHANGE_EVENT = "icvf-locale-change";

function readCookieLocale(): MarketingLocale | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`));
  return match?.[1] ? parseMarketingLocale(match[1]) : null;
}

function getLocaleSnapshot(): MarketingLocale {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "ta" || stored === "si") return stored;
  return readCookieLocale() ?? "en";
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
  const pathname = usePathname();
  const pathLocale = getMarketingLocaleFromPath(pathname);
  const storedLocale = useSyncExternalStore(subscribeLocale, getLocaleSnapshot, () => initialLocale);
  const locale = pathLocale !== "en" ? pathLocale : storedLocale || initialLocale;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, locale);
    document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000;SameSite=Lax`;
  }, [locale]);

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
