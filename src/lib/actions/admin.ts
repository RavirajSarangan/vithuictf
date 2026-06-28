"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import { requireStaff, requireAdmin, requireSuperAdmin, signUpWithRole, getSessionProfile } from "@/lib/actions/auth";
import { logAdminAction } from "@/lib/audit";
import { sendStaffWelcomeEmail, sendStudentWelcomeEmail } from "@/lib/actions/email";
import { BRAND } from "@/lib/constants";
import {
  revalidateMarketingPaths,
  revalidateSitePublicPaths,
  revalidateStudentPortalPaths,
  revalidateBlogPaths,
  revalidateCoursePaths,
} from "@/lib/revalidation-paths";
import { actionFailure, actionSuccess, formatAccountRole, type ActionResult } from "@/lib/actions/action-result";
import { clearSitePublicModeCache } from "@/lib/site-access";
import { slugifyPaperCenterName } from "@/lib/paper-center-slug";
import { computeReadingTimeMinutes } from "@/lib/blog/reading-time";
import { slugifyBlogTitle, validateBlogSlug } from "@/lib/blog/slug";
import type { CourseLevel, MarketingAnnouncementContentType, MarketingAnnouncementDisplayStyle, SitePublicMode, BrandLogoSettings, BlogPostStatus, UserRole } from "@/types";
import { validateBrandLogoSettings } from "@/lib/brand-logo-settings";
import { deriveStaffUsername } from "@/lib/staff-username";
import { USERNAME_PATTERN } from "@/lib/validation/register-student";

const PEOPLE_PATHS = ["/admin/people", "/admin/staff", "/admin/content-team"] as const;

function revalidatePeoplePaths() {
  for (const path of PEOPLE_PATHS) {
    revalidatePath(path);
  }
}

async function getStaffCourseWriteClient(profile: { role: UserRole }) {
  const { isAdminClientConfigured } = await import("@/lib/supabase/admin");
  if (profile.role === "super_admin" && isAdminClientConfigured()) {
    return createAdminClient();
  }
  return createClient();
}

async function syncAuthRole(userId: string, role: UserRole, displayName?: string) {
  const admin = createAdminClient();
  const { error: authError } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role },
    ...(displayName ? { user_metadata: { display_name: displayName } } : {}),
  });
  if (authError) throw new Error(authError.message);
}

async function setAuthBan(userId: string, banned: boolean) {
  try {
    const admin = createAdminClient();
    await admin.auth.admin.updateUserById(userId, {
      ban_duration: banned ? "876000h" : "none",
    });
  } catch {
    // Ban API may fail in dev without service role
  }
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

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
  revalidateStudentPortalPaths();
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
  revalidateStudentPortalPaths();
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

export async function deleteCourse(id: string): Promise<ActionResult> {
  try {
    const profile = await requireStaff();
    const supabase = await getStaffCourseWriteClient(profile);

    const { data: teachers } = await supabase.from("teachers").select("id, course_ids").contains("course_ids", [id]);
    if (teachers?.length) {
      for (const teacher of teachers) {
        const nextCourseIds = (teacher.course_ids ?? []).filter((courseId: string) => courseId !== id);
        const { error: teacherError } = await supabase
          .from("teachers")
          .update({ course_ids: nextCourseIds })
          .eq("id", teacher.id);
        if (teacherError) return actionFailure(teacherError, "Delete failed");
      }
    }

    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) return actionFailure(error, "Delete failed");
    revalidateCoursePaths();
    return actionSuccess();
  } catch (error) {
    return actionFailure(error, "Delete failed");
  }
}

