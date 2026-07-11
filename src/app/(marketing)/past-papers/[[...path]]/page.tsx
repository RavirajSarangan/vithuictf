import type { Metadata } from "next";
import { MarketingPassPapersView } from "@/components/pass-papers/marketing-pass-papers-view";
import { BreadcrumbJsonLd, ItemListJsonLd, WebPageJsonLd } from "@/components/seo/json-ld";
import { getMarketingPassPapersData } from "@/lib/marketing-data";
import { resolveFolderPathIds } from "@/lib/pass-papers-utils";
import { buildPageMetadata } from "@/lib/seo/metadata";

const PAGE_TITLE = "Past Papers Network | ICTF";
const PAGE_DESCRIPTION =
  "Browse free G.C.E. O/L and A/L ICT past papers by medium and year. Preview and download PDFs on ictf.lk or open on Google Drive.";

export const metadata: Metadata = buildPageMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  path: "/past-papers",
  keywords: [
    "ICT past papers",
    "O/L ICT past papers",
    "A/L ICT past papers",
    "free past papers Sri Lanka",
    "ICTF past papers",
    "download past papers",
  ],
  alternateLocales: ["en"],
});

export const revalidate = 300;

type PageProps = {
  params: Promise<{ path?: string[] }>;
};

export default async function MarketingPassPapersPage({ params }: PageProps) {
  const { path: pathSlugs } = await params;
  const { folders, items } = await getMarketingPassPapersData();

  const folderChain = resolveFolderPathIds(pathSlugs ?? [], folders)
    .map((id) => folders.find((folder) => folder.id === id))
    .filter((folder): folder is NonNullable<typeof folder> => Boolean(folder));
  const breadcrumbItems = [
    { name: "Home", path: "/" },
    { name: "Past Papers", path: "/past-papers" },
    ...folderChain.map((folder, index) => ({
      name: folder.title,
      path: `/past-papers/${folderChain
        .slice(0, index + 1)
        .map((f) => f.slug)
        .join("/")}`,
    })),
  ];

  const listItems = [
    ...folders.slice(0, 24).map((folder) => ({
      name: folder.title,
      url: `/past-papers/${folder.slug}`,
    })),
    ...items.slice(0, Math.max(0, 24 - folders.length)).map((item) => ({
      name: item.title,
      url: item.driveUrl,
    })),
  ];

  return (
    <>
      <WebPageJsonLd title={PAGE_TITLE} description={PAGE_DESCRIPTION} path="/past-papers" />
      <BreadcrumbJsonLd items={breadcrumbItems} />
      {listItems.length > 0 ? (
        <ItemListJsonLd name="ICTF Past Papers Network" items={listItems} />
      ) : null}
      <MarketingPassPapersView
        folders={folders}
        items={items}
        pathSlugs={pathSlugs ?? []}
      />
    </>
  );
}
