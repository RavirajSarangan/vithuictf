export type UserRole =
  | "student"
  | "parent"
  | "teacher"
  | "admin"
  | "super_admin"
  | "content_manager"
  | "paper_center_staff";

export type CourseLevel = "OL" | "AL" | "University" | "Professional";

export type ResourceCategory =
  | "notes"
  | "past_papers"
  | "videos"
  | "assignments"
  | "study_guides";

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  createdAt: string;
}

export interface StudentSocialLinks {
  linkedin?: string;
  github?: string;
  twitter?: string;
  whatsapp?: string;
}

export interface Student {
  id: string;
  userId: string;
  studentId: string;
  username?: string;
  indexNumber?: string;
  nicNumber?: string;
  phone?: string;
  notifyEmail?: boolean;
  examYear?: string;
  ictGrade?: string;
  displayName: string;
  email: string;
  courseId: string;
  courseName: string;
  grade: string;
  rank: number;
  streak: number;
  points: number;
  performance: number;
  photoURL?: string;
  bio?: string;
  socialLinks?: StudentSocialLinks;
  cardPublic?: boolean;
  onboardingCompletedAt?: string | null;
  onboardingSteps?: Record<string, boolean>;
  active?: boolean;
  disabledAt?: string | null;
  createdAt?: string;
}

export interface FlipCardData {
  name: string;
  username: string;
  image?: string;
  courseName?: string;
  bio: string;
  stats: {
    points: number;
    rank: number;
    streak: number;
  };
  socialLinks?: StudentSocialLinks;
}

export interface Parent {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  linkedStudentIds: string[];
}

export interface Teacher {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  staffUsername?: string;
  subjects: string[];
  certified: boolean;
  courseIds: string[];
  active: boolean;
}

export type PeopleRosterRole =
  | "teacher"
  | "admin"
  | "super_admin"
  | "content_manager"
  | "paper_center_staff";

export type PassPaperLayout = "grid" | "list" | "folder";
export type PassPaperMedium = "sinhala" | "tamil" | "english";
export type PassPaperExamType = "ol" | "al" | "scholarship" | "other";

export interface PassPaperFolder {
  id: string;
  parentId: string | null;
  title: string;
  slug: string;
  description: string;
  iconKey: string;
  accentColor: string;
  layout: PassPaperLayout;
  sortOrder: number;
  published: boolean;
  createdAt: string;
}

export interface PassPaperItem {
  id: string;
  folderId: string;
  title: string;
  driveUrl: string;
  year: number | null;
  medium: PassPaperMedium | null;
  examType: PassPaperExamType;
  sortOrder: number;
  published: boolean;
  createdAt: string;
}

export interface PaperCenterStaff {
  id: string;
  userId: string;
  paperCenterId: string;
  paperCenterName?: string;
  centerSlug?: string;
  place?: string;
  displayName: string;
  staffUsername: string;
  email: string;
  active: boolean;
  createdAt: string;
}

export interface ExamPaperBatch {
  id: string;
  staffId: string;
  paperCenterId: string;
  staffName: string;
  centerName: string;
  place: string;
  examYear: number | null;
  medium: PassPaperMedium | null;
  examType: PassPaperExamType;
  notes: string;
  paperCount: number;
  createdAt: string;
}

