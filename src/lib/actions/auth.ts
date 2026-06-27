"use server";

import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendStudentWelcomeEmail } from "@/lib/actions/email";
import {
  buildGeneratedIndexNumber,
  normalizeIndexNumber,
  normalizeNic,
  normalizePhone,
  normalizeUsername,
  validateRegisterStudent,
  type RegisterStudentInput,
} from "@/lib/validation/register-student";
import type { UserRole } from "@/types";
import { BRAND } from "@/lib/constants";
import { LOGIN_ERROR } from "@/lib/auth/login-errors";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeDisplayName(displayName: string, email: string) {
  const trimmed = displayName.trim();
  return trimmed.length >= 2 ? trimmed : email.split("@")[0] ?? "Student";
}

function mapAuthError(message?: string | null): string {
  const safe = message?.trim();
  if (!safe) return "Registration failed. Please try again.";
  const lower = safe.toLowerCase();
  if (lower.includes("already been registered") || lower.includes("already exists")) {
    return "An account with this email already exists. Try logging in instead.";
  }
  if (lower.includes("students_username_lower_idx") || lower.includes("username")) {
    return "This username is already taken. Choose another.";
  }
  if (lower.includes("students_index_number_lower_idx") || lower.includes("index_number")) {
    return "This index number is already registered.";
  }
  if (lower.includes("students_nic_number_lower_idx") || lower.includes("nic_number")) {
    return "This NIC number is already registered.";
  }
  if (lower.includes("password")) {
    return "Use at least 8 characters.";
  }
  if (lower.includes("invalid email")) {
    return "Enter a valid email address.";
  }
  return safe;
}

async function ensureProfileRow(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  email: string,
  displayName: string,
  role: UserRole
) {
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existing) return;

  const { error } = await admin.from("profiles").insert({
    id: userId,
    email,
    display_name: displayName,
    role,
  });

  if (error) throw new Error(mapAuthError(error.message));
}

async function assertStudentUnique(
  admin: ReturnType<typeof createAdminClient>,
  username: string,
  indexNumber: string,
  nicNumber: string,
  email: string,
  excludeUserId?: string
) {
  const { data: byUsername } = await admin
    .from("students")
    .select("id, user_id")
    .eq("username", username)
    .maybeSingle();

  if (byUsername && byUsername.user_id !== excludeUserId) {
    throw new Error("This username is already taken. Choose another.");
  }

  if (indexNumber.length >= 4) {
    const { data: byIndex } = await admin
      .from("students")
      .select("id, user_id")
      .eq("index_number", indexNumber)
      .maybeSingle();

    if (byIndex && byIndex.user_id !== excludeUserId) {
      throw new Error("This index number is already registered.");
    }
  }

  const { data: byNic } = await admin
    .from("students")
    .select("id, user_id")
    .eq("nic_number", nicNumber)
    .maybeSingle();

  if (byNic && byNic.user_id !== excludeUserId) {
    throw new Error("This NIC number is already registered.");
  }

  const { data: byEmail } = await admin
    .from("students")
    .select("id, user_id")
    .eq("email", email)
    .maybeSingle();

  if (byEmail && byEmail.user_id !== excludeUserId) {
    throw new Error("An account with this email already exists. Try logging in instead.");
  }
}

async function resolveIndexNumber(
  admin: ReturnType<typeof createAdminClient>,
  studentMeta: RegisterStudentInput
): Promise<string> {
  if (studentMeta.indexNumber?.trim()) {
    return normalizeIndexNumber(studentMeta.indexNumber);
  }

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const candidate = buildGeneratedIndexNumber(
      studentMeta.studyTrack === "al" ? studentMeta.examYear : undefined,
      studentMeta.studyTrack === "grade" ? studentMeta.ictGrade : undefined
    );
    const { data } = await admin
      .from("students")
      .select("id")
      .eq("index_number", candidate)
      .maybeSingle();

    if (!data) {
      return candidate;
    }
  }

  throw new Error("Could not generate index number. Please try again.");
}

