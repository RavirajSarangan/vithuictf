import { portalRobotsMetadata } from "@/lib/seo/metadata";
import { StudentLayoutClient } from "./student-layout-client";

export const metadata = portalRobotsMetadata;

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <StudentLayoutClient>{children}</StudentLayoutClient>;
}
