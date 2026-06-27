import type {
  Achievement,
  ActivityItem,
  BlogPostStatus,
  Certificate,
  ContactInquiry,
  Course,
  Exam,
  FAQ,
  LeaderboardEntry,
  Notification,
  Parent,
  Payment,
  PlatformSettings,
  Resource,
  Result,
  SiteStats,
  Student,
  StudentSocialLinks,
  SuccessStory,
  Teacher,
  User,
} from "@/types";
import type { Database } from "@/types/database";
import { parseBrandLogoSettings } from "@/lib/brand-logo-settings";

type StudentRow = Database["public"]["Tables"]["students"]["Row"];
type ResultRow = Database["public"]["Tables"]["results"]["Row"];
type ResourceRow = Database["public"]["Tables"]["resources"]["Row"];

function parseSocialLinks(raw: Database["public"]["Tables"]["students"]["Row"]["social_links"]): StudentSocialLinks {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const obj = raw as Record<string, unknown>;
  const links: StudentSocialLinks = {};
  if (typeof obj.linkedin === "string" && obj.linkedin) links.linkedin = obj.linkedin;
  if (typeof obj.github === "string" && obj.github) links.github = obj.github;
  if (typeof obj.twitter === "string" && obj.twitter) links.twitter = obj.twitter;
  if (typeof obj.whatsapp === "string" && obj.whatsapp) links.whatsapp = obj.whatsapp;
  return links;
}
type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

export function mapProfile(row: Database["public"]["Tables"]["profiles"]["Row"]): User {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    photoURL: row.avatar_url ?? undefined,
    createdAt: row.created_at,
  };
}

export function mapStudent(row: StudentRow): Student {
  const steps = row.onboarding_steps;
  const parsedSteps =
    steps && typeof steps === "object" && !Array.isArray(steps)
      ? (steps as Record<string, boolean>)
      : {};

  return {
    id: row.id,
    userId: row.user_id,
    studentId: row.student_id,
    username: row.username ?? undefined,
    indexNumber: row.index_number ?? undefined,
    nicNumber: row.nic_number ?? undefined,
    phone: row.phone ?? undefined,
    notifyEmail: row.notify_email,
    examYear: row.exam_year ?? undefined,
    ictGrade: row.ict_grade ?? undefined,
    displayName: row.display_name,
    email: row.email,
    courseId: row.course_id ?? "",
    courseName: row.course_name,
    grade: row.grade,
    rank: row.rank,
    streak: row.streak,
    points: row.points,
    performance: row.performance,
    photoURL: row.photo_url ?? undefined,
    bio: row.bio ?? undefined,
    socialLinks: parseSocialLinks(row.social_links ?? {}),
    cardPublic: row.card_public ?? false,
    onboardingCompletedAt: row.onboarding_completed_at ?? null,
    onboardingSteps: parsedSteps,
  };
}

export function mapCourse(row: Database["public"]["Tables"]["courses"]["Row"]): Course {
  return {
    id: row.id,
    name: row.name,
    level: row.level,
    teacherId: row.teacher_id ?? "",
    teacherName: row.teacher_name,
    studentCount: row.student_count,
    description: row.description,
    category: row.category || undefined,
    durationMonths: row.duration_months ?? undefined,
    slug: row.slug ?? undefined,
  };
}

export function mapResult(row: ResultRow): Result {
  return {
    id: row.id,
    studentId: row.student_id,
    examId: row.exam_id ?? "",
    examTitle: row.exam_title,
    subject: row.subject,
    grade: row.grade,
    marks: row.marks,
    maxMarks: row.max_marks,
    rank: row.rank,
    term: row.term,
    date: row.result_date,
  };
}


export function mapResource(row: ResourceRow): Resource {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    courseId: row.course_id,
    courseName: row.course_name,
    description: row.description,
    storagePath: row.storage_path,
    viewOnly: row.view_only,
    popular: row.popular,
    type: row.type,
    views: row.views,
    createdAt: row.created_at,
  };
}

export function mapNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    body: row.body,
    read: row.read,
    type: row.type,
    createdAt: row.created_at,
  };
}

export function mapTeacher(row: Database["public"]["Tables"]["teachers"]["Row"]): Teacher {
  const extended = row as Database["public"]["Tables"]["teachers"]["Row"] & { course_ids?: string[] };
  return {
    id: row.id,
    userId: row.user_id,
    displayName: row.display_name,
    email: row.email,
    subjects: row.subjects,
    certified: row.certified,
    courseIds: extended.course_ids ?? [],
  };
}

export function mapParent(row: Database["public"]["Tables"]["parents"]["Row"], linkedStudentIds: string[] = []): Parent {
  return {
    id: row.id,
    userId: row.user_id,
    displayName: row.display_name,
    email: row.email,
    linkedStudentIds,
  };
}

