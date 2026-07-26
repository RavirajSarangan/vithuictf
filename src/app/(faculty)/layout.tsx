import { portalRobotsMetadata } from "@/lib/seo/metadata";
import { FacultyLayoutClient } from "./faculty-layout-client";

export const metadata = portalRobotsMetadata;

export default function FacultyLayout({ children }: { children: React.ReactNode }) {
  return <FacultyLayoutClient>{children}</FacultyLayoutClient>;
}
