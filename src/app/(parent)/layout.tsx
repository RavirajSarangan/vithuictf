import { portalRobotsMetadata } from "@/lib/seo/metadata";
import { ParentLayoutClient } from "./parent-layout-client";

export const metadata = portalRobotsMetadata;

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return <ParentLayoutClient>{children}</ParentLayoutClient>;
}