export function mapPayment(row: Database["public"]["Tables"]["payments"]["Row"]): Payment {
  return {
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name,
    amount: Number(row.amount),
    status: row.status,
    method: row.method,
    date: row.payment_date,
  };
}

export function mapCertificate(row: Database["public"]["Tables"]["certificates"]["Row"]): Certificate {
  const extended = row as Database["public"]["Tables"]["certificates"]["Row"] & { verify_code?: string };
  return {
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name,
    courseId: row.course_id,
    courseName: row.course_name,
    issuedAt: row.issued_at,
    verifyCode: extended.verify_code,
  };
}

export function mapContactInquiry(
  row: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    message: string;
    locale: string;
    status: string;
    created_at: string;
  }
): ContactInquiry {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? undefined,
    message: row.message,
    locale: row.locale,
    status: row.status as ContactInquiry["status"],
    createdAt: row.created_at,
  };
}

export function mapAchievement(row: Database["public"]["Tables"]["achievements"]["Row"]): Achievement {
  return {
    id: row.id,
    studentId: row.student_id,
    badgeId: row.badge_id,
    title: row.title,
    description: row.description,
    icon: row.icon,
    unlockedAt: row.unlocked_at,
  };
}

export function mapLeaderboard(row: Database["public"]["Tables"]["leaderboard"]["Row"]): LeaderboardEntry {
  return {
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name,
    courseId: row.course_id,
    points: row.points,
    rank: row.rank,
    performance: row.performance,
  };
}

export function mapExam(row: Database["public"]["Tables"]["exams"]["Row"]): Exam {
  return {
    id: row.id,
    title: row.title,
    courseId: row.course_id,
    date: row.exam_date,
    subjects: row.subjects,
  };
}

export function mapActivity(row: Database["public"]["Tables"]["activities"]["Row"]): ActivityItem {
  return {
    id: row.id,
    studentId: row.student_id,
    title: row.title,
    description: row.description,
    type: row.activity_type,
    createdAt: row.created_at,
  };
}

export function mapSuccessStory(row: Database["public"]["Tables"]["success_stories"]["Row"]): SuccessStory {
  return {
    id: row.id,
    name: row.name,
    course: row.course,
    achievement: row.achievement,
    review: row.review,
    photo: row.photo,
  };
}

export function mapFaq(row: Database["public"]["Tables"]["faqs"]["Row"]): FAQ {
  const extended = row as Database["public"]["Tables"]["faqs"]["Row"] & {
    question_ta?: string | null;
    answer_ta?: string | null;
    question_si?: string | null;
    answer_si?: string | null;
    category?: string | null;
    target_keyword?: string | null;
  };
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
    questionTa: extended.question_ta || undefined,
    answerTa: extended.answer_ta || undefined,
    questionSi: extended.question_si || undefined,
    answerSi: extended.answer_si || undefined,
    category: extended.category || undefined,
    targetKeyword: extended.target_keyword || undefined,
  };
}


export function mapCompany(row: Database["public"]["Tables"]["companies"]["Row"]) {
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    description: row.description,
    descriptionTa: row.description_ta || undefined,
    logoUrl: row.logo_url,
    websiteUrl: row.website_url,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  };
}

export function mapClassProgram(row: Database["public"]["Tables"]["class_programs"]["Row"]) {
  return {
    id: row.id,
    title: row.title,
    titleTa: row.title_ta || undefined,
    description: row.description,
    descriptionTa: row.description_ta || undefined,
    badge: row.badge,
    icon: row.icon,
    imageUrl: row.image_url || undefined,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  };
}

export function mapPaperCenter(row: Database["public"]["Tables"]["paper_centers"]["Row"]) {
  return {
    id: row.id,
    name: row.name,
    district: row.district,
    address: row.address,
    mapUrl: row.map_url,
    mapX: row.map_x ?? undefined,
    mapY: row.map_y ?? undefined,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  };
}

export function mapNetworkStats(row: Database["public"]["Tables"]["network_stats"]["Row"]) {
  return {
    paperCentersCount: row.paper_centers_count,
    districtsCovered: row.districts_covered,
    passRate: row.pass_rate,
    papersWritten: row.papers_written,
    headline: row.headline,
    headlineTa: row.headline_ta || undefined,
    subheadline: row.subheadline,
    subheadlineTa: row.subheadline_ta || undefined,
    ctaLabel: row.cta_label,
    ctaLabelTa: row.cta_label_ta || undefined,
    ctaUrl: row.cta_url,
  };
}

export function mapFeaturedRanking(row: Database["public"]["Tables"]["featured_rankings"]["Row"]) {
  return {
    id: row.id,
    studentName: row.student_name,
    rankType: row.rank_type as "island" | "district" | "class",
    score: row.score,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  };
}

