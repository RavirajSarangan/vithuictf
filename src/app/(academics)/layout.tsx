import { portalRobotsMetadata } from "@/lib/seo/metadata";
import { AcademicsLayoutClient } from "./academics-layout-client";

export const metadata = portalRobotsMetadata;

export default function AcademicsLayout({ children }: { children: React.ReactNode }) {
  return <AcademicsLayoutClient>{children}</AcademicsLayoutClient>;
}
