import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/constants";
import { getProgramBySlug } from "@/lib/seo/keywords";

export const alt = `${BRAND.name} ICT Programs`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const program = getProgramBySlug(slug);
  const title = program?.h1.en ?? "O/L & A/L ICT Programs";
  const description = program?.description.en ?? "Live Zoom classes across Sri Lanka.";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 64,
          background: `linear-gradient(135deg, ${BRAND.colors.navy} 0%, ${BRAND.colors.navyDark} 55%, #0f172a 100%)`,
          color: "white",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: 26, fontWeight: 700, color: BRAND.colors.accent, marginBottom: 20 }}>
          {BRAND.fullName}
        </div>
        <div style={{ fontSize: 54, fontWeight: 800, lineHeight: 1.15, maxWidth: 1000 }}>{title}</div>
        <div style={{ fontSize: 24, marginTop: 24, opacity: 0.85, maxWidth: 960, lineHeight: 1.4 }}>
          {description.length > 140 ? `${description.slice(0, 139)}…` : description}
        </div>
        <div style={{ fontSize: 20, marginTop: 24, opacity: 0.7 }}>
          Zoom classes · Paper centers · ictf.lk
        </div>
      </div>
    ),
    { ...size }
  );
}
