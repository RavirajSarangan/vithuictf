import type { Metadata } from "next";
import { createFounderMetadata, FounderPageView } from "@/components/seo/founder-page-view";

export async function generateMetadata(): Promise<Metadata> {
  return createFounderMetadata("ta");
}

export default function TaFounderPage() {
  return <FounderPageView locale="ta" />;
}
