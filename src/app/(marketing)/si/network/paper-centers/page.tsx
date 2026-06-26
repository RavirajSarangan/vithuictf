import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAPER_CENTERS_SEO } from "@/lib/seo/keywords";
import PaperCentersPage from "../../../network/paper-centers/page";

export const metadata: Metadata = buildPageMetadata({
  title: PAPER_CENTERS_SEO.title.si,
  description: PAPER_CENTERS_SEO.description.si,
  path: PAPER_CENTERS_SEO.path,
  locale: "si",
  keywords: PAPER_CENTERS_SEO.keywords.si,
});

export default PaperCentersPage;
