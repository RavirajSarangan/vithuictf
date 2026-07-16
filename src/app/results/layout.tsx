import { MarketingLanguageProvider } from "@/contexts/marketing-language-context";
import { getMarketingLocaleFromCookies } from "@/lib/seo/marketing-locale-server";

export default async function ResultsCheckLayout({ children }: { children: React.ReactNode }) {
  const initialLocale = await getMarketingLocaleFromCookies();

  return <MarketingLanguageProvider initialLocale={initialLocale}>{children}</MarketingLanguageProvider>;
}
