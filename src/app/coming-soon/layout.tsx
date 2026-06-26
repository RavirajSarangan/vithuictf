import { MarketingHeader } from "@/components/landing/marketing-header";
import { MarketingFooter } from "@/components/landing/marketing-footer";
import { MarketingBrandVariables } from "@/components/shared/marketing-brand-variables";
import { MarketingLanguageProvider } from "@/contexts/marketing-language-context";

export default function ComingSoonLayout({ children }: { children: React.ReactNode }) {
  return (
    <MarketingLanguageProvider>
      <MarketingBrandVariables />
      <MarketingHeader />
      <main className="min-h-screen bg-gradient-to-br from-icvf-navy-dark via-icvf-navy to-icvf-navy-hover pt-24">
        {children}
      </main>
      <MarketingFooter />
    </MarketingLanguageProvider>
  );
}
