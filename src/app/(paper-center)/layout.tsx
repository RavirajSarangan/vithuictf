import { portalRobotsMetadata } from "@/lib/seo/metadata";
import { PaperCenterLayoutClient } from "./paper-center-layout-client";

export const metadata = portalRobotsMetadata;

export default function PaperCenterLayout({ children }: { children: React.ReactNode }) {
  return <PaperCenterLayoutClient>{children}</PaperCenterLayoutClient>;
}
