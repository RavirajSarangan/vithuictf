import { MarketingLanguageProvider } from "@/contexts/marketing-language-context";
import { AuthLayoutProvider } from "@/providers/auth-layout-provider";
import { AuthLayoutChrome } from "@/components/auth/auth-layout-chrome";
import { MarketingBrandVariables } from "@/components/shared/marketing-brand-variables";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthLayoutProvider>
      <MarketingLanguageProvider>
        <MarketingBrandVariables />
        <AuthLayoutChrome>{children}</AuthLayoutChrome>
      </MarketingLanguageProvider>
    </AuthLayoutProvider>
  );
}