export async function addCourse(data: {
  name: string;
  category: string;
  description: string;
  durationMonths: number;
  level?: CourseLevel;
  teacherName: string;
  slug?: string;
  coverImageUrl?: string;
}): Promise<ActionResult> {
  try {
    const profile = await requireStaff();
    const supabase = await getStaffCourseWriteClient(profile);
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
      cover_image_url: data.coverImageUrl?.trim() ?? "",
    });
    if (error) return actionFailure(error, "Failed to add course");
    revalidateCoursePaths();
    return actionSuccess();
  } catch (error) {
    return actionFailure(error, "Failed to add course");
  }
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
    coverImageUrl?: string;
  }
): Promise<ActionResult> {
  try {
    const profile = await requireStaff();
    const supabase = await getStaffCourseWriteClient(profile);
    const { error } = await supabase
      .from("courses")
      .update({
        name: data.name,
        category: data.category,
        description: data.description,
        duration_months: data.durationMonths,
        level: data.level ?? "Professional",
        teacher_name: data.teacherName,
        cover_image_url: data.coverImageUrl?.trim() ?? "",
      })
      .eq("id", id);
    if (error) return actionFailure(error, "Failed to update course");
    revalidateCoursePaths();
    return actionSuccess();
  } catch (error) {
    return actionFailure(error, "Failed to update course");
  }
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
  revalidateStudentPortalPaths();
}

export async function deleteResource(id: string) {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase.from("resources").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/resources");
  revalidateStudentPortalPaths();
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
  revalidateStudentPortalPaths();
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
  revalidateStudentPortalPaths();
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
  revalidateStudentPortalPaths();
}

export async function deleteResult(id: string) {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase.from("results").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/results");
  revalidateStudentPortalPaths();
}

export async function addStaffMember(data: {
  displayName: string;
  email: string;
  staffUsername?: string;
  subjects?: string[];
  courseIds?: string[];
  password?: string;
}): Promise<
  ActionResult<{
    tempPassword?: string;
    emailSent: boolean;
    emailError?: string;
  }>
> {
  try {
    await requireAdmin();

    if (!isAdminClientConfigured()) {
      return {
        ok: false,
        error: "Account creation is not configured. Contact support to set up the service role key.",
      };
    }

    if (!data.displayName.trim()) {
      return { ok: false, error: "Staff name is required" };
    }
    if (!isValidEmail(data.email)) {
      return { ok: false, error: "Invalid email address" };
    }
    if (data.password !== undefined && data.password.length < 8) {
      return { ok: false, error: "Password must be at least 8 characters" };
    }

    const supabase = await createClient();
    const admin = createAdminClient();
    const normalizedEmail = data.email.trim().toLowerCase();

    const { data: existingProfile } = await admin
      .from("profiles")
      .select("role")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existingProfile) {
      return {
        ok: false,
        error: `This email is already registered as ${formatAccountRole(existingProfile.role)}. Use a different email for staff — do not reuse an admin login email.`,
      };
    }

    let staffUsername: string;
    try {
      staffUsername = deriveStaffUsername(normalizedEmail, data.displayName, data.staffUsername);
    } catch (error) {
      return actionFailure(error, "Invalid staff username");
    }

    const { data: existing } = await supabase
      .from("teachers")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();
    if (existing) {
      return { ok: false, error: "A staff member with this email already exists" };
    }

    const { data: usernameTaken } = await supabase
      .from("teachers")
      .select("id")
      .eq("staff_username", staffUsername)
      .maybeSingle();
    if (usernameTaken) {
      return { ok: false, error: "This staff username is already taken. Choose another." };
    }

    const tempPassword = data.password ?? `${BRAND.studentIdPrefix}-${crypto.randomUUID().slice(0, 8)}`;
    const user = await signUpWithRole(normalizedEmail, tempPassword, data.displayName, "teacher");
    if (!user) {
      return { ok: false, error: "Failed to create auth user" };
    }

    const { error } = await supabase.from("teachers").insert({
      user_id: user.id,
      display_name: data.displayName.trim(),
      email: normalizedEmail,
      staff_username: staffUsername,
      subjects: data.subjects ?? [],
      course_ids: data.courseIds ?? [],
      certified: false,
      active: true,
    });

    if (error) {
      try {
        await admin.auth.admin.deleteUser(user.id);
      } catch {
        // Best-effort cleanup if teacher row insert fails
      }
      return { ok: false, error: error.message };
    }

    const emailResult = await sendStaffWelcomeEmail({
      displayName: data.displayName.trim(),
      staffUsername,
      email: normalizedEmail,
      password: tempPassword,
      adminSetPassword: Boolean(data.password),
    });

    revalidatePeoplePaths();
    return {
      ok: true,
      tempPassword: data.password ? undefined : tempPassword,
      emailSent: emailResult.emailSent,
      emailError: emailResult.error,
    };
  } catch (error) {
    return actionFailure(error, "Failed to add staff member");
  }
}

