import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { RANKINGS_SEO } from "@/lib/seo/keywords";

export const metadata: Metadata = buildPageMetadata({
  title: RANKINGS_SEO.title.en,
  description: RANKINGS_SEO.description.en,
  path: RANKINGS_SEO.path,
  keywords: RANKINGS_SEO.keywords.en,
  noIndex: true,
});

export default function RankingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
