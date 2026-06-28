import type { Metadata } from "next";
import { MarketingPassPapersView } from "@/components/pass-papers/marketing-pass-papers-view";
import { ItemListJsonLd, WebPageJsonLd } from "@/components/seo/json-ld";
import { getMarketingPassPapersData } from "@/lib/marketing-data";
import { buildPageMetadata } from "@/lib/seo/metadata";

const PAGE_TITLE = "Pass Papers Network | ICTF";
const PAGE_DESCRIPTION =
  "Browse G.C.E. O/L, A/L, and scholarship past papers via organized folders and Google Drive links.";

export const metadata: Metadata = buildPageMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  path: "/pass-papers",
});

type PageProps = {
  params: Promise<{ path?: string[] }>;
};

export default async function MarketingPassPapersPage({ params }: PageProps) {
  const { path: pathSlugs } = await params;
  const { folders, items } = await getMarketingPassPapersData();

  const listItems = [
    ...folders.slice(0, 24).map((folder) => ({
      name: folder.title,
      url: `/pass-papers/${folder.slug}`,
    })),
    ...items.slice(0, Math.max(0, 24 - folders.length)).map((item) => ({
      name: item.title,
      url: item.driveUrl,
    })),
  ];

  return (
    <>
      <WebPageJsonLd title={PAGE_TITLE} description={PAGE_DESCRIPTION} path="/pass-papers" />
      {listItems.length > 0 ? (
        <ItemListJsonLd name="ICTF Pass Papers Network" items={listItems} />
      ) : null}
      <MarketingPassPapersView
        folders={folders}
        items={items}
        pathSlugs={pathSlugs ?? []}
      />
    </>
  );
}