/** @deprecated Use addStaffMember */
export async function addTeacher(data: Parameters<typeof addStaffMember>[0]) {
  return addStaffMember(data);
}

export async function deleteStaffMember(id: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { data: staff } = await supabase
    .from("teachers")
    .select("user_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("teachers").delete().eq("id", id);
  if (error) throw new Error(error.message);

  if (staff?.user_id) {
    try {
      const admin = createAdminClient();
      await admin.auth.admin.deleteUser(staff.user_id);
    } catch {
      // Profile cascade may still remove linked data
    }
  }

  revalidatePeoplePaths();
}

/** @deprecated Use deleteStaffMember */
export async function deleteTeacher(id: string) {
  return deleteStaffMember(id);
}

export async function updateStaffMember(
  id: string,
  data: {
    displayName: string;
    staffUsername?: string;
    subjects?: string[];
    courseIds?: string[];
    certified?: boolean;
  }
) {
  await requireAdmin();
  if (!data.displayName.trim()) throw new Error("Staff name is required");

  const supabase = await createClient();
  const patch: {
    display_name: string;
    course_ids: string[];
    certified: boolean;
    subjects?: string[];
    staff_username?: string;
  } = {
    display_name: data.displayName.trim(),
    course_ids: data.courseIds ?? [],
    certified: data.certified ?? false,
  };
  if (data.subjects !== undefined) {
    patch.subjects = data.subjects;
  }
  if (data.staffUsername !== undefined) {
    const normalized = data.staffUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (!USERNAME_PATTERN.test(normalized)) {
      throw new Error("Enter a valid staff username (3–20 letters, numbers, or underscores).");
    }
    const { data: taken } = await supabase
      .from("teachers")
      .select("id")
      .eq("staff_username", normalized)
      .neq("id", id)
      .maybeSingle();
    if (taken) {
      throw new Error("This staff username is already taken. Choose another.");
    }
    patch.staff_username = normalized;
  }

  const { data: staff, error } = await supabase
    .from("teachers")
    .update(patch)
    .eq("id", id)
    .select("user_id")
    .single();

  if (error) throw new Error(error.message);

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ display_name: data.displayName.trim() })
    .eq("id", staff.user_id);
  if (profileError) throw new Error(profileError.message);

  revalidatePeoplePaths();
}

export async function setStaffMemberActive(id: string, active: boolean) {
  await requireAdmin();
  const supabase = await createClient();

  const { data: staff, error } = await supabase
    .from("teachers")
    .update({ active })
    .eq("id", id)
    .select("user_id")
    .single();

  if (error) throw new Error(error.message);
  await setAuthBan(staff.user_id, !active);
  revalidatePeoplePaths();
}

export async function promoteTeacherToAdmin(id: string) {
  await requireSuperAdmin();
  const supabase = await createClient();

  const { data: staff } = await supabase
    .from("teachers")
    .select("user_id, display_name, email")
    .eq("id", id)
    .maybeSingle();

  if (!staff) throw new Error("Staff member not found");

  const { error: roleError } = await supabase
    .from("profiles")
    .update({ role: "admin", display_name: staff.display_name })
    .eq("id", staff.user_id);
  if (roleError) throw new Error(roleError.message);

  await syncAuthRole(staff.user_id, "admin", staff.display_name);

  const { error: deleteError } = await supabase.from("teachers").delete().eq("id", id);
  if (deleteError) throw new Error(deleteError.message);

  revalidatePeoplePaths();
}

