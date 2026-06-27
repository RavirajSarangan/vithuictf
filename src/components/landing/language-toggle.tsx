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

const HEADER_LANG_SHORT: Record<MarketingLocale, string> = {
  en: "English",
  ta: "தமிழ்",
  si: "සිංහල",
};

export function LanguageToggle({
  className,
  monochrome,
  tone = "header",
}: {
  className?: string;
  monochrome?: boolean;
  tone?: "header" | "sheet";
}) {
  const { locale, setLocale, t } = useMarketingText();
  const pathname = usePathname();
  const router = useRouter();
  const isSheet = tone === "sheet";

  const navigateLocale = (code: MarketingLocale) => {
    const { pathname: basePath } = stripLocalePrefix(pathname);
    const nextPath = localizedMarketingPath(basePath, code);
    setLocale(code);
    document.cookie = `${LOCALE_COOKIE}=${code};path=/;max-age=31536000;SameSite=Lax`;
    router.push(nextPath);
  };

  const btn = (code: MarketingLocale) => {
    const fullLabel = t(`lang.${code}`);
    const label = isSheet ? fullLabel : HEADER_LANG_SHORT[code];

    return (
      <button
        type="button"
        onClick={() => navigateLocale(code)}
        className={cn(
          "rounded-full font-semibold transition-colors",
          isSheet
            ? "flex-1 px-2 py-1 text-xs sm:flex-none sm:px-2.5"
            : "px-2.5 py-1 text-xs",
          locale === code
            ? isSheet
              ? "bg-icvf-navy text-white shadow-sm"
              : monochrome
                ? "bg-white text-black"
                : "bg-icvf-accent text-icvf-navy-dark"
            : isSheet
              ? "text-icvf-navy/70 hover:bg-icvf-navy/5 hover:text-icvf-navy"
              : "text-white/55 hover:text-white"
        )}
        aria-pressed={locale === code}
        aria-label={fullLabel}
        title={fullLabel}
      >
        {label}
      </button>
    );
  };

  return (
    <div
      className={cn(
        "marketing-lang-toggle flex shrink-0 items-center gap-0.5 rounded-full p-0.5",
        isSheet
          ? "w-full border border-icvf-navy/12 bg-icvf-navy/[0.04]"
          : "w-auto border border-white/10 bg-white/[0.06]",
        className
      )}
      role="group"
      aria-label="Language"
    >
      {btn("en")}
      {btn("ta")}
      {btn("si")}
    </div>
  );
}
