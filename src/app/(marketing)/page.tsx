import { HeroSection } from "@/components/landing/hero-section";
import { MarketingHomeSections } from "@/components/landing/marketing-home-sections";
import { MarketingSeoIntro } from "@/components/landing/marketing-seo-intro";
import { HomePageJsonLd } from "@/components/seo/json-ld";
import { MarketingDataProvider } from "@/contexts/marketing-data-context";
import type { MarketingLocale } from "@/contexts/marketing-language-context";
import { localizedFaq } from "@/lib/seo/faq";
import { getMarketingHomeData } from "@/lib/marketing-data";

export default async function HomePage({ locale = "en" }: { locale?: MarketingLocale }) {
  const data = await getMarketingHomeData();
  const faqsForSchema = data.faqs.map((f) => localizedFaq(f, locale));

  return (
    <MarketingDataProvider data={data}>
      <HomePageJsonLd faqs={faqsForSchema} locale={locale} />
      <HeroSection />
      <MarketingSeoIntro locale={locale} />
      <MarketingHomeSections />
    </MarketingDataProvider>
  );
}
