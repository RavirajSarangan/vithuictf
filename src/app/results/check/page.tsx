import type { Metadata } from "next";
import { CanvasSection } from "@/components/canvas";
import { BRAND } from "@/lib/constants";
import { buildPortalPageMetadata } from "@/lib/seo/metadata";
import { getPlatformSettings } from "@/lib/platform-settings-server";
import { ResultCheckPageContent } from "@/components/result-checks/result-check-page-content";

export async function generateMetadata(): Promise<Metadata> {
  return buildPortalPageMetadata({
    title: `Check Your Result | ${BRAND.name}`,
    description: `Check your exam results from ${BRAND.legalName}.`,
  });
}

export default async function ResultsCheckPage() {
  const settings = await getPlatformSettings();

  return (
    <div className="min-h-screen bg-icvf-surface px-4 py-24">
      <CanvasSection tone="light" className="py-12">
        <ResultCheckPageContent enabled={settings.resultsCheckEnabled} />
      </CanvasSection>
    </div>
  );
}
