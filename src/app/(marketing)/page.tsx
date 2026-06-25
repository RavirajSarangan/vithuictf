import { HeroSection } from "@/components/landing/hero-section";
import { MarketingHomeSections } from "@/components/landing/marketing-home-sections";
import { HomePageJsonLd } from "@/components/seo/json-ld";
import { getMarketingHomeData } from "@/lib/marketing-data";

export default async function HomePage() {
  const data = await getMarketingHomeData();
  const faqsForSchema = data.faqs.map((f) => ({ question: f.question, answer: f.answer }));

  return (
    <>
      <HomePageJsonLd faqs={faqsForSchema} />
      <HeroSection />
      <MarketingHomeSections />
    </>
  );
}
