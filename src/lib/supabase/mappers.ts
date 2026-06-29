import type {
  Achievement,
  ActivityItem,
  BatchEnrollment,
  BatchWhatsAppLogEntry,
  BlogPostStatus,
  Certificate,
  ClassSession,
  ClassSessionStatus,
  ContactInquiry,
  ContentManager,
  ExamPaperBatch,
  ExamPaperSubmission,
  PaperCenterStaff,
  Course,
  CourseBatch,
  Exam,
  FAQ,
  LeaderboardEntry,
  Notification,
  Parent,
  PassPaperExamType,
  PassPaperFolder,
  PassPaperItem,
  PassPaperLayout,
  PassPaperMedium,
  Payment,
  PlatformSettings,
  Resource,
  Result,
  SessionCharge,
  StudentBillingSummary,
  SiteStats,
  SocialContentEntry,
  SocialContentType,
  SocialFollowerMetric,
  SocialPerformance,
  SocialPlatform,
  SocialTrackingWeek,
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
    schoolName: row.school_name ?? undefined,
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
    active: (row as StudentRow & { active?: boolean }).active ?? true,
    disabledAt: (row as StudentRow & { disabled_at?: string | null }).disabled_at ?? null,
    createdAt: row.created_at,
    registrationStatus:
      ((row as StudentRow & { registration_status?: string }).registration_status as
        | "pending"
        | "approved"
        | "rejected"
        | undefined) ?? "approved",
    registrationReviewedAt:
      (row as StudentRow & { registration_reviewed_at?: string | null }).registration_reviewed_at ??
      null,
    registrationReviewedBy:
      (row as StudentRow & { registration_reviewed_by?: string | null }).registration_reviewed_by ??
      null,
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
    coverImageUrl: row.cover_image_url || undefined,
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
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
  };
}

