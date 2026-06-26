import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import HomePage from "../page";

export const metadata: Metadata = buildPageMetadata({
  title: "ICTF — O/L & A/L ICT ආයතනය ශ්‍රී ලංකාව",
  description:
    "ICT Foundation (ICTF) — ශ්‍රී ලංකාවේ විශ්වාසදායක O/L & A/L ICT ආයතනය. Zoom පන්ති, ප්‍රශ්න පත්‍ර මධ්‍යස්ථාන, ශිෂ්‍ය ද්වාරය. නිර්මාතෘ Vithoosan Sivanathan.",
  path: "/",
  locale: "si",
});

export default function SiHomePage() {
  return <HomePage locale="si" />;
}
