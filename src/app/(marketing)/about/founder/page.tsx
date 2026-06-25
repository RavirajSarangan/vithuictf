import type { Metadata } from "next";
import { createFounderMetadata, FounderPageView } from "@/components/seo/founder-page-view";

export async function generateMetadata(): Promise<Metadata> {
  return createFounderMetadata("en");
}

export default async function FounderPage() {
  return <FounderPageView locale="en" />;
}
