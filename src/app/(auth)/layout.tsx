import { MarketingLanguageProvider } from "@/contexts/marketing-language-context";
import { AuthLayoutProvider } from "@/providers/auth-layout-provider";
import { AuthLayoutChrome } from "@/components/auth/auth-layout-chrome";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthLayoutProvider>
      <MarketingLanguageProvider>
        <AuthLayoutChrome>{children}</AuthLayoutChrome>
      </MarketingLanguageProvider>
    </AuthLayoutProvider>
  );
}
