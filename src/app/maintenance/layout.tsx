import { MarketingFooter } from "@/components/landing/marketing-footer";
import { MarketingHeader } from "@/components/landing/marketing-header";
import { MarketingLanguageProvider } from "@/contexts/marketing-language-context";

export default function MaintenanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <MarketingLanguageProvider>
      <MarketingHeader />
      <main className="min-h-screen bg-gradient-to-br from-icvf-navy-dark via-icvf-navy to-icvf-navy-hover pt-24">
        {children}
      </main>
      <MarketingFooter />
    </MarketingLanguageProvider>
  );
}