async function upsertRegistrationStudent(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  email: string,
  displayName: string,
  studentMeta: RegisterStudentInput
): Promise<{ indexNumber: string; studentId: string; courseName: string }> {
  const username = normalizeUsername(studentMeta.username);
  const indexNumber = await resolveIndexNumber(admin, studentMeta);
  const nicNumber = normalizeNic(studentMeta.nicNumber);
  const phone = studentMeta.phone?.trim() ? normalizePhone(studentMeta.phone) : null;

  await assertStudentUnique(admin, username, indexNumber, nicNumber, email, userId);

  const { data: course } = await admin
    .from("courses")
    .select("id, name, student_count")
    .eq("id", studentMeta.courseId)
    .maybeSingle();

  if (!course) {
    throw new Error("Select a course");
  }

  const studentId = `${BRAND.studentIdPrefix}-${username.toUpperCase()}`;
  const courseName = studentMeta.courseName || course.name;
  const payload = {
    student_id: studentId,
    username,
    index_number: indexNumber,
    nic_number: nicNumber,
    phone,
    notify_email: true,
    display_name: displayName,
    email,
    course_id: course.id,
    course_name: courseName,
    exam_year: studentMeta.studyTrack === "al" ? studentMeta.examYear ?? null : null,
    ict_grade: studentMeta.studyTrack === "grade" ? studentMeta.ictGrade ?? null : null,
  };

  const { data: existing } = await admin
    .from("students")
    .select("id, course_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    const previousCourseId = existing.course_id;
    const { error: updateError } = await admin
      .from("students")
      .update(payload)
      .eq("user_id", userId)
      .select("id, course_id")
      .single();

    if (updateError) {
      throw new Error(mapAuthError(updateError.message));
    }

    if (previousCourseId !== course.id) {
      await admin
        .from("courses")
        .update({ student_count: course.student_count + 1 })
        .eq("id", course.id);
    }

    return { indexNumber, studentId, courseName };
  }

  const { error: insertError } = await admin
    .from("students")
    .insert({
      user_id: userId,
      grade: "B",
      rank: 50,
      streak: 0,
      points: 0,
      performance: 0,
      ...payload,
    })
    .select("id, course_id")
    .single();

  if (insertError) {
    throw new Error(mapAuthError(insertError.message));
  }

  await admin
    .from("courses")
    .update({ student_count: course.student_count + 1 })
    .eq("id", course.id);

  return { indexNumber, studentId, courseName };
}

async function ensureStudentRow(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  email: string,
  displayName: string,
  studentMeta?: RegisterStudentInput
): Promise<{ indexNumber: string; studentId: string; courseName: string } | null> {
  if (studentMeta) {
    return upsertRegistrationStudent(admin, userId, email, displayName, studentMeta);
  }

  const { data: existing } = await admin
    .from("students")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return null;

  const { data: course } = await admin
    .from("courses")
    .select("id, name")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { error } = await admin.from("students").insert({
    user_id: userId,
    student_id: `${BRAND.studentIdPrefix}-${Date.now()}`,
    display_name: displayName,
    email,
    course_id: course?.id ?? null,
    course_name: course?.name ?? "General",
    grade: "B",
    rank: 50,
    streak: 0,
    points: 0,
    performance: 0,
  });

  if (error) {
    if (error.code === "23505") return null;
    throw new Error(mapAuthError(error.message));
  }

  return null;
}

export async function checkUsernameAvailable(username: string): Promise<boolean> {
  try {
    const normalized = normalizeUsername(username);
    if (normalized.length < 3) return false;

    if (!isAdminClientConfigured()) {
      return true;
    }

    const admin = createAdminClient();
    const { data } = await admin.from("students").select("id").eq("username", normalized).maybeSingle();
    return !data;
  } catch {
    return true;
  }
}

/** Client-safe registration — returns errors instead of throwing (production hides thrown action errors). */
export async function registerStudentAccount(
  input: RegisterStudentInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await signUpWithRole(input.email, input.password, input.displayName, "student", input);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Registration failed. Please try again.";
    return { ok: false, error: message };
  }
}

