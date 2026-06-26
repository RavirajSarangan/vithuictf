import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { RANKINGS_SEO } from "@/lib/seo/keywords";
import RankingsPage from "../../rankings/page";

export const metadata: Metadata = buildPageMetadata({
  title: RANKINGS_SEO.title.si,
  description: RANKINGS_SEO.description.si,
  path: RANKINGS_SEO.path,
  locale: "si",
  keywords: RANKINGS_SEO.keywords.si,
});

export default RankingsPage;
