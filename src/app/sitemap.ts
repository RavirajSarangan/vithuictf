import type { MetadataRoute } from "next";
import { LOCATION_SLUGS, PROGRAM_PAGES } from "@/lib/seo/keywords";
import { SITE_URL } from "@/lib/seo/site";
import { getPublishedBlogSlugEntries } from "@/lib/blog/queries";
import { getMarketingPassPapersData, getPublicCourses } from "@/lib/marketing-data";
import { buildPassPaperUrl } from "@/lib/pass-papers-utils";

const LOCALES = ["", "/ta", "/si"] as const;

/** Paths that exist in English only — no /ta or /si alternates in sitemap. */
const ENGLISH_ONLY_PATHS = new Set(["/blog", "/courses", "/past-papers", "/ictf-team"]);

function withLocales(path: string): string[] {
  if (ENGLISH_ONLY_PATHS.has(path)) return [path];
  return LOCALES.map((prefix) => `${prefix}${path}`);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPaths = [
    "/",
    "/blog",
    "/courses",
    "/past-papers",
    "/ictf-team",
    "/network/paper-centers",
    "/about/founder",
    ...PROGRAM_PAGES.map((p) => p.path),
    ...LOCATION_SLUGS.map((slug) => `/locations/${slug}`),
  ];

  let blogEntries: Awaited<ReturnType<typeof getPublishedBlogSlugEntries>> = [];
  try {
    blogEntries = await getPublishedBlogSlugEntries();
  } catch {
    blogEntries = [];
  }

  const entries: MetadataRoute.Sitemap = [];

  for (const path of staticPaths) {
    for (const localized of withLocales(path)) {
      entries.push({
        url: `${SITE_URL}${localized}`,
        lastModified: now,
        changeFrequency: path === "/" ? "daily" : path.startsWith("/blog") ? "daily" : "weekly",
        priority: path === "/" ? 1 : path.startsWith("/programs") ? 0.9 : path.startsWith("/blog") ? 0.8 : 0.7,
      });
    }
  }

  for (const post of blogEntries) {
    const freshness = post.updatedAt ?? post.publishedAt;
    entries.push({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: freshness ? new Date(freshness) : now,
      changeFrequency: "weekly",
      priority: 0.75,
    });
  }

  try {
    const courses = await getPublicCourses();
    for (const course of courses) {
      if (!course.slug) continue;
      entries.push({
        url: `${SITE_URL}/courses/${course.slug}`,
        lastModified: course.createdAt ? new Date(course.createdAt) : now,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch {
    // Course sitemap expansion is best-effort.
  }

  try {
    const { folders: passPaperFolders } = await getMarketingPassPapersData();
    const passPaperPaths = new Set<string>(["/past-papers"]);
    for (const folder of passPaperFolders) {
      passPaperPaths.add(buildPassPaperUrl("/past-papers", folder.id, passPaperFolders));
    }
    for (const path of passPaperPaths) {
      entries.push({
        url: `${SITE_URL}${path}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: path === "/past-papers" ? 0.85 : 0.7,
      });
    }
  } catch {
    // Pass papers sitemap expansion is best-effort.
  }

  return entries;
}