export async function addAdmin(data: {
  displayName: string;
  email: string;
  password?: string;
}): Promise<ActionResult<{ tempPassword?: string }>> {
  try {
    await requireAdmin();

    if (!isAdminClientConfigured()) {
      return {
        ok: false,
        error: "Account creation is not configured. Contact support to set up the service role key.",
      };
    }

    if (!data.displayName.trim()) return { ok: false, error: "Name is required" };
    if (!isValidEmail(data.email)) return { ok: false, error: "Invalid email address" };
    if (data.password !== undefined && data.password.length < 8) {
      return { ok: false, error: "Password must be at least 8 characters" };
    }

    const normalizedEmail = data.email.trim().toLowerCase();
    const supabase = await createClient();
    const { data: existing } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existing) {
      return {
        ok: false,
        error: `This email is already registered as ${formatAccountRole(existing.role)}.`,
      };
    }

    const tempPassword = data.password ?? `Admin-${crypto.randomUUID().slice(0, 8)}`;
    const user = await signUpWithRole(normalizedEmail, tempPassword, data.displayName, "admin");
    if (!user) return { ok: false, error: "Failed to create admin user" };

    revalidatePeoplePaths();
    return { ok: true, tempPassword: data.password ? undefined : tempPassword };
  } catch (error) {
    return actionFailure(error, "Failed to add administrator");
  }
}

export async function demoteAdminToTeacher(
  userId: string,
  data?: { subjects?: string[]; courseIds?: string[] }
) {
  await requireSuperAdmin();
  const session = await getSessionProfile();
  if (session?.id === userId) throw new Error("You cannot demote your own account");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, display_name, role")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    throw new Error("User not found");
  }
  if (profile.role === "super_admin") {
    throw new Error("Cannot demote a super administrator");
  }
  if (profile.role !== "admin") {
    throw new Error("User is not an administrator");
  }

  const { data: existingTeacher } = await supabase
    .from("teachers")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (existingTeacher) throw new Error("Teacher record already exists for this user");

  const { error: roleError } = await supabase
    .from("profiles")
    .update({ role: "teacher" })
    .eq("id", userId);
  if (roleError) throw new Error(roleError.message);

  await syncAuthRole(userId, "teacher", profile.display_name);

  const staffUsername = deriveStaffUsername(profile.email, profile.display_name);

  const { error: insertError } = await supabase.from("teachers").insert({
    user_id: userId,
    display_name: profile.display_name,
    email: profile.email,
    staff_username: staffUsername,
    subjects: data?.subjects ?? [],
    course_ids: data?.courseIds ?? [],
    certified: false,
    active: true,
  });
  if (insertError) throw new Error(insertError.message);

  revalidatePeoplePaths();
}

export async function deleteAdmin(userId: string) {
  await requireSuperAdmin();
  const session = await getSessionProfile();
  if (session?.id === userId) throw new Error("You cannot delete your own account");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    throw new Error("User not found");
  }
  if (profile.role === "super_admin") {
    throw new Error("Cannot delete a super administrator");
  }
  if (profile.role !== "admin") {
    throw new Error("User is not an administrator");
  }

  try {
    const admin = createAdminClient();
    await admin.auth.admin.deleteUser(userId);
  } catch {
    const { error } = await supabase.from("profiles").delete().eq("id", userId);
    if (error) throw new Error(error.message);
  }

  revalidatePeoplePaths();
}

export async function resetAdminPassword(userId: string, newPassword?: string) {
  await requireSuperAdmin();

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, display_name, role")
    .eq("id", userId)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    throw new Error("Administrator not found");
  }

  const tempPassword = newPassword ?? `Admin-${crypto.randomUUID().slice(0, 8)}`;
  if (tempPassword.length < 8) throw new Error("Password must be at least 8 characters");

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    password: tempPassword,
  });
  if (error) throw new Error(error.message);

  return { tempPassword: newPassword ? undefined : tempPassword, email: profile.email };
}

