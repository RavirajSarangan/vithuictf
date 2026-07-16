import type { Metadata } from "next";
import { CanvasSection } from "@/components/canvas";
import { BRAND } from "@/lib/constants";
import { buildPortalPageMetadata } from "@/lib/seo/metadata";
import { getPlatformSettings } from "@/lib/platform-settings-server";
import { createClient } from "@/lib/supabase/server";
import { ResultCheckPageContent } from "@/components/result-checks/result-check-page-content";

export async function generateMetadata(): Promise<Metadata> {
  return buildPortalPageMetadata({
    title: `Check Your Result | ${BRAND.name}`,
    description: `Check your exam results from ${BRAND.legalName}.`,
  });
}

export default async function ResultsCheckLinkPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [settings, supabase] = await Promise.all([getPlatformSettings(), createClient()]);
  const { data: link } = await supabase
    .from("result_check_links")
    .select("slug, course_name, status")
    .eq("slug", slug)
    .maybeSingle();

  const linkActive = Boolean(link && link.status === "active");

  return (
    <div className="min-h-screen bg-icvf-surface px-4 py-24">
      <CanvasSection tone="light" className="py-12">
        <ResultCheckPageContent
          enabled={settings.resultsCheckEnabled}
          slug={slug}
          linkActive={linkActive}
          courseName={link?.course_name}
        />
      </CanvasSection>
    </div>
  );
}
