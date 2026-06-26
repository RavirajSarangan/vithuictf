import { MarketingFooter } from "@/components/landing/marketing-footer";
import { MarketingHashSync } from "@/components/landing/marketing-hash-sync";
import { MarketingHeader } from "@/components/landing/marketing-header";
import { MarketingBrandVariables } from "@/components/shared/marketing-brand-variables";
import { MarketingLanguageProvider } from "@/contexts/marketing-language-context";
import { AuthLayoutProvider } from "@/providers/auth-layout-provider";
import { getMarketingLocaleFromCookies } from "@/lib/seo/marketing-locale-server";

export default async function MaintenanceLayout({ children }: { children: React.ReactNode }) {
  const initialLocale = await getMarketingLocaleFromCookies();

  return (
    <AuthLayoutProvider>
      <MarketingLanguageProvider initialLocale={initialLocale}>
      <MarketingBrandVariables />
      <MarketingHashSync />
      <MarketingHeader />
      <main className="min-h-screen bg-gradient-to-br from-icvf-navy-dark via-icvf-navy to-icvf-navy-hover pt-[calc(var(--marketing-header-offset,3.5rem)+1.5rem)]">
        {children}
      </main>
      <MarketingFooter />
    </MarketingLanguageProvider>
    </AuthLayoutProvider>
  );
}
