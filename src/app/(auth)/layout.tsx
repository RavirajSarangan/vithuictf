import type { Metadata } from "next";
import { MarketingLanguageProvider } from "@/contexts/marketing-language-context";
import { AuthLayoutChrome } from "@/components/auth/auth-layout-chrome";
import { MarketingBrandVariables } from "@/components/shared/marketing-brand-variables";
import { getMarketingLocaleFromCookies } from "@/lib/seo/marketing-locale-server";
import { portalRobotsMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = portalRobotsMetadata;

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const initialLocale = await getMarketingLocaleFromCookies();

  return (
    <MarketingLanguageProvider initialLocale={initialLocale}>
      <MarketingBrandVariables />
      <AuthLayoutChrome>{children}</AuthLayoutChrome>
    </MarketingLanguageProvider>
  );
}
