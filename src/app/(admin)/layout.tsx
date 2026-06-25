import { portalRobotsMetadata } from "@/lib/seo/metadata";
import { AdminLayoutClient } from "./admin-layout-client";

export const metadata = portalRobotsMetadata;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
