import { BRAND } from "@/lib/constants";
import { FOUNDER, ORG_GEO, SITE_URL, absoluteUrl } from "@/lib/seo/site";
import { LOCATION_SLUGS, PROGRAM_PAGES, formatDistrictName } from "@/lib/seo/keywords";
import { PROGRAM_CONTENT } from "@/lib/seo/program-content";
import { getPublishedBlogPosts } from "@/lib/blog/queries";
import { getFaqsOnly, getPaperCentersOnly, getPublicCourses } from "@/lib/marketing-data";
import type { BlogPost, Course, FAQ, PaperCenter } from "@/types";

const COURSE_LEVEL_LABELS: Record<string, string> = {
  OL: "G.C.E. O/L",
  AL: "G.C.E. A/L",
  University: "University",
  Professional: "Professional",
};

/** All DB content is best-effort: llms.txt must render even if Supabase is down. */
async function loadDynamicContent(): Promise<{
  courses: Course[];
  faqs: FAQ[];
  posts: BlogPost[];
  paperCenters: PaperCenter[];
}> {
  const [courses, faqs, postsResult, paperCenters] = await Promise.all([
    getPublicCourses(),
    getFaqsOnly(),
    getPublishedBlogPosts({ pageSize: 50 }).catch(() => ({ posts: [], total: 0 })),
    getPaperCentersOnly(),
  ]);
  return { courses, faqs, posts: postsResult.posts, paperCenters };
}

function headerSection(): string {
  return [
    `# ICTF — ICT Foundation, Sri Lanka`,
    ``,
    `> O/L & A/L ICT institute, online Zoom classes, and an islandwide paper center network.`,
    `> Founder: ${FOUNDER.name}. Headquarters: Jaffna, Sri Lanka.`,
    `> Contact: ${BRAND.contact.email} | ${BRAND.contact.phone} | ${SITE_URL}`,
    ``,
    `Sitemap: ${absoluteUrl("/sitemap.xml")}`,
    `Preferred-Languages: en, ta, si`,
    `Content-Type: educational institution, ICT tuition, Sri Lanka`,
    ``,
    `## About`,
    ``,
    `ICT Foundation (ICTF) is Sri Lanka's trusted institute for Ordinary Level (O/L) and Advanced Level (A/L) ICT education. Classes are delivered live via Zoom with optional past-paper practice at partner paper centers across districts. The ICTF Student Portal provides video lessons, resources, results, leaderboard, and AI study support.`,
    ``,
    `Legal name: ${BRAND.legalName}`,
  ].join("\n");
}

function keyPagesSection(): string {
  const lines = [
    `## Key pages (English)`,
    ``,
    `- ${absoluteUrl("/")}`,
    ...PROGRAM_PAGES.map((p) => `- ${absoluteUrl(p.path)} — ${p.title.en}`),
    `- ${absoluteUrl("/courses")} — All ICTF courses`,
    `- ${absoluteUrl("/past-papers")} — Free O/L & A/L ICT past papers`,
    `- ${absoluteUrl("/network/paper-centers")} — Islandwide paper center network`,
    `- ${absoluteUrl("/about/founder")} — Founder profile`,
    `- ${absoluteUrl("/ictf-team")} — ICTF team`,
    `- ${absoluteUrl("/blog")} — ICT blog`,
    `- ${absoluteUrl("/register")} — Student registration`,
  ];
  return lines.join("\n");
}

function languagesSection(): string {
  return [
    `## Languages`,
    ``,
    `- English home: ${absoluteUrl("/")}`,
    `- Tamil home: ${absoluteUrl("/ta")}`,
    `- Sinhala home: ${absoluteUrl("/si")}`,
    ...PROGRAM_PAGES.flatMap((p) => [
      `- Tamil ${p.slug}: ${absoluteUrl(`/ta${p.path}`)}`,
      `- Sinhala ${p.slug}: ${absoluteUrl(`/si${p.path}`)}`,
    ]),
  ].join("\n");
}

function coursesSection(courses: Course[], full: boolean): string {
  const lines = [`## Courses`, ``];
  if (courses.length === 0) {
    lines.push(
      `- O/L ICT (Ordinary Level Information & Communication Technology)`,
      `- A/L ICT (Advanced Level ICT)`,
      `- Online Zoom live classes`
    );
    return lines.join("\n");
  }
  for (const course of courses) {
    const level = COURSE_LEVEL_LABELS[course.level] ?? course.level;
    const facts = [
      level,
      course.teacherName ? `taught by ${course.teacherName}` : null,
      course.durationMonths ? `${course.durationMonths} months` : null,
    ]
      .filter(Boolean)
      .join(", ");
    lines.push(`- ${course.name} (${facts}): ${absoluteUrl(`/courses/${course.slug}`)}`);
    if (full && course.description) {
      lines.push(`  ${course.description}`);
    }
  }
  return lines.join("\n");
}