export interface ExamPaperSubmission {
  id: string;
  batchId: string;
  studentName: string;
  studentIndex: string;
  storagePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

export type AttendanceStatus = "present" | "absent" | "late";
export type ClassSessionStatus = "scheduled" | "completed" | "cancelled";

export interface CourseBatch {
  id: string;
  courseId: string;
  courseName?: string;
  courseCoverImageUrl?: string;
  name: string;
  batchCode: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  classDays: string[];
  totalClasses: number;
  active: boolean;
  createdBy: string | null;
  createdAt: string;
}

export interface BatchEnrollment {
  id: string;
  batchId: string;
  studentId: string;
  enrollmentCode: string;
  joinedAt: string;
  active: boolean;
  studentName?: string;
  studentEmail?: string;
}

export interface ClassSession {
  id: string;
  batchId: string;
  sessionNumber: number;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: ClassSessionStatus;
}

export interface PeopleRosterEntry {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  staffUsername?: string;
  role: PeopleRosterRole;
  active: boolean;
  subjects?: string[];
  courseIds?: string[];
  certified?: boolean;
  paperCenterId?: string;
  paperCenterName?: string;
  sourceTable: "teachers" | "profiles" | "content_managers" | "paper_center_staff";
}

export interface Course {
  id: string;
  name: string;
  level: CourseLevel;
  teacherId: string;
  teacherName: string;
  studentCount: number;
  description: string;
  category?: string;
  durationMonths?: number;
  slug?: string;
  coverImageUrl?: string;
}

export interface Exam {
  id: string;
  title: string;
  courseId: string;
  date: string;
  subjects: string[];
}

export interface Result {
  id: string;
  studentId: string;
  examId: string;
  examTitle: string;
  subject: string;
  grade: string;
  marks: number;
  maxMarks: number;
  rank: number;
  term: string;
  date: string;
}

export interface Resource {
  id: string;
  title: string;
  category: ResourceCategory;
  courseId: string;
  courseName: string;
  description: string;
  storagePath: string;
  viewOnly: boolean;
  popular: boolean;
  type: "pdf" | "video";
  views: number;
  createdAt: string;
}

export interface Bookmark {
  id: string;
  userId: string;
  resourceId: string;
}

export interface Achievement {
  id: string;
  studentId: string;
  badgeId: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
}

export interface LeaderboardEntry {
  id: string;
  studentId: string;
  studentName: string;
  courseId: string;
  points: number;
  rank: number;
  performance: number;
  avatar?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  read: boolean;
  type: "result" | "announcement" | "achievement";
  createdAt: string;
}

export interface Payment {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  method: string;
  date: string;
}

export interface Certificate {
  id: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  issuedAt: string;
  verifyCode?: string;
  certificateNumber?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  deliveryStatus?: "pending" | "email_sent" | "whatsapp_sent" | "failed";
  imagePath?: string;
  batchId?: string;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  imageUrl: string;
  fieldConfig: import("@/lib/certificates/field-config").CertificateTemplateFieldConfig;
  isActive: boolean;
  idPrefix: string;
  idPadding: number;
  createdAt: string;
  updatedAt: string;
}

export interface CertificateBatch {
  id: string;
  name: string;
  templateId: string | null;
  issueDate: string;
  createdBy: string | null;
  status: "draft" | "processing" | "completed" | "failed";
  totalCount: number;
  successCount: number;
  errorLog: Array<{ rowIndex: number; error: string }>;
  createdAt: string;
}

export interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  locale: string;
  status: "new" | "read" | "replied";
  createdAt: string;
}

export interface SuccessStory {
  id: string;
  name: string;
  course: string;
  achievement: string;
  review: string;
  photo: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  questionTa?: string;
  answerTa?: string;
  questionSi?: string;
  answerSi?: string;
  category?: string;
  targetKeyword?: string;
}


export interface Company {
  id: string;
  name: string;
  location: string;
  description: string;
  descriptionTa?: string;
  logoUrl: string;
  websiteUrl: string;
  sortOrder: number;
  isActive: boolean;
}

