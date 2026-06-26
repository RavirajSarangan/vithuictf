import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { RANKINGS_SEO } from "@/lib/seo/keywords";
import RankingsPage from "../../rankings/page";

export const metadata: Metadata = buildPageMetadata({
  title: RANKINGS_SEO.title.ta,
  description: RANKINGS_SEO.description.ta,
  path: RANKINGS_SEO.path,
  locale: "ta",
  keywords: RANKINGS_SEO.keywords.ta,
});

export default RankingsPage;