function locationsSection(): string {
  return [
    `## Districts served (dedicated pages)`,
    ``,
    ...LOCATION_SLUGS.map(
      (slug) => `- ${formatDistrictName(slug)}: ${absoluteUrl(`/locations/${slug}`)}`
    ),
  ].join("\n");
}

function blogSection(posts: BlogPost[], full: boolean): string {
  if (posts.length === 0) return `## Blog\n\n- ${absoluteUrl("/blog")}`;
  const lines = [`## Blog articles`, ``];
  for (const post of posts) {
    lines.push(`- ${post.title}: ${absoluteUrl(`/blog/${post.slug}`)}`);
    if (full && post.excerpt) {
      lines.push(`  ${post.excerpt}`);
    }
  }
  return lines.join("\n");
}

function faqSection(faqs: FAQ[], full: boolean): string {
  if (faqs.length === 0) return "";
  const lines = [`## Frequently asked questions`, ``];
  for (const faq of faqs) {
    if (full) {
      lines.push(`Q: ${faq.question}`, `A: ${faq.answer}`, ``);
    } else {
      lines.push(`- ${faq.question}`);
    }
  }
  return lines.join("\n").trimEnd();
}

function programContentSection(): string {
  const lines = [`## Program details`, ``];
  for (const program of PROGRAM_PAGES) {
    const content = PROGRAM_CONTENT[program.slug]?.en;
    if (!content) continue;
    lines.push(`### ${program.h1.en}`, ``, content.intro, ``);
    for (const section of content.sections) {
      lines.push(`${section.heading}`, ...section.paragraphs);
      if (section.bullets?.length) {
        lines.push(...section.bullets.map((b) => `- ${b}`));
      }
      lines.push(``);
    }
  }
  return lines.join("\n").trimEnd();
}

function paperCentersSection(paperCenters: PaperCenter[]): string {
  const active = paperCenters.filter((center) => center.isActive);
  if (active.length === 0) return "";
  const districts = [...new Set(active.map((center) => center.district).filter(Boolean))];
  return [
    `## Paper centers`,
    ``,
    `${active.length} partner paper centers across Sri Lanka: ${districts.join(", ")}.`,
    `Directory: ${absoluteUrl("/network/paper-centers")}`,
  ].join("\n");
}

function footerSections(): string {
  return [
    `## Social profiles`,
    ``,
    `- Facebook: ${BRAND.contact.social.facebook}`,
    `- Instagram: ${BRAND.contact.social.instagram}`,
    `- YouTube: ${BRAND.contact.social.youtube}`,
    `- LinkedIn: ${BRAND.contact.social.linkedin}`,
    `- Telegram: ${BRAND.contact.social.telegram}`,
    `- WhatsApp: ${BRAND.contact.social.whatsappChannel}`,
    ``,
    `## Location`,
    ``,
    `${BRAND.contact.address}`,
    `Coordinates: ${ORG_GEO.latitude}, ${ORG_GEO.longitude}`,
    `Service area: all districts of Sri Lanka`,
    ``,
    `## Keywords`,
    ``,
    `O/L ICT Sri Lanka, A/L ICT institute, ICT online classes Zoom, ICT paper centers, ICT institute Jaffna, ICTF, ${FOUNDER.name}, ICT tuition Sri Lanka, ICT classes Tamil Sinhala English`,
  ].join("\n");
}

async function buildText(full: boolean): Promise<string> {
  const { courses, faqs, posts, paperCenters } = await loadDynamicContent();

  const sections = [
    headerSection(),
    keyPagesSection(),
    languagesSection(),
    coursesSection(courses, full),
    ...(full ? [programContentSection()] : []),
    locationsSection(),
    paperCentersSection(paperCenters),
    blogSection(posts, full),
    faqSection(faqs, full),
    footerSections(),
  ].filter(Boolean);

  return sections.join("\n\n") + "\n";
}

/** Compact llms.txt — index-style overview for AI crawlers. */
export function buildLlmsText(): Promise<string> {
  return buildText(false);
}

/** llms-full.txt — expanded content (program details, full FAQs, descriptions). */
export function buildLlmsFullText(): Promise<string> {
  return buildText(true);
}
