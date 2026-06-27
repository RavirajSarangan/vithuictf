import type { Metadata } from "next";
import { createProgramMetadata, ProgramPageView } from "@/components/seo/program-page-view";
import { PROGRAM_PAGES } from "@/lib/seo/keywords";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return PROGRAM_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return createProgramMetadata(slug, "ta");
}

export default async function TaProgramPage({ params }: PageProps) {
  const { slug } = await params;
  return <ProgramPageView slug={slug} locale="ta" />;
}