export interface ClassProgram {
  id: string;
  title: string;
  titleTa?: string;
  description: string;
  descriptionTa?: string;
  badge: string;
  icon: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface PaperCenter {
  id: string;
  name: string;
  slug: string;
  district: string;
  address: string;
  mapUrl: string;
  mapX?: number;
  mapY?: number;
  sortOrder: number;
  isActive: boolean;
}

export interface NetworkStats {
  paperCentersCount: number;
  districtsCovered: number;
  passRate: number;
  papersWritten: number;
  headline: string;
  headlineTa?: string;
  subheadline: string;
  subheadlineTa?: string;
  ctaLabel: string;
  ctaLabelTa?: string;
  ctaUrl: string;
}

export interface FeaturedRanking {
  id: string;
  studentName: string;
  rankType: "island" | "district" | "class";
  score: number;
  sortOrder: number;
  isActive: boolean;
}

export interface HomeAbout {
  name: string;
  title: string;
  titleTa?: string;
  bio: string;
  bioTa?: string;
  photoUrl: string;
  credentials: string;
  highlightStudents: number;
  highlightExperienceYears: number;
  ctaLabel: string;
  ctaUrl: string;
}

export type MarketingAnnouncementContentType =
  | "image_only"
  | "text_only"
  | "text_image"
  | "text_image_link";

export type MarketingAnnouncementDisplayStyle =
  | "minimal"
  | "card"
  | "image_hero"
  | "promo"
  | "banner";

export interface MarketingAnnouncement {
  id: string;
  title: string;
  body: string;
  imageUrl: string;
  ctaLabel: string;
  ctaUrl: string;
  contentType: MarketingAnnouncementContentType;
  displayStyle: MarketingAnnouncementDisplayStyle;
  startsAt: string | null;
  endsAt: string | null;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SiteStats {
  students: number;
  courses: number;
  satisfaction: number;
  resources: number;
  yearsExperience: number;
  certifiedTeachers: number;
  successRate: number;
}

export type SitePublicMode = "live" | "coming_soon" | "maintenance";

export interface BrandLogoSettings {
  nav: {
    widthRem: number;
    heightRem: number;
    widthRemSm: number;
    heightRemSm: number;
    scale: number;
    scaleSm: number;
  };
  footer: {
    widthRem: number;
    heightRem: number;
    widthRemSm: number;
    heightRemSm: number;
  };
}

export interface PlatformSettings {
  onlinePaymentsEnabled: boolean;
  defaultInstituteFeeLkr: number;
  marketingComingSoonEnabled: boolean;
  sitePublicMode: SitePublicMode;
  brandLogo: BrandLogoSettings;
  updatedAt: string;
}

export interface ActivityItem {
  id: string;
  studentId: string;
  title: string;
  description: string;
  type: string;
  createdAt: string;
}

export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
}

export type SessionType = "recurring" | "one_off";
export type SessionMode = "physical" | "online";

export interface SubjectCategory {
  id: string;
  name: string;
  slug: string;
  color: string;
  sortOrder: number;
  active: boolean;
}

export interface CalendarSession {
  id: string;
  categoryId: string;
  categoryName?: string;
  categoryColor?: string;
  courseId?: string;
  title: string;
  sessionType: SessionType;
  dayOfWeek?: number;
  sessionDate?: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  teacherName: string;
  room: string;
  mode: SessionMode;
}

export type BlogPostStatus = "draft" | "published";

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  categoryId: string | null;
  categoryName?: string;
  categorySlug?: string;
  status: BlogPostStatus;
  isFeatured: boolean;
  seoTitle: string;
  seoDescription: string;
  tags: string[];
  authorName: string;
  readingTimeMinutes: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type SocialPerformance = "up" | "down" | "stable";

export interface ContentManager {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  active: boolean;
  createdAt: string;
}

export interface SocialPlatform {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
}

export interface SocialContentType {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
}

export interface SocialTrackingWeek {
  id: string;
  weekStart: string;
  createdAt: string;
}

export interface SocialContentEntry {
  id: string;
  weekId: string;
  contentTypeId: string;
  contentTypeSlug?: string;
  dayOfWeek: number;
  posted: boolean;
  /** Number of posts/posters for this content type on this day. */
  postCount: number;
  updatedBy?: string;
  updatedAt: string;
}

export interface SocialFollowerMetric {
  id: string;
  weekId: string;
  platformId: string;
  platformSlug?: string;
  platformName?: string;
  previousCount: number;
  currentCount: number;
  performance: SocialPerformance | null;
  updatedBy?: string;
  updatedAt: string;
}

export interface WeeklyTrackingSummary {
  totalUploads: number;
  youtubeVideos: number;
  youtubeShorts: number;
  tiktokVideos: number;
  instaReels: number;
}

export interface FollowerHistoryPoint {
  weekStart: string;
  platformSlug: string;
  platformName: string;
  currentCount: number;
}