export function mapHomeAbout(row: Database["public"]["Tables"]["home_about"]["Row"]) {
  return {
    name: row.name,
    title: row.title,
    titleTa: row.title_ta || undefined,
    bio: row.bio,
    bioTa: row.bio_ta || undefined,
    photoUrl: row.photo_url,
    credentials: row.credentials,
    highlightStudents: row.highlight_students,
    highlightExperienceYears: row.highlight_experience_years,
    ctaLabel: row.cta_label,
    ctaUrl: row.cta_url,
  };
}

export function mapMarketingAnnouncement(
  row: Database["public"]["Tables"]["marketing_announcements"]["Row"]
) {
  const contentType = row.content_type;
  const displayStyle = row.display_style;
  const validContentTypes = ["image_only", "text_only", "text_image", "text_image_link"] as const;
  const validDisplayStyles = ["minimal", "card", "image_hero", "promo", "banner"] as const;

  return {
    id: row.id,
    title: row.title,
    body: row.body,
    imageUrl: row.image_url,
    ctaLabel: row.cta_label,
    ctaUrl: row.cta_url,
    contentType: validContentTypes.includes(contentType as (typeof validContentTypes)[number])
      ? (contentType as (typeof validContentTypes)[number])
      : "text_only",
    displayStyle: validDisplayStyles.includes(displayStyle as (typeof validDisplayStyles)[number])
      ? (displayStyle as (typeof validDisplayStyles)[number])
      : "card",
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    priority: row.priority,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapSiteStats(row: Database["public"]["Tables"]["site_stats"]["Row"]): SiteStats {
  return {
    students: row.students,
    courses: row.courses,
    satisfaction: row.satisfaction,
    resources: row.resources,
    yearsExperience: row.years_experience,
    certifiedTeachers: row.certified_teachers,
    successRate: row.success_rate,
  };
}

export function mapPlatformSettings(row: {
  online_payments_enabled: boolean;
  default_institute_fee_lkr: number;
  marketing_coming_soon_enabled?: boolean;
  site_public_mode?: string;
  brand_logo_settings?: unknown;
  updated_at: string;
}): PlatformSettings {
  const sitePublicMode = row.site_public_mode;
  const validMode =
    sitePublicMode === "coming_soon" || sitePublicMode === "maintenance"
      ? sitePublicMode
      : "live";

  return {
    onlinePaymentsEnabled: row.online_payments_enabled,
    defaultInstituteFeeLkr: Number(row.default_institute_fee_lkr),
    marketingComingSoonEnabled: row.marketing_coming_soon_enabled ?? true,
    sitePublicMode: validMode,
    brandLogo: parseBrandLogoSettings(row.brand_logo_settings),
    updatedAt: row.updated_at,
  };
}

export function mapSubjectCategory(row: {
  id: string;
  name: string;
  slug: string;
  color: string;
  sort_order: number;
  active: boolean;
}) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    color: row.color,
    sortOrder: row.sort_order,
    active: row.active,
  };
}

export function mapBlogCategory(row: {
  id: string;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

export function mapBlogPost(row: {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image_url: string;
  category_id: string | null;
  status: string;
  is_featured: boolean;
  seo_title: string;
  seo_description: string;
  tags: string[] | null;
  author_name: string;
  reading_time_minutes: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  blog_categories?: { name: string; slug: string } | null;
}) {
  const status: BlogPostStatus = row.status === "published" ? "published" : "draft";
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    coverImageUrl: row.cover_image_url,
    categoryId: row.category_id,
    categoryName: row.blog_categories?.name,
    categorySlug: row.blog_categories?.slug,
    status,
    isFeatured: row.is_featured,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    tags: row.tags ?? [],
    authorName: row.author_name,
    readingTimeMinutes: row.reading_time_minutes,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapCalendarSession(
  row: {
    id: string;
    category_id: string;
    course_id: string | null;
    title: string;
    session_type: string;
    day_of_week: number | null;
    session_date: string | null;
    start_time: string;
    end_time: string;
    duration_minutes: number;
    teacher_name: string;
    room: string;
    mode: string;
    subject_categories?: { name: string; color: string } | null;
  }
) {
  return {
    id: row.id,
    categoryId: row.category_id,
    categoryName: row.subject_categories?.name,
    categoryColor: row.subject_categories?.color,
    courseId: row.course_id ?? undefined,
    title: row.title,
    sessionType: row.session_type as "recurring" | "one_off",
    dayOfWeek: row.day_of_week ?? undefined,
    sessionDate: row.session_date ?? undefined,
    startTime: String(row.start_time).slice(0, 5),
    endTime: String(row.end_time).slice(0, 5),
    durationMinutes: row.duration_minutes,
    teacherName: row.teacher_name,
    room: row.room,
    mode: row.mode as "physical" | "online",
  };
}
