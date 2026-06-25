import type { MarketingLocale } from "@/contexts/marketing-language-context";
import type { FAQ } from "@/types";

export function localizedFaq(faq: FAQ, locale: MarketingLocale): { question: string; answer: string } {
  if (locale === "ta" && faq.questionTa && faq.answerTa) {
    return { question: faq.questionTa, answer: faq.answerTa };
  }
  if (locale === "si" && faq.questionSi && faq.answerSi) {
    return { question: faq.questionSi, answer: faq.answerSi };
  }
  return { question: faq.question, answer: faq.answer };
}
