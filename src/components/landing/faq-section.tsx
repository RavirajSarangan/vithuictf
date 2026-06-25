"use client";

import { MarketingPanel, MarketingSection, MarketingSectionIntro } from "@/components/landing/marketing-layout";
import { useFaqs } from "@/hooks/use-data";
import { useMarketingText } from "@/hooks/use-marketing-text";
import { localizedFaq } from "@/lib/seo/faq";
import type { FAQ } from "@/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface FaqSectionProps {
  initialFaqs?: FAQ[];
}

export function FaqSection({ initialFaqs }: FaqSectionProps) {
  const contextFaqs = useFaqs();
  const faqs = contextFaqs.length > 0 ? contextFaqs : (initialFaqs ?? []);
  const { t, locale } = useMarketingText();

  return (
    <MarketingSection id="faq" tone="surface">
      <div className="mx-auto max-w-3xl">
        <MarketingSectionIntro
          badge={t("faq.badge")}
          title={t("faq.title")}
          accent={t("faq.accent")}
          subtitle={t("faq.subtitle")}
          align="center"
          light={false}
          badgeVariant="accent"
        />
        {/* Crawlable Q&A for SEO / AEO */}
        <div className="sr-only">
          {faqs.map((faq) => {
            const { question, answer } = localizedFaq(faq, locale);
            return (
              <details key={faq.id}>
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            );
          })}
        </div>
        <Accordion className="space-y-3">
          {faqs.length === 0 ? (
            <p className="rounded-2xl border border-icvf-border bg-white px-6 py-8 text-center text-sm text-icvf-text-light">
              {t("faq.empty")}
            </p>
          ) : (
            faqs.map((faq, index) => {
              const { question, answer } = localizedFaq(faq, locale);
              return (
                <AccordionItem key={faq.id} value={faq.id} className="border-0">
                  <MarketingPanel className="overflow-hidden p-0">
                    <AccordionTrigger className="py-5 pr-4 pl-6 text-left text-base font-semibold text-icvf-navy hover:no-underline">
                      <span className="mr-4 text-sm font-bold tracking-[0.2em] text-icvf-accent">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {question}
                    </AccordionTrigger>
                    <AccordionContent className="pb-5 pl-8 pr-4 text-icvf-text-light sm:pl-12">
                      {answer}
                    </AccordionContent>
                  </MarketingPanel>
                </AccordionItem>
              );
            })
          )}
        </Accordion>
      </div>
    </MarketingSection>
  );
}
