import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/constants";
import { getBlogPostBySlug } from "@/lib/blog/queries";

export const alt = `${BRAND.name} ICT Blog`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug).catch(() => null);
  const title = post?.title ?? "ICT tips, exam guidance & institute updates";

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
          ICTF · ICT Blog
        </div>
        <div
          style={{
            fontSize: title.length > 70 ? 44 : 54,
            fontWeight: 800,
            lineHeight: 1.15,
            maxWidth: 1000,
          }}
        >
          {title}
        </div>
        {post?.authorName ? (
          <div style={{ fontSize: 24, marginTop: 28, opacity: 0.85 }}>By {post.authorName}</div>
        ) : null}
        <div style={{ fontSize: 20, marginTop: 16, opacity: 0.7 }}>
          O/L &amp; A/L ICT · Sri Lanka · ictf.lk/blog
        </div>
      </div>
    ),
    { ...size }
  );
}
