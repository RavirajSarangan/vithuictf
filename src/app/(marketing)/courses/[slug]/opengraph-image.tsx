import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/constants";
import { getPublicCourseBySlug } from "@/lib/marketing-data";

export const alt = `${BRAND.name} Courses`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const LEVEL_LABELS: Record<string, string> = {
  OL: "G.C.E. O/L",
  AL: "G.C.E. A/L",
  University: "University",
  Professional: "Professional",
};

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await getPublicCourseBySlug(slug);
  const title = course?.name ?? "ICTF Courses";
  const level = course ? (LEVEL_LABELS[course.level] ?? course.level) : null;

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
        {level ? (
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              fontSize: 22,
              fontWeight: 700,
              padding: "6px 18px",
              borderRadius: 999,
              background: BRAND.colors.accent,
              color: BRAND.colors.navyDark,
              marginBottom: 20,
            }}
          >
            {level}
          </div>
        ) : null}
        <div
          style={{
            fontSize: title.length > 60 ? 46 : 56,
            fontWeight: 800,
            lineHeight: 1.15,
            maxWidth: 1000,
          }}
        >
          {title}
        </div>
        {course?.teacherName ? (
          <div style={{ fontSize: 24, marginTop: 24, opacity: 0.85 }}>
            Conducted by {course.teacherName}
          </div>
        ) : null}
        <div style={{ fontSize: 20, marginTop: 20, opacity: 0.7 }}>
          Live Zoom classes · Sri Lanka · ictf.lk/courses
        </div>
      </div>
    ),
    { ...size }
  );
}
