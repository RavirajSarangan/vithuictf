import { portalRobotsMetadata } from "@/lib/seo/metadata";
import { StaffLayoutClient } from "./staff-layout-client";

export const metadata = portalRobotsMetadata;

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return <StaffLayoutClient>{children}</StaffLayoutClient>;
}
