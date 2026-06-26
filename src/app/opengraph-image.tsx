import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/constants";

export const alt = `${BRAND.name} — O/L & A/L ICT Institute Sri Lanka`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
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
        <div style={{ fontSize: 28, fontWeight: 700, color: BRAND.colors.accent, marginBottom: 16 }}>
          {BRAND.fullName}
        </div>
        <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.1, maxWidth: 900 }}>
          O/L &amp; A/L ICT Institute
        </div>
        <div style={{ fontSize: 36, fontWeight: 600, marginTop: 12, opacity: 0.95 }}>Islandwide · Sri Lanka</div>
        <div style={{ fontSize: 22, marginTop: 32, opacity: 0.85 }}>
          Zoom classes · Paper centers · Student portal
        </div>
        <div style={{ fontSize: 18, marginTop: 16, opacity: 0.7 }}>
          Founded by Vithoosan Sivanathan · Jaffna HQ · ictf.lk
        </div>
      </div>
    ),
    { ...size }
  );
}
