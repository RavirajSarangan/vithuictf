import type { Metadata } from "next";
import { createLocationMetadata, generateStaticParams, LocationPageView } from "@/components/seo/location-page-view";

interface PageProps {
  params: Promise<{ district: string }>;
}

export { generateStaticParams };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { district } = await params;
  return createLocationMetadata(district, "en");
}

export default async function LocationPage({ params }: PageProps) {
  const { district } = await params;
  return <LocationPageView district={district} locale="en" />;
}
