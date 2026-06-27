import type { Metadata } from "next";
import { PaperCentersPageView } from "@/components/seo/paper-centers-page-view";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAPER_CENTERS_SEO } from "@/lib/seo/keywords";

export const metadata: Metadata = buildPageMetadata({
  title: PAPER_CENTERS_SEO.title.en,
  description: PAPER_CENTERS_SEO.description.en,
  path: PAPER_CENTERS_SEO.path,
  keywords: PAPER_CENTERS_SEO.keywords.en,
});

export default function PaperCentersPage() {
  return <PaperCentersPageView locale="en" />;
}
