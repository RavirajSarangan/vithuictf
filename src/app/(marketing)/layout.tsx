import dynamic from "next/dynamic";
import { MarketingBrandVariables } from "@/components/shared/marketing-brand-variables";
import { HtmlLangSync } from "@/components/shared/html-lang-sync";
import { MarketingHeader } from "@/components/landing/marketing-header";
import { MarketingHashSync } from "@/components/landing/marketing-hash-sync";
import { MarketingAnnouncementPopup } from "@/components/landing/marketing-announcement-popup";
import { MarketingLanguageProvider } from "@/contexts/marketing-language-context";
import { getActiveMarketingAnnouncement } from "@/lib/marketing-data";
import { getMarketingLocaleFromCookies } from "@/lib/seo/marketing-locale-server";

const MarketingFooter = dynamic(
  () => import("@/components/landing/marketing-footer").then((mod) => mod.MarketingFooter),
  { loading: () => <footer className="min-h-[12rem] bg-[#0a1628]" aria-hidden /> }
);

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
        <MarketingHeader />
        <MarketingAnnouncementPopup announcement={announcement} />
        <main className="pt-[var(--marketing-header-offset)]">{children}</main>
        <MarketingFooter />
      </div>
    </MarketingLanguageProvider>
  );
}
