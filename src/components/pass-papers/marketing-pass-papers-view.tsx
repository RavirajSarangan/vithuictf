import { PassPaperBrowserLazy } from "@/components/pass-papers/pass-paper-browser-lazy";
import {
  MarketingContainer,
  MarketingSection,
  MarketingSectionIntro,
} from "@/components/landing/marketing-layout";
import type { PassPaperFolder, PassPaperItem } from "@/types";

export function MarketingPassPapersView({
  folders,
  items,
  pathSlugs = [],
}: {
  folders: PassPaperFolder[];
  items: PassPaperItem[];
  pathSlugs?: string[];
}) {
  return (
    <MarketingSection tone="light">
      <MarketingContainer>
        <MarketingSectionIntro
          as="h1"
          badge="Free Download"
          title="Pass Papers Network"
          subtitle="Browse official and supplementary past papers. All resources open via secure Google Drive links."
          light={false}
          badgeVariant="accent"
        />
        <PassPaperBrowserLazy
          folders={folders}
          items={items}
          loading={false}
          basePath="/pass-papers"
          pathSlugs={pathSlugs}
        />
      </MarketingContainer>
    </MarketingSection>
  );
}
