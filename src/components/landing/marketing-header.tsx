"use client";

import { LanguageToggle } from "@/components/landing/language-toggle";
import { MarketingNavbar } from "@/nav/navbar";
import { NavBrand } from "@/components/landing/nav-brand";
import { useMarketingText } from "@/hooks/use-marketing-text";

export function MarketingHeader() {
  const { t } = useMarketingText();

  return (
    <MarketingNavbar
      logo={<NavBrand />}
      sheetLogo={<NavBrand tone="dark" />}
      loginHref="/login"
      registerHref="/register"
      mobileBadge={t("hero.badge")}
      extraActions={<LanguageToggle monochrome />}
    />
  );
}
