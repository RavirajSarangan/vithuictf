import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "O/L & A/L ICT Exam Results | ICTF Rankings — Sri Lanka",
  description:
    "View ICTF student examination achievements — island ranks, district top tens, and A/B grades from O/L and A/L ICT exams across Sri Lanka.",
  path: "/rankings",
});

export default function RankingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
