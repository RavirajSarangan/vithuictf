/**
 * End-to-end registration backend test (creates then deletes a test user).
 * Usage: npm run db:test-registration
 */
import ws from "ws";

if (!globalThis.WebSocket) {
  globalThis.WebSocket = ws as unknown as typeof WebSocket;
}

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { getSupabaseUrl, getSupabaseAnonKey } from "../src/lib/supabase/env";
import { signUpWithRole, checkUsernameAvailable } from "../src/lib/actions/auth";
import { createAdminClient } from "../src/lib/supabase/admin";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const url = getSupabaseUrl();
const anonKey = getSupabaseAnonKey();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey || !anonKey) {
  console.error("Missing Supabase env vars in .env.local");
  process.exit(1);
}

async function cleanup(userId: string) {
  const admin = createAdminClient();
  await admin.from("students").delete().eq("user_id", userId);
  await admin.from("profiles").delete().eq("id", userId);
  await admin.auth.admin.deleteUser(userId);
}

async function signInWithPassword(email: string, password: string) {
  const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  return { ok: res.ok, status: res.status, body: await res.text() };
}

async function main() {
  const suffix = Date.now();
  const email = `regtest+${suffix}@example.com`;
  const password = "TestPass123!";
  const username = `test_${String(suffix).slice(-8)}`;

  const admin = createAdminClient();
  const { data: course } = await admin
    .from("courses")
    .select("id, name")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!course) {
    console.error("No courses in database — seed courses first.");
    process.exit(1);
  }

  console.log("Running signUpWithRole…");
  const user = await signUpWithRole(email, password, "Registration Test", "student", {
    displayName: "Registration Test",
    username,
    nicNumber: "200012345678",
    phone: "+94771234567",
    studyTrack: "al",
    examYear: "2027",
    courseId: course.id,
    courseName: course.name,
    email,
    password,
  });

  try {
    const { data: row, error: readError } = await admin
      .from("students")
      .select("username, index_number, nic_number, phone, notify_email, course_id, student_id, display_name, exam_year, ict_grade")
      .eq("user_id", user.id)
      .single();

    if (readError || !row) {
      console.error("Student read failed:", readError?.message);
      process.exit(1);
    }

    const expectedStudentId = `ICTF-${username.toUpperCase()}`;
    const generatedIndex = row.index_number;
    const ok =
      row.username === username &&
      typeof generatedIndex === "string" &&
      generatedIndex.startsWith("ICTF-2027-AL-") &&
      row.phone === "+94771234567" &&
      row.notify_email === true &&
      row.course_id === course.id &&
      row.student_id === expectedStudentId &&
      row.display_name === "Registration Test" &&
      row.exam_year === "2027" &&
      row.ict_grade === null;

    if (!ok) {
      console.error("Student row mismatch:", row);
      process.exit(1);
    }

    console.log("Student row OK (auto index:", generatedIndex, ")");

    const signIn = await signInWithPassword(email, password);
    if (!signIn.ok) {
      console.error("Sign-in failed:", signIn.status, signIn.body.slice(0, 200));
      process.exit(1);
    }
    console.log("Sign-in OK");

    const available = await checkUsernameAvailable(username);
    if (available) {
      console.error("Username should not be available after registration");
      process.exit(1);
    }
    console.log("Username uniqueness OK");
  } finally {
    console.log("Cleaning up test user…");
    await cleanup(user.id);
  }

  console.log("\nRegistration backend test passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
