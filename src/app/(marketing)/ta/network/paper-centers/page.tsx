import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAPER_CENTERS_SEO } from "@/lib/seo/keywords";
import PaperCentersPage from "../../../network/paper-centers/page";

export const metadata: Metadata = buildPageMetadata({
  title: PAPER_CENTERS_SEO.title.ta,
  description: PAPER_CENTERS_SEO.description.ta,
  path: PAPER_CENTERS_SEO.path,
  locale: "ta",
  keywords: PAPER_CENTERS_SEO.keywords.ta,
});

export default PaperCentersPage;