export async function signUpWithRole(
  email: string,
  password: string,
  displayName: string,
  role: UserRole,
  studentMeta?: RegisterStudentInput
) {
  if (!isAdminClientConfigured()) {
    throw new Error(
      process.env.NODE_ENV === "production"
        ? "Registration is temporarily unavailable. Please try again later or contact support."
        : "Registration backend is not fully configured. Add SUPABASE_SERVICE_ROLE_KEY to .env.local (Supabase Dashboard → Project Settings → API → service_role secret), then restart the dev server."
    );
  }

  const normalizedEmail = normalizeEmail(email);
  const normalizedName = normalizeDisplayName(displayName, normalizedEmail);

  if (studentMeta) {
    const validationError = validateRegisterStudent(studentMeta);
    if (validationError) {
      throw new Error(validationError);
    }
  } else {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new Error("Enter a valid email address.");
    }

    if (password.length < 8) {
      throw new Error("Use at least 8 characters.");
    }
  }

  const admin = createAdminClient();

  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (existingProfile) {
    throw new Error("An account with this email already exists. Try logging in instead.");
  }

  if (studentMeta) {
    await assertStudentUnique(
      admin,
      normalizeUsername(studentMeta.username),
      studentMeta.indexNumber?.trim() ? normalizeIndexNumber(studentMeta.indexNumber) : "",
      normalizeNic(studentMeta.nicNumber),
      normalizedEmail
    );
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: true,
    app_metadata: { role },
    user_metadata: {
      display_name: normalizedName,
      username: studentMeta ? normalizeUsername(studentMeta.username) : undefined,
    },
  });

  if (error) {
    const detail =
      error.message?.trim() ||
      (typeof error === "object" && error !== null && "code" in error
        ? String((error as { code?: string }).code ?? "")
        : "") ||
      "Registration failed. Please try again.";
    throw new Error(mapAuthError(detail));
  }
  if (!data.user) throw new Error("Failed to create user");

  await ensureProfileRow(admin, data.user.id, normalizedEmail, normalizedName, role);

  if (role === "student") {
    const registration = await ensureStudentRow(
      admin,
      data.user.id,
      normalizedEmail,
      normalizedName,
      studentMeta
    );

    if (studentMeta && registration) {
      const username = normalizeUsername(studentMeta.username);
      await sendStudentWelcomeEmail({
        displayName: normalizedName,
        studentId: registration.studentId,
        username,
        indexNumber: registration.indexNumber,
        email: normalizedEmail,
        tempPassword: password,
        courseName: registration.courseName,
        examYear: studentMeta.studyTrack === "al" ? studentMeta.examYear : undefined,
        ictGrade: studentMeta.studyTrack === "grade" ? studentMeta.ictGrade : undefined,
        selfRegistered: true,
      });
    }
  }

  return data.user;
}

export async function getSessionProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}

export async function requireStaff() {
  const profile = await getSessionProfile();
  if (!profile || !["admin", "teacher"].includes(profile.role)) {
    throw new Error("Unauthorized: staff access required");
  }
  return profile;
}

export async function requireAdmin() {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "admin") {
    throw new Error("Unauthorized: admin access required");
  }
  return profile;
}

function normalizeStudentLoginId(studentId: string): string {
  const trimmed = studentId.trim().toUpperCase();
  if (!trimmed) return "";
  const prefix = `${BRAND.studentIdPrefix}-`;
  if (trimmed.startsWith(prefix) || trimmed.startsWith("ICVF-")) return trimmed;
  return `${prefix}${trimmed}`;
}

export async function resolveStudentLoginEmail(studentId: string): Promise<string> {
  if (!isAdminClientConfigured()) {
    throw new Error("Login is temporarily unavailable. Please try again later.");
  }

  const normalized = normalizeStudentLoginId(studentId);
  if (!normalized || normalized === `${BRAND.studentIdPrefix}-` || normalized === "ICVF-") {
    throw new Error(LOGIN_ERROR.STUDENT_ID_INVALID);
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("students")
    .select("email")
    .eq("student_id", normalized)
    .maybeSingle();

  if (error || !data?.email) {
    throw new Error(LOGIN_ERROR.STUDENT_ID_NOT_FOUND);
  }

  return data.email.trim().toLowerCase();
}
