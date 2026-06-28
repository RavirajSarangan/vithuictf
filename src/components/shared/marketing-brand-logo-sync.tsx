"use client";

import dynamic from "next/dynamic";
import type { BrandLogoSettings } from "@/types";

const BrandLogoCssSync = dynamic(
  () => import("@/components/shared/brand-logo-css-sync").then((mod) => mod.BrandLogoCssSync),
  { ssr: false }
);

/** Client boundary for marketing layout logo CSS realtime sync. */
export function MarketingBrandLogoSync({ initialSettings }: { initialSettings: BrandLogoSettings }) {
  return <BrandLogoCssSync initialSettings={initialSettings} />;
}