export async function resetStaffPassword(id: string, newPassword?: string) {
  await requireAdmin();

  const supabase = await createClient();
  const { data: staff } = await supabase
    .from("teachers")
    .select("user_id, display_name, email, staff_username")
    .eq("id", id)
    .maybeSingle();

  if (!staff) throw new Error("Staff member not found");

  const tempPassword = newPassword ?? `${BRAND.studentIdPrefix}-${crypto.randomUUID().slice(0, 8)}`;
  if (tempPassword.length < 8) throw new Error("Password must be at least 8 characters");

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(staff.user_id, {
    password: tempPassword,
  });
  if (error) throw new Error(error.message);

  const staffUsername = staff.staff_username ?? staff.email.split("@")[0] ?? "staff";
  const emailResult = await sendStaffWelcomeEmail({
    displayName: staff.display_name,
    staffUsername,
    email: staff.email,
    password: tempPassword,
    passwordReset: true,
    adminSetPassword: Boolean(newPassword),
  });

  return {
    tempPassword: newPassword ? undefined : tempPassword,
    email: staff.email,
    emailSent: emailResult.emailSent,
    emailError: emailResult.error,
  };
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
  revalidateMarketingPaths();
  revalidatePath("/admin/home");
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

  clearSitePublicModeCache();
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

  clearSitePublicModeCache();
  revalidateSitePublicPaths();
}

export async function updateBrandLogoSettings(settings: BrandLogoSettings) {
  await requireAdmin();
  const validated = validateBrandLogoSettings(settings);
  const supabase = await createClient();
  const { error } = await supabase
    .from("platform_settings")
    .update({
      brand_logo_settings: validated,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) throw new Error(error.message);

  await logAdminAction("brand.logo_settings_update", "platform_settings", "1", {
    ...validated,
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
  revalidateMarketingPaths();
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
  revalidateMarketingPaths();
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
  revalidateMarketingPaths();
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
  const slug = slugifyPaperCenterName(data.name);
  await crudRow("paper_centers", "insert", {
    name: data.name,
    slug,
    district: data.district,
    address: data.address,
    map_url: data.mapUrl ?? "",
    sort_order: data.sortOrder ?? 0,
  });
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
  revalidateMarketingPaths();
  revalidatePath("/admin/home");
}
export async function deleteFaq(id: string) { await crudRow("faqs", "delete", undefined, id); }

export async function addSuccessStory(data: { name: string; course: string; achievement: string; review: string; photo?: string }) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("success_stories").insert({ ...data, photo: data.photo ?? "" });
  if (error) throw new Error(error.message);
  revalidateMarketingPaths();
  revalidatePath("/admin/home");
}
export async function deleteSuccessStory(id: string) { await crudRow("success_stories", "delete", undefined, id); }

export async function uploadAdminAsset(formData: FormData): Promise<string> {
  await requireAdmin();

  const file = formData.get("file");
  const folder = String(formData.get("folder") ?? "home");
  const variant = formData.get("variant");

  if (variant === "cover" || variant === "content") {
    return uploadBlogImage(formData);
  }

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("No file provided");
  }

  const { resolveImageContentType, ADMIN_IMAGE_MIME_TYPES } = await import(
    "@/lib/images/admin-image-constants"
  );
  const contentType = resolveImageContentType(file);
  const isRasterImage = Boolean(contentType && ADMIN_IMAGE_MIME_TYPES.has(contentType));

  let buffer: Buffer;
  let uploadContentType: string;
  let ext: string;

  if (isRasterImage) {
    const variantRaw = String(formData.get("variant") ?? "general");
    const processVariant =
      variantRaw === "cover" ? "cover" : variantRaw === "content" ? "content" : "general";
    const { prepareRasterImageUpload } = await import("@/lib/images/process-raster-upload");
    const processed = await prepareRasterImageUpload(file, processVariant);
    buffer = processed.buffer;
    uploadContentType = processed.contentType;
    ext = processed.ext;
  } else {
    buffer = Buffer.from(await file.arrayBuffer());
    uploadContentType = file.type || "application/octet-stream";
    ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  }

  const path = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  const admin = createAdminClient();

  const { error } = await admin.storage.from("admin").upload(path, buffer, {
    contentType: uploadContentType,
    upsert: false,
  });

  if (error) throw new Error(error.message);

  const { buildAdminPublicUrl } = await import("@/lib/storage/public-url");
  return buildAdminPublicUrl(path);
}

export async function uploadBlogImage(formData: FormData): Promise<string> {
  await requireAdmin();

  const file = formData.get("file");
  const folder = String(formData.get("folder") ?? "blog");
  const variantRaw = String(formData.get("variant") ?? "content");
  const variant = variantRaw === "cover" ? "cover" : "content";

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("No image file provided");
  }

  const { prepareRasterImageUpload } = await import("@/lib/images/process-raster-upload");
  const { buffer, contentType, ext } = await prepareRasterImageUpload(file, variant);
  const path = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  const admin = createAdminClient();
  const { error } = await admin.storage.from("admin").upload(path, buffer, {
    contentType,
    upsert: false,
  });

  if (error) throw new Error(error.message);

  const { buildAdminPublicUrl } = await import("@/lib/storage/public-url");
  return buildAdminPublicUrl(path);
}

