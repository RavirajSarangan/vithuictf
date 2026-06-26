import { MarketingBrandVariables } from "@/components/shared/marketing-brand-variables";
import { MarketingHeader } from "@/components/landing/marketing-header";
import { MarketingFooter } from "@/components/landing/marketing-footer";
import { MarketingHashSync } from "@/components/landing/marketing-hash-sync";
import { MarketingAnnouncementPopup } from "@/components/landing/marketing-announcement-popup";
import { MarketingLanguageProvider } from "@/contexts/marketing-language-context";
import { MarketingDataProvider } from "@/contexts/marketing-data-context";
import { getActiveMarketingAnnouncement, getMarketingHomeData } from "@/lib/marketing-data";

export const revalidate = 300;

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const [marketingData, announcement] = await Promise.all([
    getMarketingHomeData(),
    getActiveMarketingAnnouncement(),
  ]);

  return (
    <MarketingLanguageProvider>
      <MarketingDataProvider data={marketingData}>
        <div className="min-h-screen min-h-[100dvh] overflow-x-hidden bg-marketing-page text-icvf-text-dark">
          <MarketingBrandVariables />
          <MarketingHashSync />
          <MarketingHeader />
          <MarketingAnnouncementPopup announcement={announcement} />
          <main className="pt-[var(--marketing-header-offset)]">{children}</main>
          <MarketingFooter />
        </div>
      </MarketingDataProvider>
    </MarketingLanguageProvider>
  );
}