export function mapTeacher(row: Database["public"]["Tables"]["teachers"]["Row"]): Teacher {
  return {
    id: row.id,
    userId: row.user_id,
    displayName: row.display_name,
    email: row.email,
    staffUsername: row.staff_username ?? undefined,
    subjects: row.subjects,
    certified: row.certified,
    courseIds: row.course_ids ?? [],
    active: row.active ?? true,
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

export function mapSessionCharge(
  row: Database["public"]["Tables"]["session_charges"]["Row"] & {
    courses?: { name: string } | null;
    course_batches?: { name: string } | null;
    class_sessions?: { session_number: number; scheduled_date: string } | null;
  }
): SessionCharge {
  return {
    id: row.id,
    studentId: row.student_id,
    sessionId: row.session_id,
    batchId: row.batch_id,
    courseId: row.course_id,
    courseName: row.courses?.name,
    batchName: row.course_batches?.name,
    sessionNumber: row.class_sessions?.session_number,
    scheduledDate: row.class_sessions?.scheduled_date,
    attendanceRecordId: row.attendance_record_id,
    amountLkr: Number(row.amount_lkr),
    status: row.status,
    billingMonth: row.billing_month,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapStudentBillingSummary(row: {
  student_id: string;
  course_id: string;
  course_name: string;
  sessions_billed: number;
  total_charged_lkr: number;
  total_paid_lkr: number;
  total_outstanding_lkr: number;
  students?: { display_name: string } | null;
}): StudentBillingSummary {
  return {
    studentId: row.student_id,
    studentName: row.students?.display_name,
    courseId: row.course_id,
    courseName: row.course_name,
    sessionsBilled: Number(row.sessions_billed),
    totalChargedLkr: Number(row.total_charged_lkr),
    totalPaidLkr: Number(row.total_paid_lkr),
    totalOutstandingLkr: Number(row.total_outstanding_lkr),
  };
}

export function mapCertificate(row: Database["public"]["Tables"]["certificates"]["Row"]): Certificate {
  const extended = row as Database["public"]["Tables"]["certificates"]["Row"] & {
    verify_code?: string;
    certificate_number?: string;
    recipient_email?: string;
    recipient_phone?: string;
    delivery_status?: string;
    image_path?: string;
    batch_id?: string;
    student_id?: string | null;
    course_id?: string | null;
  };
  return {
    id: row.id,
    studentId: extended.student_id ?? "",
    studentName: row.student_name,
    courseId: extended.course_id ?? "",
    courseName: row.course_name,
    issuedAt: row.issued_at,
    verifyCode: extended.verify_code,
    certificateNumber: extended.certificate_number,
    recipientEmail: extended.recipient_email,
    recipientPhone: extended.recipient_phone,
    deliveryStatus: (extended.delivery_status ?? "pending") as Certificate["deliveryStatus"],
    imagePath: extended.image_path,
    batchId: extended.batch_id ?? undefined,
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
    slug: row.slug ?? row.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    district: row.district,
    address: row.address,
    mapUrl: row.map_url,
    mapX: row.map_x ?? undefined,
    mapY: row.map_y ?? undefined,
    grades: (row.grades ?? []).filter((grade): grade is import("@/types").PaperCenterGrade =>
      grade === "10" || grade === "11" || grade === "12" || grade === "13"
    ),
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
  per_class_fee_lkr?: number;
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
    perClassFeeLkr: Number(row.per_class_fee_lkr ?? 1200),
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
  view_count?: number | null;
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
    viewCount: row.view_count ?? 0,
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

export function mapContentManager(row: {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  active: boolean;
  created_at: string;
}): ContentManager {
  return {
    id: row.id,
    userId: row.user_id,
    displayName: row.display_name,
    email: row.email,
    active: row.active,
    createdAt: row.created_at,
  };
}

export function mapPaperCenterStaff(row: {
  id: string;
  user_id: string;
  paper_center_id: string;
  display_name: string;
  staff_username: string;
  email: string;
  staff_role?: string;
  whatsapp?: string;
  grades?: string[];
  active: boolean;
  created_at: string;
  paper_centers?: { name: string; district?: string; address?: string; slug?: string } | null;
}): PaperCenterStaff {
  const center = row.paper_centers;
  const place = center ? [center.district, center.address].filter(Boolean).join(" · ") : undefined;
  const staffRole = row.staff_role === "in_charge" ? "in_charge" : "staff";
  return {
    id: row.id,
    userId: row.user_id,
    paperCenterId: row.paper_center_id,
    paperCenterName: center?.name,
    centerSlug: center?.slug,
    place,
    displayName: row.display_name,
    staffUsername: row.staff_username,
    email: row.email,
    staffRole,
    whatsapp: row.whatsapp ?? "",
    grades: (row.grades ?? []).filter((grade): grade is import("@/types").PaperCenterGrade =>
      grade === "10" || grade === "11" || grade === "12" || grade === "13"
    ),
    active: row.active,
    createdAt: row.created_at,
  };
}

export function mapExamPaperBatch(row: {
  id: string;
  staff_id: string;
  paper_center_id: string;
  staff_name: string;
  center_name: string;
  place: string;
  exam_year: number | null;
  medium: string | null;
  exam_type: string;
  notes: string;
  paper_count: number;
  created_at: string;
}): ExamPaperBatch {
  return {
    id: row.id,
    staffId: row.staff_id,
    paperCenterId: row.paper_center_id,
    staffName: row.staff_name,
    centerName: row.center_name,
    place: row.place,
    examYear: row.exam_year,
    medium: row.medium as ExamPaperBatch["medium"],
    examType: row.exam_type as ExamPaperBatch["examType"],
    notes: row.notes,
    paperCount: row.paper_count,
    createdAt: row.created_at,
  };
}

export function mapExamPaperSubmission(row: {
  id: string;
  batch_id: string;
  student_name: string;
  student_index: string;
  storage_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}): ExamPaperSubmission {
  return {
    id: row.id,
    batchId: row.batch_id,
    studentName: row.student_name,
    studentIndex: row.student_index,
    storagePath: row.storage_path,
    fileName: row.file_name,
    fileSize: row.file_size,
    mimeType: row.mime_type,
    createdAt: row.created_at,
  };
}

export function mapSocialPlatform(row: {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
}): SocialPlatform {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    sortOrder: row.sort_order,
  };
}

export function mapSocialContentType(row: {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
}): SocialContentType {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    sortOrder: row.sort_order,
  };
}

export function mapSocialTrackingWeek(row: {
  id: string;
  week_start: string;
  created_at: string;
}): SocialTrackingWeek {
  return {
    id: row.id,
    weekStart: row.week_start,
    createdAt: row.created_at,
  };
}

export function mapSocialContentEntry(row: {
  id: string;
  week_id: string;
  content_type_id: string;
  day_of_week: number;
  posted: boolean;
  post_count?: number;
  updated_by: string | null;
  updated_at: string;
  social_content_types?: { slug: string } | null;
}): SocialContentEntry {
  const postCount = row.post_count ?? (row.posted ? 1 : 0);
  return {
    id: row.id,
    weekId: row.week_id,
    contentTypeId: row.content_type_id,
    contentTypeSlug: row.social_content_types?.slug,
    dayOfWeek: row.day_of_week,
    posted: row.posted || postCount > 0,
    postCount,
    updatedBy: row.updated_by ?? undefined,
    updatedAt: row.updated_at,
  };
}

export function mapSocialFollowerMetric(row: {
  id: string;
  week_id: string;
  platform_id: string;
  previous_count: number;
  current_count: number;
  performance: SocialPerformance | null;
  updated_by: string | null;
  updated_at: string;
  social_platforms?: { slug: string; name: string } | null;
}): SocialFollowerMetric {
  return {
    id: row.id,
    weekId: row.week_id,
    platformId: row.platform_id,
    platformSlug: row.social_platforms?.slug,
    platformName: row.social_platforms?.name,
    previousCount: row.previous_count,
    currentCount: row.current_count,
    performance: row.performance,
    updatedBy: row.updated_by ?? undefined,
    updatedAt: row.updated_at,
  };
}

export function mapCourseBatch(row: {
  id: string;
  course_id: string;
  name: string;
  batch_code: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  class_days: string[];
  total_classes: number;
  zoom_link?: string | null;
  active: boolean;
  created_by: string | null;
  created_at: string;
  courses?: { name: string; cover_image_url?: string } | null;
}): CourseBatch {
  return {
    id: row.id,
    courseId: row.course_id,
    courseName: row.courses?.name,
    courseCoverImageUrl: row.courses?.cover_image_url || undefined,
    name: row.name,
    batchCode: row.batch_code,
    startDate: row.start_date,
    endDate: row.end_date,
    startTime: row.start_time,
    endTime: row.end_time,
    classDays: row.class_days ?? [],
    totalClasses: row.total_classes,
    zoomLink: row.zoom_link ?? null,
    active: row.active,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export function mapBatchEnrollment(row: {
  id: string;
  batch_id: string;
  student_id: string;
  enrollment_code: string;
  joined_at: string;
  active: boolean;
  students?: { display_name: string; email: string } | null;
}): BatchEnrollment {
  return {
    id: row.id,
    batchId: row.batch_id,
    studentId: row.student_id,
    enrollmentCode: row.enrollment_code,
    joinedAt: row.joined_at,
    active: row.active,
    studentName: row.students?.display_name,
    studentEmail: row.students?.email,
  };
}

export function mapClassSession(row: {
  id: string;
  batch_id: string;
  session_number: number;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  status: ClassSessionStatus;
  zoom_link?: string | null;
  canva_slide_url?: string | null;
  canva_slide_title?: string | null;
  cancel_reason?: string | null;
  cancelled_at?: string | null;
  course_batches?: { name: string; batch_code: string } | { name: string; batch_code: string }[] | null;
}): ClassSession {
  const batchRaw = row.course_batches;
  const batch = Array.isArray(batchRaw) ? batchRaw[0] : batchRaw;
  return {
    id: row.id,
    batchId: row.batch_id,
    sessionNumber: row.session_number,
    scheduledDate: row.scheduled_date,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status,
    zoomLink: row.zoom_link ?? null,
    canvaSlideUrl: row.canva_slide_url ?? null,
    canvaSlideTitle: row.canva_slide_title ?? null,
    cancelReason: row.cancel_reason ?? null,
    cancelledAt: row.cancelled_at ?? null,
    batchName: batch?.name,
    batchCode: batch?.batch_code,
  };
}

type BatchWhatsAppLogRow = Database["public"]["Tables"]["batch_whatsapp_log"]["Row"];

export function mapBatchWhatsAppLog(
  row: BatchWhatsAppLogRow & { students?: { full_name: string } | { full_name: string }[] | null }
): BatchWhatsAppLogEntry {
  const studentRaw = row.students;
  const student = Array.isArray(studentRaw) ? studentRaw[0] : studentRaw;
  return {
    id: row.id,
    batchId: row.batch_id,
    sessionId: row.session_id,
    studentId: row.student_id,
    paperCenterId: row.paper_center_id,
    paperCenterStaffId: row.paper_center_staff_id,
    phone: row.phone,
    messageType: row.message_type,
    messageTitle: row.message_title,
    messageBody: row.message_body,
    status: row.status,
    providerMessageId: row.provider_message_id,
    error: row.error,
    createdAt: row.created_at,
    studentName: student?.full_name,
  };
}

export function mapPassPaperFolder(row: {
  id: string;
  parent_id: string | null;
  title: string;
  slug: string;
  description: string;
  icon_key: string;
  accent_color: string;
  layout: PassPaperLayout;
  sort_order: number;
  published: boolean;
  created_at: string;
}): PassPaperFolder {
  return {
    id: row.id,
    parentId: row.parent_id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    iconKey: row.icon_key,
    accentColor: row.accent_color,
    layout: row.layout,
    sortOrder: row.sort_order,
    published: row.published,
    createdAt: row.created_at,
  };
}

export function mapPassPaperItem(row: {
  id: string;
  folder_id: string;
  title: string;
  drive_url: string;
  year: number | null;
  medium: PassPaperMedium | null;
  exam_type: PassPaperExamType;
  sort_order: number;
  published: boolean;
  created_at: string;
}): PassPaperItem {
  return {
    id: row.id,
    folderId: row.folder_id,
    title: row.title,
    driveUrl: row.drive_url,
    year: row.year,
    medium: row.medium,
    examType: row.exam_type,
    sortOrder: row.sort_order,
    published: row.published,
    createdAt: row.created_at,
  };
}
