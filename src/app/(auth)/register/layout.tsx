import type { Metadata } from "next";
import { BRAND } from "@/lib/constants";
import { buildPortalPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPortalPageMetadata({
  title: `Register | ${BRAND.name} ICT Classes`,
  description: `Register for O/L and A/L ICT classes with ${BRAND.name}. Live Zoom tuition and islandwide paper centers across Sri Lanka.`,
});

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
