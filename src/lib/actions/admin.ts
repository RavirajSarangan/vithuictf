"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff, requireAdmin, signUpWithRole } from "@/lib/actions/auth";
import { logAdminAction } from "@/lib/audit";
import { sendStudentWelcomeEmail } from "@/lib/actions/email";
import { BRAND } from "@/lib/constants";
import type { CourseLevel, SitePublicMode } from "@/types";

export async function getStudent(id: string) {
  await requireStaff();
  const supabase = await createClient();
  const { data, error } = await supabase.from("students").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteStudent(id: string) {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase.from("students").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/students");
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function addStudent(data: {
  displayName: string;
  email: string;
  courseId: string;
  courseName: string;
  password?: string;
}) {
  await requireStaff();

  if (!data.displayName.trim()) throw new Error("Student name is required");
  if (!isValidEmail(data.email)) throw new Error("Invalid email address");

  const supabase = await createClient();
  const { data: existing } = await supabase.from("students").select("id").eq("email", data.email).maybeSingle();
  if (existing) throw new Error("A student with this email already exists");

  const tempPassword = data.password ?? `${BRAND.studentIdPrefix}-${crypto.randomUUID().slice(0, 8)}`;
  const user = await signUpWithRole(data.email, tempPassword, data.displayName, "student");
  if (!user) throw new Error("Failed to create auth user");

  const admin = createAdminClient();
  const studentId = `${BRAND.studentIdPrefix}-${Date.now()}`;
  const { data: updated, error } = await admin
    .from("students")
    .update({
      student_id: studentId,
      display_name: data.displayName,
      email: data.email,
      course_id: data.courseId,
      course_name: data.courseName,
    })
    .eq("user_id", user.id)
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  const { data: courseRow } = await admin.from("courses").select("student_count").eq("id", data.courseId).maybeSingle();
  if (courseRow) {
    await admin
      .from("courses")
      .update({ student_count: courseRow.student_count + 1 })
      .eq("id", data.courseId);
  }

  const emailResult = await sendStudentWelcomeEmail({
    displayName: data.displayName,
    studentId,
    email: data.email,
    tempPassword,
    courseName: data.courseName,
  });

  revalidatePath("/admin/students");
  return {
    id: updated.id,
    studentId,
    email: data.email,
    displayName: data.displayName,
    courseName: data.courseName,
    tempPassword: data.password ? undefined : tempPassword,
    emailSent: emailResult.emailSent,
    emailError: emailResult.error,
  };
}

export async function resendStudentWelcomeEmail(studentDbId: string) {
  await requireStaff();
  const supabase = await createClient();
  const { data: student } = await supabase.from("students").select("*").eq("id", studentDbId).maybeSingle();
  if (!student) throw new Error("Student not found");

  const tempPassword = `${BRAND.studentIdPrefix}-${crypto.randomUUID().slice(0, 8)}`;

  const { isAdminClientConfigured } = await import("@/lib/supabase/admin");
  if (isAdminClientConfigured()) {
    const admin = createAdminClient();
    const { error: updateError } = await admin.auth.admin.updateUserById(student.user_id, {
      password: tempPassword,
    });
    if (updateError) throw new Error(updateError.message);
  }

  const emailResult = await sendStudentWelcomeEmail({
    displayName: student.display_name,
    studentId: student.student_id,
    username: student.username ?? undefined,
    indexNumber: student.index_number ?? undefined,
    email: student.email,
    tempPassword,
    courseName: student.course_name ?? `${BRAND.name} Program`,
  });

  return { tempPassword, ...emailResult };
}

export async function deleteCourse(id: string) {
  await requireStaff();
  const supabase = await createClient();
  const { data: course } = await supabase.from("courses").select("student_count").eq("id", id).maybeSingle();
  if (course && course.student_count > 0) {
    throw new Error("Cannot delete a course with enrolled students");
  }
  const { error } = await supabase.from("courses").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/courses");
}

export async function addCourse(data: {
  name: string;
  category: string;
  description: string;
  durationMonths: number;
  level?: CourseLevel;
  teacherName: string;
  slug?: string;
}) {
  await requireStaff();
  const supabase = await createClient();
  const slug =
    data.slug ??
    data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const { error } = await supabase.from("courses").insert({
    name: data.name,
    category: data.category,
    description: data.description,
    duration_months: data.durationMonths,
    level: data.level ?? "Professional",
    teacher_name: data.teacherName,
    student_count: 0,
    slug,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/courses");
}

export async function updateCourse(
  id: string,
  data: {
    name: string;
    category: string;
    description: string;
    durationMonths: number;
    level?: CourseLevel;
    teacherName: string;
  }
) {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase
    .from("courses")
    .update({
      name: data.name,
      category: data.category,
      description: data.description,
      duration_months: data.durationMonths,
      level: data.level ?? "Professional",
      teacher_name: data.teacherName,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/courses");
}

export async function getCourse(id: string) {
  await requireStaff();
  const supabase = await createClient();
  const { data, error } = await supabase.from("courses").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function addResource(data: {
  title: string;
  courseId: string;
  courseName: string;
  category?: string;
  description?: string;
  type?: "pdf" | "video";
}) {
  await requireStaff();
  const supabase = await createClient();

  const { error } = await supabase.from("resources").insert({
    title: data.title,
    category: data.category ?? "notes",
    course_id: data.courseId,
    course_name: data.courseName,
    description: data.description ?? "",
    storage_path: `resources/${data.courseId}/${data.category ?? "notes"}/${Date.now()}.pdf`,
    view_only: true,
    popular: false,
    type: data.type ?? "pdf",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/resources");
}

export async function deleteResource(id: string) {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase.from("resources").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/resources");
}

export async function addPayment(data: {
  studentId: string;
  studentName: string;
  amount: number;
  status?: "paid" | "pending" | "overdue";
  method?: string;
}) {
  await requireStaff();
  const supabase = await createClient();

  const { error } = await supabase.from("payments").insert({
    student_id: data.studentId,
    student_name: data.studentName,
    amount: data.amount,
    status: data.status ?? "pending",
    method: data.method ?? "Cash",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/payments");
}

export async function issueCertificate(data: { studentId: string; studentName: string; courseId: string; courseName: string }) {
  await requireStaff();
  const supabase = await createClient();
  const verifyCode = `${BRAND.studentIdPrefix}-${crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;

  const { data: inserted, error } = await supabase
    .from("certificates")
    .insert({
      student_id: data.studentId,
      student_name: data.studentName,
      course_id: data.courseId,
      course_name: data.courseName,
      verify_code: verifyCode,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  await logAdminAction("certificate.issue", "certificate", inserted.id, { verifyCode });
  revalidatePath("/admin/certificates");
}

export async function addResult(data: {
  studentId: string;
  examTitle: string;
  subject: string;
  grade: string;
  marks: number;
  maxMarks?: number;
  rank?: number;
  term: string;
  resultDate: string;
}) {
  await requireStaff();
  const supabase = await createClient();

  const { error } = await supabase.from("results").insert({
    student_id: data.studentId,
    exam_title: data.examTitle,
    subject: data.subject,
    grade: data.grade,
    marks: data.marks,
    max_marks: data.maxMarks ?? 100,
    rank: data.rank ?? 0,
    term: data.term,
    result_date: data.resultDate,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/results");
}

export async function deleteResult(id: string) {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase.from("results").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/results");
}

export async function addTeacher(data: {
  displayName: string;
  email: string;
  subjects?: string[];
  courseIds?: string[];
  password?: string;
}) {
  await requireAdmin();

  if (!data.displayName.trim()) throw new Error("Teacher name is required");
  if (!isValidEmail(data.email)) throw new Error("Invalid email address");

  const supabase = await createClient();
  const { data: existing } = await supabase.from("teachers").select("id").eq("email", data.email).maybeSingle();
  if (existing) throw new Error("A teacher with this email already exists");

  const tempPassword = data.password ?? `${BRAND.studentIdPrefix}-${crypto.randomUUID().slice(0, 8)}`;
  const user = await signUpWithRole(data.email, tempPassword, data.displayName, "teacher");
  if (!user) throw new Error("Failed to create auth user");

  const { error } = await supabase.from("teachers").insert({
    user_id: user.id,
    display_name: data.displayName,
    email: data.email,
    subjects: data.subjects ?? [],
    course_ids: data.courseIds ?? [],
    certified: false,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/teachers");
  return { tempPassword: data.password ? undefined : tempPassword };
}

export async function deleteTeacher(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("teachers").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/teachers");
}

export async function broadcastNotification(title: string, body: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { data: profiles } = await supabase.from("profiles").select("id");
  if (!profiles?.length) return;

  const { error } = await supabase.from("notifications").insert(
    profiles.map((p) => ({
      user_id: p.id,
      title,
      body,
      type: "announcement" as const,
    }))
  );
  if (error) throw new Error(error.message);
  revalidatePath("/admin/notifications");
}

export async function markNotificationRead(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function updateSiteStats(data: {
  students: number; courses: number; satisfaction: number; resources: number;
  yearsExperience: number; certifiedTeachers: number; successRate: number;
}) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("site_stats").update({
    students: data.students,
    courses: data.courses,
    satisfaction: data.satisfaction,
    resources: data.resources,
    years_experience: data.yearsExperience,
    certified_teachers: data.certifiedTeachers,
    success_rate: data.successRate,
  }).eq("id", 1);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/admin/home");
}

function revalidateSitePublicPaths() {
  revalidatePath("/");
  revalidatePath("/rankings");
  revalidatePath("/coming-soon");
  revalidatePath("/maintenance");
  revalidatePath("/login");
  revalidatePath("/register");
  revalidatePath("/admin/home");
  revalidatePath("/dashboard");
  revalidatePath("/parent");
  revalidatePath("/verify");
}

export async function updateSitePublicMode(mode: SitePublicMode) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("platform_settings")
    .update({
      site_public_mode: mode,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) throw new Error(error.message);

  await logAdminAction("site.public_mode_update", "platform_settings", "1", {
    sitePublicMode: mode,
  });

  revalidateSitePublicPaths();
}

export async function updateMarketingComingSoon(enabled: boolean) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("platform_settings")
    .update({
      marketing_coming_soon_enabled: enabled,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) throw new Error(error.message);

  await logAdminAction("marketing.coming_soon_update", "platform_settings", "1", {
    marketingComingSoonEnabled: enabled,
  });

  revalidateSitePublicPaths();
}

export async function updateNetworkStats(data: {
  paperCentersCount: number; districtsCovered: number; passRate: number; papersWritten: number;
  headline: string; headlineTa?: string; subheadline: string; subheadlineTa?: string;
  ctaLabel: string; ctaLabelTa?: string; ctaUrl: string;
}) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("network_stats").update({
    paper_centers_count: data.paperCentersCount,
    districts_covered: data.districtsCovered,
    pass_rate: data.passRate,
    papers_written: data.papersWritten,
    headline: data.headline,
    headline_ta: data.headlineTa ?? "",
    subheadline: data.subheadline,
    subheadline_ta: data.subheadlineTa ?? "",
    cta_label: data.ctaLabel,
    cta_label_ta: data.ctaLabelTa ?? "",
    cta_url: data.ctaUrl,
  }).eq("id", 1);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/admin/home");
}

export async function updateHomeAbout(data: {
  name: string; title: string; titleTa?: string; bio: string; bioTa?: string; photoUrl: string; credentials: string;
  highlightStudents: number; highlightExperienceYears: number; ctaLabel: string; ctaUrl: string;
}) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("home_about").update({
    name: data.name,
    title: data.title,
    title_ta: data.titleTa ?? "",
    bio: data.bio,
    bio_ta: data.bioTa ?? "",
    photo_url: data.photoUrl,
    credentials: data.credentials,
    highlight_students: data.highlightStudents,
    highlight_experience_years: data.highlightExperienceYears,
    cta_label: data.ctaLabel,
    cta_url: data.ctaUrl,
  }).eq("id", 1);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/admin/home");
}

async function crudRow(table: string, action: "insert" | "delete", payload?: Record<string, unknown>, id?: string) {
  await requireAdmin();
  const supabase = await createClient();
  if (action === "insert") {
    const { error } = await supabase.from(table).insert(payload!);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from(table).delete().eq("id", id!);
    if (error) throw new Error(error.message);
  }
  revalidatePath("/");
  revalidatePath("/admin/home");
}

export async function addCompany(data: { name: string; location: string; description: string; logoUrl?: string; websiteUrl?: string; sortOrder?: number }) {
  await crudRow("companies", "insert", { name: data.name, location: data.location, description: data.description, logo_url: data.logoUrl ?? "", website_url: data.websiteUrl ?? "", sort_order: data.sortOrder ?? 0 });
}
export async function deleteCompany(id: string) { await crudRow("companies", "delete", undefined, id); }

export async function addClassProgram(data: { title: string; description: string; badge?: string; icon?: string; sortOrder?: number }) {
  await crudRow("class_programs", "insert", { title: data.title, description: data.description, badge: data.badge ?? "", icon: data.icon ?? "BookOpen", sort_order: data.sortOrder ?? 0 });
}
export async function deleteClassProgram(id: string) { await crudRow("class_programs", "delete", undefined, id); }

export async function addPaperCenter(data: { name: string; district: string; address: string; mapUrl?: string; sortOrder?: number }) {
  await crudRow("paper_centers", "insert", { name: data.name, district: data.district, address: data.address, map_url: data.mapUrl ?? "", sort_order: data.sortOrder ?? 0 });
}
export async function deletePaperCenter(id: string) { await crudRow("paper_centers", "delete", undefined, id); }

export async function addFeaturedRanking(data: { studentName: string; rankType: string; score: number; sortOrder?: number }) {
  await crudRow("featured_rankings", "insert", { student_name: data.studentName, rank_type: data.rankType, score: data.score, sort_order: data.sortOrder ?? 0 });
}
export async function deleteFeaturedRanking(id: string) { await crudRow("featured_rankings", "delete", undefined, id); }

export async function addFaq(question: string, answer: string, sortOrder = 0) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("faqs").insert({ question, answer, sort_order: sortOrder });
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/admin/home");
}
export async function deleteFaq(id: string) { await crudRow("faqs", "delete", undefined, id); }

export async function addSuccessStory(data: { name: string; course: string; achievement: string; review: string; photo?: string }) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("success_stories").insert({ ...data, photo: data.photo ?? "" });
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/admin/home");
}
export async function deleteSuccessStory(id: string) { await crudRow("success_stories", "delete", undefined, id); }

export async function uploadAdminAsset(formData: FormData): Promise<string> {
  await requireAdmin();

  const file = formData.get("file");
  const folder = String(formData.get("folder") ?? "home");

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("No file provided");
  }

  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  const admin = createAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await admin.storage.from("admin").upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });

  if (error) throw new Error(error.message);

  const { data } = admin.storage.from("admin").getPublicUrl(path);
  return data.publicUrl;
}

