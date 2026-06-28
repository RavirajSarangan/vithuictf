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
  USERNAME_PATTERN,
  validateRegisterStudent,
  type RegisterStudentInput,
} from "@/lib/validation/register-student";
import type { UserRole } from "@/types";
import { BRAND } from "@/lib/constants";
import { LOGIN_ERROR, isLoginErrorCode, type LoginErrorCode } from "@/lib/auth/login-errors";
import { mapProfile } from "@/lib/supabase/mappers";
import { deriveStaffUsername, normalizeStaffUsername } from "@/lib/staff-username";
import { autoSyncStaffPortalAccountsForLogin } from "@/lib/actions/staff-portal-sync";
import {
  assertCourseMatchesStudyTrack,
  autoEnrollStudentOnRegistration,
} from "@/lib/academics/registration-enrollment";

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
    .select("id, name, student_count, level")
    .eq("id", studentMeta.courseId)
    .maybeSingle();

  if (!course) {
    throw new Error("Select a course");
  }

  assertCourseMatchesStudyTrack(course.level, studentMeta.studyTrack);

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
    const { data: updated, error: updateError } = await admin
      .from("students")
      .update(payload)
      .eq("user_id", userId)
      .select("id, course_id")
      .single();

    if (updateError) {
      throw new Error(mapAuthError(updateError.message));
    }

    if (previousCourseId !== course.id) {
      if (previousCourseId) {
        const { data: previousCourse } = await admin
          .from("courses")
          .select("student_count")
          .eq("id", previousCourseId)
          .maybeSingle();
        if (previousCourse && previousCourse.student_count > 0) {
          await admin
            .from("courses")
            .update({ student_count: previousCourse.student_count - 1 })
            .eq("id", previousCourseId);
        }
      }
      await admin
        .from("courses")
        .update({ student_count: course.student_count + 1 })
        .eq("id", course.id);
    }

    await autoEnrollStudentOnRegistration(admin, updated.id, course.id, studentMeta);

    return { indexNumber, studentId, courseName };
  }

  const { data: inserted, error: insertError } = await admin
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

  await autoEnrollStudentOnRegistration(admin, inserted.id, course.id, studentMeta);

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
      return false;
    }

    const admin = createAdminClient();
    const { data, error } = await admin.from("students").select("id").eq("username", normalized).maybeSingle();
    if (error) return false;
    return !data;
  } catch {
    return false;
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

async function assertSignUpAuthorized(role: UserRole, studentMeta?: RegisterStudentInput) {
  if (role === "student" && studentMeta) {
    return;
  }

  if (role === "student" || role === "parent") {
    await requireStaff();
    return;
  }

  if (role === "teacher" || role === "admin" || role === "content_manager") {
    await requireAdmin();
    return;
  }

  if (role === "paper_center_staff" || role === "super_admin") {
    await requireSuperAdmin();
    return;
  }

  throw new Error("Invalid account role");
}

export async function signUpWithRole(
  email: string,
  password: string,
  displayName: string,
  role: UserRole,
  studentMeta?: RegisterStudentInput
) {
  await assertSignUpAuthorized(role, studentMeta);

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
  if (!profile || !["admin", "super_admin", "teacher"].includes(profile.role)) {
    throw new Error("Unauthorized: staff access required");
  }
  return profile;
}

export async function requireAdmin() {
  const profile = await getSessionProfile();
  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    throw new Error("Unauthorized: admin access required");
  }
  return profile;
}

export async function requireSuperAdmin() {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "super_admin") {
    throw new Error("Unauthorized: super admin access required");
  }
  return profile;
}

export async function requireAcademicsStaff() {
  const profile = await getSessionProfile();
  if (!profile || !["super_admin", "admin", "teacher"].includes(profile.role)) {
    throw new Error("Unauthorized: academics staff access required");
  }
  return profile;
}

export async function requireTrackingStaff() {
  const profile = await getSessionProfile();
  if (!profile || !["admin", "super_admin", "content_manager"].includes(profile.role)) {
    throw new Error("Unauthorized: tracking staff access required");
  }
  return profile;
}

export async function requireContentManager() {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "content_manager") {
    throw new Error("Unauthorized: content manager access required");
  }
  return profile;
}

export async function requirePaperCenterStaff() {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "paper_center_staff") {
    throw new Error("Unauthorized: paper center staff access required");
  }
  return profile;
}

