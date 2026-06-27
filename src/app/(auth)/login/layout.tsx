import type { Metadata } from "next";
import { BRAND } from "@/lib/constants";
import { buildPortalPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPortalPageMetadata({
  title: `Sign In | ${BRAND.name} Student Portal`,
  description: `Sign in to the ${BRAND.name} student portal for O/L and A/L ICT classes, lessons, resources, and results. ${BRAND.legalName}, Sri Lanka.`,
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
