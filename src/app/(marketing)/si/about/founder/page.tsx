import type { Metadata } from "next";
import { createFounderMetadata, FounderPageView } from "@/components/seo/founder-page-view";

export async function generateMetadata(): Promise<Metadata> {
  return createFounderMetadata("si");
}

export default function SiFounderPage() {
  return <FounderPageView locale="si" />;
}