export async function uploadCourseImage(formData: FormData): Promise<string> {
  await requireStaff();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("No file provided");
  }

  const { COURSE_IMAGE_ACCEPT } = await import("@/lib/images/admin-image-constants");
  const allowedTypes = new Set(COURSE_IMAGE_ACCEPT.split(",").map((t) => t.trim()));
  if (!allowedTypes.has(file.type)) {
    throw new Error("Upload a JPEG, PNG, WebP, SVG, or GIF image");
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Image must be 10 MB or smaller");
  }

  if (file.type !== "image/svg+xml" && file.type !== "image/gif") {
    const sharp = (await import("sharp")).default;
    const buffer = Buffer.from(await file.arrayBuffer());
    const metadata = await sharp(buffer).metadata();
    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;
    if (width <= 0 || height <= 0) {
      throw new Error("Could not read image dimensions");
    }
    const ratio = width / height;
    if (Math.abs(ratio - 1) > 0.02) {
      throw new Error(`Course image must be square (1:1). Uploaded image is ${width}×${height}px.`);
    }
  }

  const { prepareRasterImageUpload } = await import("@/lib/images/process-raster-upload");

  let buffer: Buffer;
  let contentType: string;
  let ext: string;

  if (file.type === "image/svg+xml") {
    buffer = Buffer.from(await file.arrayBuffer());
    contentType = file.type;
    ext = "svg";
  } else {
    const processed = await prepareRasterImageUpload(
      file,
      file.type === "image/gif" ? "general" : "square"
    );
    buffer = processed.buffer;
    contentType = processed.contentType;
    ext = processed.ext;
  }

  const path = `courses/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  const admin = createAdminClient();
  const { error } = await admin.storage.from("admin").upload(path, buffer, {
    contentType,
    upsert: false,
  });

  if (error) throw new Error(error.message);

  const { buildAdminPublicUrl } = await import("@/lib/storage/public-url");
  return buildAdminPublicUrl(path);
}

const MARKETING_ANNOUNCEMENT_CONTENT_TYPES: MarketingAnnouncementContentType[] = [
  "image_only",
  "text_only",
  "text_image",
  "text_image_link",
];

const MARKETING_ANNOUNCEMENT_DISPLAY_STYLES: MarketingAnnouncementDisplayStyle[] = [
  "minimal",
  "card",
  "image_hero",
  "promo",
  "banner",
];

export type MarketingAnnouncementInput = {
  title?: string;
  body?: string;
  imageUrl?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  contentType: MarketingAnnouncementContentType;
  displayStyle: MarketingAnnouncementDisplayStyle;
  startsAt?: string | null;
  endsAt?: string | null;
  priority?: number;
  isActive?: boolean;
};

function validateMarketingAnnouncementInput(data: MarketingAnnouncementInput): void {
  if (!MARKETING_ANNOUNCEMENT_CONTENT_TYPES.includes(data.contentType)) {
    throw new Error("Invalid content type");
  }
  if (!MARKETING_ANNOUNCEMENT_DISPLAY_STYLES.includes(data.displayStyle)) {
    throw new Error("Invalid display style");
  }

  const title = data.title?.trim() ?? "";
  const body = data.body?.trim() ?? "";
  const imageUrl = data.imageUrl?.trim() ?? "";
  const ctaLabel = data.ctaLabel?.trim() ?? "";
  const ctaUrl = data.ctaUrl?.trim() ?? "";

  if (data.contentType === "image_only" && !imageUrl) {
    throw new Error("Image is required for image-only announcements");
  }
  if (data.contentType === "text_only" && !title && !body) {
    throw new Error("Title or body is required for text-only announcements");
  }
  if (data.contentType === "text_image") {
    if (!imageUrl) throw new Error("Image is required for text + image announcements");
    if (!title && !body) throw new Error("Title or body is required for text + image announcements");
  }
  if (data.contentType === "text_image_link") {
    if (!imageUrl) throw new Error("Image is required for announcements with links");
    if (!title && !body) throw new Error("Title or body is required for announcements with links");
    if (!ctaLabel || !ctaUrl) throw new Error("CTA label and URL are required for announcements with links");
  }

  if (data.startsAt && data.endsAt) {
    const start = new Date(data.startsAt).getTime();
    const end = new Date(data.endsAt).getTime();
    if (!Number.isNaN(start) && !Number.isNaN(end) && end < start) {
      throw new Error("End date must be after start date");
    }
  }
}

function marketingAnnouncementPayload(data: MarketingAnnouncementInput) {
  return {
    title: data.title?.trim() ?? "",
    body: data.body?.trim() ?? "",
    image_url: data.imageUrl?.trim() ?? "",
    cta_label: data.ctaLabel?.trim() ?? "",
    cta_url: data.ctaUrl?.trim() ?? "",
    content_type: data.contentType,
    display_style: data.displayStyle,
    starts_at: data.startsAt || null,
    ends_at: data.endsAt || null,
    priority: data.priority ?? 0,
    is_active: data.isActive ?? true,
    updated_at: new Date().toISOString(),
  };
}

function revalidateMarketingAnnouncementPaths() {
  revalidateMarketingPaths();
  revalidatePath("/admin/home");
}

export async function addMarketingAnnouncement(data: MarketingAnnouncementInput) {
  await requireAdmin();
  validateMarketingAnnouncementInput(data);

  const supabase = await createClient();
  const { error } = await supabase.from("marketing_announcements").insert(marketingAnnouncementPayload(data));
  if (error) throw new Error(error.message);

  revalidateMarketingAnnouncementPaths();
}

export async function updateMarketingAnnouncement(id: string, data: MarketingAnnouncementInput) {
  await requireAdmin();
  validateMarketingAnnouncementInput(data);

  const supabase = await createClient();
  const { error } = await supabase
    .from("marketing_announcements")
    .update(marketingAnnouncementPayload(data))
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidateMarketingAnnouncementPaths();
}

export async function deleteMarketingAnnouncement(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("marketing_announcements").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidateMarketingAnnouncementPaths();
}

// --- Blog CMS ---

export type BlogCategoryInput = {
  name: string;
  slug?: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
};

export type BlogPostInput = {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  coverImageUrl?: string;
  categoryId?: string | null;
  status: BlogPostStatus;
  isFeatured?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  tags?: string[];
  authorName?: string;
};

function blogCategoryPayload(data: BlogCategoryInput) {
  const name = data.name.trim();
  if (!name) throw new Error("Category name is required");

  const slug = (data.slug?.trim() || slugifyBlogTitle(name));
  validateBlogSlug(slug);

  return {
    name,
    slug,
    description: data.description?.trim() ?? "",
    sort_order: data.sortOrder ?? 0,
    is_active: data.isActive ?? true,
  };
}

async function assertUniqueBlogCategorySlug(slug: string, excludeId?: string) {
  const supabase = await createClient();
  let query = supabase.from("blog_categories").select("id").eq("slug", slug);
  if (excludeId) query = query.neq("id", excludeId);
  const { data } = await query.maybeSingle();
  if (data) throw new Error("A category with this slug already exists");
}

async function assertUniqueBlogPostSlug(slug: string, excludeId?: string) {
  const supabase = await createClient();
  let query = supabase.from("blog_posts").select("id").eq("slug", slug);
  if (excludeId) query = query.neq("id", excludeId);
  const { data } = await query.maybeSingle();
  if (data) throw new Error("A post with this slug already exists");
}

function validateBlogPostInput(data: BlogPostInput, forPublish: boolean): string {
  const title = data.title.trim();
  if (!title) throw new Error("Title is required");

  const slug = (data.slug?.trim() || slugifyBlogTitle(title));
  validateBlogSlug(slug);

  const content = data.content ?? "";
  if (forPublish && !content.trim()) {
    throw new Error("Content is required to publish");
  }

  return slug;
}

function blogPostPayload(data: BlogPostInput, existingPublishedAt?: string | null) {
  const slug = validateBlogPostInput(data, data.status === "published");
  const now = new Date().toISOString();

  let publishedAt: string | null = existingPublishedAt ?? null;
  if (data.status === "published") {
    publishedAt = publishedAt ?? now;
  }

  return {
    title: data.title.trim(),
    slug,
    excerpt: data.excerpt?.trim() ?? "",
    content: data.content ?? "",
    cover_image_url: data.coverImageUrl?.trim() ?? "",
    category_id: data.categoryId || null,
    status: data.status,
    is_featured: data.isFeatured ?? false,
    seo_title: data.seoTitle?.trim() ?? "",
    seo_description: data.seoDescription?.trim() ?? "",
    tags: data.tags ?? [],
    author_name: data.authorName?.trim() ?? "",
    reading_time_minutes: computeReadingTimeMinutes(data.content ?? ""),
    published_at: publishedAt,
    updated_at: now,
  };
}

function revalidateBlogAdminPaths(slugs: string[] = []) {
  revalidateBlogPaths(slugs);
  revalidatePath("/admin/blog");
}

export async function addBlogCategory(data: BlogCategoryInput) {
  await requireAdmin();
  const payload = blogCategoryPayload(data);
  await assertUniqueBlogCategorySlug(payload.slug);

  const supabase = await createClient();
  const { error } = await supabase.from("blog_categories").insert(payload);
  if (error) throw new Error(error.message);

  revalidateBlogAdminPaths();
}

export async function updateBlogCategory(id: string, data: BlogCategoryInput) {
  await requireAdmin();
  const payload = blogCategoryPayload(data);
  await assertUniqueBlogCategorySlug(payload.slug, id);

  const supabase = await createClient();
  const { error } = await supabase.from("blog_categories").update(payload).eq("id", id);
  if (error) throw new Error(error.message);

  revalidateBlogAdminPaths();
}

export async function deleteBlogCategory(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("blog_categories").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidateBlogAdminPaths();
}

export async function addBlogPost(data: BlogPostInput) {
  await requireAdmin();
  const profile = await getSessionProfile();
  const withAuthor: BlogPostInput = {
    ...data,
    authorName: data.authorName?.trim() || profile?.displayName || "ICTF",
  };

  const payload = blogPostPayload(withAuthor);
  await assertUniqueBlogPostSlug(payload.slug);

  const supabase = await createClient();
  const { error } = await supabase.from("blog_posts").insert(payload);
  if (error) throw new Error(error.message);

  revalidateBlogAdminPaths([payload.slug]);
}

export async function updateBlogPost(id: string, data: BlogPostInput) {
  await requireAdmin();

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("blog_posts")
    .select("slug, published_at")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!existing) throw new Error("Post not found");

  const payload = blogPostPayload(data, existing.published_at);
  await assertUniqueBlogPostSlug(payload.slug, id);

  const { error } = await supabase.from("blog_posts").update(payload).eq("id", id);
  if (error) throw new Error(error.message);

  const slugs = [existing.slug];
  if (payload.slug !== existing.slug) slugs.push(payload.slug);
  revalidateBlogAdminPaths(slugs);
}

export async function deleteBlogPost(id: string) {
  await requireAdmin();

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("blog_posts")
    .select("slug")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidateBlogAdminPaths(existing?.slug ? [existing.slug] : []);
}