async function resolvePaperCenterStaffLoginMatch(
  staffUsername: string,
  centerSlug?: string
): Promise<{ email: string; userId: string }> {
  if (!isAdminClientConfigured()) {
    throw new Error("Login is temporarily unavailable. Please try again later.");
  }

  const normalizedUsername = normalizeStaffUsername(staffUsername);
  if (!normalizedUsername || !USERNAME_PATTERN.test(normalizedUsername)) {
    throw new Error(LOGIN_ERROR.STAFF_USERNAME_INVALID);
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("paper_center_staff")
    .select("email, staff_username, active, user_id, paper_centers(slug, name)")
    .ilike("staff_username", normalizedUsername)
    .maybeSingle();

  if (error || !data?.email || !data.user_id) {
    throw new Error(LOGIN_ERROR.STAFF_USERNAME_NOT_FOUND);
  }

  if (data.active === false) {
    throw new Error("Your paper center account is deactivated. Contact an administrator.");
  }

  if (centerSlug) {
    const centerRow = data.paper_centers as { slug?: string; name?: string } | { slug?: string; name?: string }[] | null;
    const center = Array.isArray(centerRow) ? centerRow[0] : centerRow;
    if (!center?.slug || center.slug !== centerSlug) {
      throw new Error("This account is not registered for this paper center. Use your center's login link.");
    }
  }

  return { email: data.email.trim().toLowerCase(), userId: data.user_id };
}

/** Paper center portal login — username + password only. */
export async function loginPaperCenterPortal(
  staffUsername: string,
  password: string,
  centerSlug?: string
): Promise<LoginActionResult> {
  try {
    const { email, userId } = await resolvePaperCenterStaffLoginMatch(staffUsername, centerSlug);
    const supabase = await createClient();
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return loginActionFailure(error);
    }
    if (!authData.user) {
      return { ok: false, error: "Sign in failed" };
    }

    if (authData.user.id !== userId) {
      await supabase.auth.signOut();
      return { ok: false, error: "This username is linked to a different account. Contact an administrator." };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    if (!profile) {
      await supabase.auth.signOut();
      return { ok: false, error: "Profile not found" };
    }

    const mapped = mapProfile(profile);
    if (mapped.role !== "paper_center_staff") {
      await supabase.auth.signOut();
      return loginActionFailure(new Error(LOGIN_ERROR.PAPER_CENTER_ONLY));
    }

    await syncProfileRoleToJwt(authData.user.id, mapped.role);
    return { ok: true, redirectTo: "/paper-center/dashboard" };
  } catch (error) {
    return loginActionFailure(error);
  }
}

function normalizeStudentLoginId(studentId: string): string {
  const trimmed = studentId.trim().toUpperCase();
  if (!trimmed) return "";
  const prefix = `${BRAND.studentIdPrefix}-`;
  if (trimmed.startsWith(prefix) || trimmed.startsWith("ICVF-")) return trimmed;
  return `${prefix}${trimmed}`;
}

type StaffPortalLoginMatch = {
  email: string;
  userId: string;
};

async function resolveStaffPortalLoginMatch(
  staffUsername: string,
  email: string
): Promise<StaffPortalLoginMatch> {
  if (!isAdminClientConfigured()) {
    throw new Error("Login is temporarily unavailable. Please try again later.");
  }

  const normalizedUsername = normalizeStaffUsername(staffUsername);
  if (!normalizedUsername || !USERNAME_PATTERN.test(normalizedUsername)) {
    throw new Error(LOGIN_ERROR.STAFF_USERNAME_INVALID);
  }

  const normalizedEmail = normalizeEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error(LOGIN_ERROR.INVALID_EMAIL);
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("teachers")
    .select("email, staff_username, active, user_id")
    .eq("staff_username", normalizedUsername)
    .maybeSingle();

  if (error || !data?.email || !data.user_id) {
    throw new Error(LOGIN_ERROR.STAFF_USERNAME_NOT_FOUND);
  }

  if (data.active === false) {
    throw new Error("Your staff account is deactivated. Contact an administrator.");
  }

  if (data.email.trim().toLowerCase() !== normalizedEmail) {
    throw new Error(LOGIN_ERROR.STAFF_EMAIL_MISMATCH);
  }

  return { email: normalizedEmail, userId: data.user_id };
}

export async function resolveStaffPortalLogin(staffUsername: string, email: string): Promise<string> {
  const match = await resolveStaffPortalLoginMatch(staffUsername, email);
  return match.email;
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

export type LoginActionResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: string; code?: LoginErrorCode; redirectTo?: string };

async function syncProfileRoleToJwt(userId: string, role: UserRole) {
  if (!isAdminClientConfigured()) return;
  const admin = createAdminClient();
  await admin.auth.admin.updateUserById(userId, { app_metadata: { role } });
}

/** Fix profiles stuck as student when an active teachers row already exists. */
async function reconcileStaffProfileRole(userId: string, currentRole: UserRole): Promise<UserRole> {
  if (currentRole === "teacher" || !isAdminClientConfigured()) {
    return currentRole;
  }

  const admin = createAdminClient();
  const { data: staffRecord } = await admin
    .from("teachers")
    .select("active")
    .eq("user_id", userId)
    .maybeSingle();

  if (!staffRecord || staffRecord.active === false) {
    return currentRole;
  }

  const { error } = await admin.from("profiles").update({ role: "teacher" }).eq("id", userId);
  if (error) {
    console.error("Failed to reconcile staff profile role:", error.message);
    return currentRole;
  }

  await syncProfileRoleToJwt(userId, "teacher");
  return "teacher";
}

/** Resolve staff login from email when teachers sign in without entering a username. */
async function resolveTeacherStaffLoginByEmail(
  email: string
): Promise<{ staffUsername: string; userId: string } | null> {
  if (!isAdminClientConfigured()) return null;

  const admin = createAdminClient();
  const normalizedEmail = normalizeEmail(email);
  const { data: teacher, error } = await admin
    .from("teachers")
    .select("user_id, display_name, email, staff_username, active")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (error || !teacher?.user_id || teacher.active === false) {
    return null;
  }

  let staffUsername = teacher.staff_username?.trim().toLowerCase() ?? "";
  if (!staffUsername || !USERNAME_PATTERN.test(staffUsername)) {
    try {
      staffUsername = deriveStaffUsername(teacher.email, teacher.display_name);
    } catch {
      return null;
    }

    const { error: updateError } = await admin
      .from("teachers")
      .update({ staff_username: staffUsername })
      .eq("user_id", teacher.user_id);
    if (updateError) {
      console.error("Failed to backfill staff username:", updateError.message);
      return null;
    }
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", teacher.user_id)
    .maybeSingle();

  await reconcileStaffProfileRole(teacher.user_id, (profile?.role as UserRole) ?? "student");

  return { staffUsername, userId: teacher.user_id };
}

function loginActionFailure(error: unknown): Extract<LoginActionResult, { ok: false }> {
  if (error instanceof Error && isLoginErrorCode(error.message)) {
    const code = error.message;
    const redirectTo =
      code === LOGIN_ERROR.CONTENT_TEAM_ONLY
        ? "/login/social-tracking"
        : code === LOGIN_ERROR.PAPER_CENTER_ONLY
          ? "/login/paper-center"
          : code === LOGIN_ERROR.STAFF_PORTAL_ONLY
          ? "/login/staff"
          : code === LOGIN_ERROR.ADMIN_PORTAL_ONLY || code === LOGIN_ERROR.ADMIN_USE_ADMIN_LOGIN
            ? "/login/admin"
            : code === LOGIN_ERROR.STUDENT_ID_ONLY
              ? "/login"
              : undefined;

    return { ok: false, error: code, code, redirectTo };
  }

  const message = error instanceof Error ? error.message : "Login failed";
  if (message.toLowerCase().includes("invalid login credentials")) {
    return { ok: false, error: "Invalid email or password." };
  }

  return { ok: false, error: message };
}

/** Client-safe admin portal login — returns readable errors in production. */
export async function loginAdminPortal(email: string, password: string): Promise<LoginActionResult> {
  try {
    const normalizedEmail = normalizeEmail(email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return loginActionFailure(new Error(LOGIN_ERROR.INVALID_EMAIL));
    }

    const supabase = await createClient();
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      return loginActionFailure(error);
    }
    if (!authData.user) {
      return { ok: false, error: "Sign in failed" };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    if (!profile) {
      await supabase.auth.signOut();
      return { ok: false, error: "Profile not found" };
    }

    const mapped = mapProfile(profile);
    if (mapped.role === "teacher") {
      await supabase.auth.signOut();
      return loginActionFailure(new Error(LOGIN_ERROR.STAFF_PORTAL_ONLY));
    }
    if (mapped.role === "paper_center_staff") {
      await supabase.auth.signOut();
      return loginActionFailure(new Error(LOGIN_ERROR.PAPER_CENTER_ONLY));
    }
    if (mapped.role !== "admin" && mapped.role !== "super_admin") {
      await supabase.auth.signOut();
      return loginActionFailure(new Error(LOGIN_ERROR.ADMIN_PORTAL_ONLY));
    }

    await syncProfileRoleToJwt(authData.user.id, mapped.role);
    return { ok: true, redirectTo: "/admin/dashboard" };
  } catch (error) {
    return loginActionFailure(error);
  }
}

/** Staff portal login — teachers use username + email + password; admins use email + password only. */
export async function loginStaffPortal(
  staffUsername: string,
  email: string,
  password: string
): Promise<LoginActionResult> {
  await autoSyncStaffPortalAccountsForLogin();

  const normalizedEmail = normalizeEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return loginActionFailure(new Error(LOGIN_ERROR.INVALID_EMAIL));
  }

  const trimmedUsername = staffUsername.trim();

  // Teachers can sign in with email + password; username is resolved from their staff record.
  if (!trimmedUsername) {
    const teacherMatch = await resolveTeacherStaffLoginByEmail(normalizedEmail);
    if (teacherMatch) {
      return loginInstituteStaff(teacherMatch.staffUsername, email, password);
    }
    return loginAdminPortal(email, password);
  }

  if (isAdminClientConfigured()) {
    const admin = createAdminClient();
    const { data: profileByEmail } = await admin
      .from("profiles")
      .select("role")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (profileByEmail?.role === "admin" || profileByEmail?.role === "super_admin") {
      return loginAdminPortal(email, password);
    }
  }

  const staffResult = await loginInstituteStaff(staffUsername, email, password);
  if (staffResult.ok) {
    return staffResult;
  }

  // Admin may have entered a staff username by mistake — still allow email + password sign-in.
  if (
    staffResult.code === LOGIN_ERROR.STAFF_USERNAME_NOT_FOUND ||
    staffResult.code === LOGIN_ERROR.STAFF_USERNAME_INVALID ||
    staffResult.code === LOGIN_ERROR.STAFF_EMAIL_MISMATCH
  ) {
    const adminResult = await loginAdminPortal(email, password);
    if (adminResult.ok) {
      return adminResult;
    }
  }

  return staffResult;
}

/** Client-safe staff portal login — returns readable errors in production. */
export async function loginInstituteStaff(
  staffUsername: string,
  email: string,
  password: string
): Promise<LoginActionResult> {
  try {
    const normalizedEmail = normalizeEmail(email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return loginActionFailure(new Error(LOGIN_ERROR.INVALID_EMAIL));
    }

    const { email: resolvedEmail, userId: expectedUserId } = await resolveStaffPortalLoginMatch(
      staffUsername,
      email
    );
    const supabase = await createClient();
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: resolvedEmail,
      password,
    });

    if (error) {
      return loginActionFailure(error);
    }
    if (!authData.user) {
      return { ok: false, error: "Sign in failed" };
    }

    if (authData.user.id !== expectedUserId) {
      await supabase.auth.signOut();
      return {
        ok: false,
        error:
          "This email is linked to a different account than this staff username. Use the email from your staff welcome email, or ask an administrator to fix the account.",
      };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    if (!profile) {
      await supabase.auth.signOut();
      return { ok: false, error: "Profile not found" };
    }

    const mapped = mapProfile(profile);
    const effectiveRole = await reconcileStaffProfileRole(authData.user.id, mapped.role);
    if (effectiveRole === "content_manager") {
      await supabase.auth.signOut();
      return loginActionFailure(new Error(LOGIN_ERROR.CONTENT_TEAM_ONLY));
    }
    if (effectiveRole === "paper_center_staff") {
      await supabase.auth.signOut();
      return loginActionFailure(new Error(LOGIN_ERROR.PAPER_CENTER_ONLY));
    }
    if (effectiveRole === "student") {
      await supabase.auth.signOut();
      return loginActionFailure(new Error(LOGIN_ERROR.STUDENT_ID_ONLY));
    }
    if (effectiveRole !== "teacher") {
      await supabase.auth.signOut();
      return loginActionFailure(new Error(LOGIN_ERROR.STAFF_PORTAL_ONLY));
    }

    await syncProfileRoleToJwt(authData.user.id, effectiveRole);
    return { ok: true, redirectTo: "/academics/dashboard" };
  } catch (error) {
    return loginActionFailure(error);
  }
}
