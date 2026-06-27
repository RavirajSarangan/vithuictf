import { MarketingFooter } from "@/components/landing/marketing-footer";
import { MarketingBrandVariables } from "@/components/shared/marketing-brand-variables";
import { HtmlLangSync } from "@/components/shared/html-lang-sync";
import { MarketingHeader } from "@/components/landing/marketing-header";
import { MarketingHashSync } from "@/components/landing/marketing-hash-sync";
import { MarketingAnnouncementPopup } from "@/components/landing/marketing-announcement-popup";
import { MarketingLanguageProvider } from "@/contexts/marketing-language-context";
import { getActiveMarketingAnnouncement } from "@/lib/marketing-data";
import { getMarketingLocaleFromCookies } from "@/lib/seo/marketing-locale-server";

export const revalidate = 60;

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const [announcement, initialLocale] = await Promise.all([
    getActiveMarketingAnnouncement(),
    getMarketingLocaleFromCookies(),
  ]);

  return (
    <MarketingLanguageProvider initialLocale={initialLocale}>
      <div className="light min-h-screen min-h-[100dvh] overflow-x-hidden bg-marketing-page text-icvf-text-dark">
        <HtmlLangSync />
        <MarketingBrandVariables />
        <MarketingHashSync />

        <MarketingHeader announcement={announcement} />
        <MarketingAnnouncementPopup announcement={announcement} />
        <main className="bg-transparent pt-[var(--marketing-header-offset)]">
          {children}
        </main>
        <MarketingFooter />
      </div>
    </MarketingLanguageProvider>
  );
}
