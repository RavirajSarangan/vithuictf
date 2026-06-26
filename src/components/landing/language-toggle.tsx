"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useMarketingText } from "@/hooks/use-marketing-text";
import type { MarketingLocale } from "@/contexts/marketing-language-context";
import {
  LOCALE_COOKIE,
  localizedMarketingPath,
  stripLocalePrefix,
} from "@/lib/seo/locale";

export function LanguageToggle({
  className,
  monochrome,
}: {
  className?: string;
  monochrome?: boolean;
}) {
  const { locale, setLocale, t } = useMarketingText();
  const pathname = usePathname();
  const router = useRouter();

  const navigateLocale = (code: MarketingLocale) => {
    const { pathname: basePath } = stripLocalePrefix(pathname);
    const nextPath = localizedMarketingPath(basePath, code);
    setLocale(code);
    document.cookie = `${LOCALE_COOKIE}=${code};path=/;max-age=31536000;SameSite=Lax`;
    router.push(nextPath);
  };

  const btn = (code: MarketingLocale, label: string) => (
    <button
      type="button"
      onClick={() => navigateLocale(code)}
      className={cn(
        "rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
        locale === code
          ? monochrome
            ? "bg-white text-black"
            : "bg-icvf-accent text-icvf-navy-dark"
          : "text-white/55 hover:text-white"
      )}
      aria-pressed={locale === code}
    >
      {label}
    </button>
  );

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 rounded-full border border-white/10 bg-white/[0.06] p-0.5",
        className
      )}
      role="group"
      aria-label="Language"
    >
      {btn("en", t("lang.en"))}
      {btn("ta", t("lang.ta"))}
      {btn("si", t("lang.si"))}
    </div>
  );
}
