"use client";

import { LanguageToggle } from "@/components/landing/language-toggle";
import { MarketingNavbar } from "@/nav/navbar";
import { NavBrand } from "@/components/landing/nav-brand";
import type { MarketingAnnouncement } from "@/types";

export function MarketingHeader({ announcement = null }: { announcement?: MarketingAnnouncement | null }) {
  return (
    <MarketingNavbar
      logo={<NavBrand />}
      sheetLogo={<NavBrand tone="dark" />}
      loginHref="/login"
      registerHref="/register"
      extraActions={<LanguageToggle monochrome />}
      announcement={announcement}
    />
  );
}
