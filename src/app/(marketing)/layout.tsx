import { MarketingHeader } from "@/components/landing/marketing-header";
import { MarketingFooter } from "@/components/landing/marketing-footer";
import { MarketingHashSync } from "@/components/landing/marketing-hash-sync";
import { MarketingLanguageProvider } from "@/contexts/marketing-language-context";
import { MarketingDataProvider } from "@/contexts/marketing-data-context";
import { FloatingApplyButton } from "@/components/landing/floating-apply-button";
import { getMarketingHomeData } from "@/lib/marketing-data";

export const revalidate = 300;

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const marketingData = await getMarketingHomeData();

  return (
    <MarketingLanguageProvider>
      <MarketingDataProvider data={marketingData}>
        <div className="min-h-screen min-h-[100dvh] overflow-x-hidden bg-marketing-page text-icvf-text-dark">
          <MarketingHashSync />
          <MarketingHeader />
          <main className="pt-[var(--marketing-header-offset)] pb-28 lg:pb-0">{children}</main>
          <MarketingFooter />
          <FloatingApplyButton />
        </div>
      </MarketingDataProvider>
    </MarketingLanguageProvider>
  );
}
