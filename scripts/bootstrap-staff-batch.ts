/**
 * One-off batch staff bootstrap. Creates "teacher" role accounts (shown as
 * "Staff" in the admin People UI) directly via the Supabase admin client,
 * mirroring addStaffMember() in src/lib/actions/admin.ts.
 *
 * Usage:
 *   npx tsx scripts/bootstrap-staff-batch.ts
 */
import ws from "ws";

if (!globalThis.WebSocket) {
  globalThis.WebSocket = ws as unknown as typeof WebSocket;
}

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { createAdminClient } from "../src/lib/supabase/admin";
import { deriveStaffUsername } from "../src/lib/staff-username";

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

type StaffSeed = {
  displayName: string;
  staffUsername: string;
  email: string;
  password: string;
};

const STAFF: StaffSeed[] = [
  { displayName: "S.N. Vithoo", staffUsername: "vithoo", email: "vithoo@ictf.lk", password: "ICTF@Vithoo2026!" },
  { displayName: "Manojan M", staffUsername: "manojan", email: "manojan@ictf.lk", password: "ICTF@Manojan2026!" },
  { displayName: "Jegapraveen J", staffUsername: "jegapraveen", email: "jegapraveen@ictf.lk", password: "ICTF@Jega2026!" },
  { displayName: "M.S.C.K Rathnayake", staffUsername: "rathnayake", email: "rathnayake@ictf.lk", password: "ICTF@MSCK2026!" },
  { displayName: "Tharani R", staffUsername: "tharani", email: "tharani@ictf.lk", password: "ICTF@Tharani2026!" },
  { displayName: "Suha Anas", staffUsername: "suha", email: "suha@ictf.lk", password: "ICTF@Suha2026!" },
  { displayName: "Kirubalini S", staffUsername: "kirubalini", email: "kirubalini@ictf.lk", password: "ICTF@Kirubalini2026!" },
];

async function main() {
  const admin = createAdminClient();

  for (const seed of STAFF) {
    const normalizedEmail = seed.email.trim().toLowerCase();

    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id, role")
      .eq("email", normalizedEmail)
      .maybeSingle();
    if (existingProfile) {
      console.log(`Skip ${normalizedEmail}: already registered as ${existingProfile.role}`);
      continue;
    }

    const { data: existingTeacher } = await admin
      .from("teachers")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();
    if (existingTeacher) {
      console.log(`Skip ${normalizedEmail}: teacher row already exists`);
      continue;
    }

    const staffUsername = deriveStaffUsername(normalizedEmail, seed.displayName, seed.staffUsername);

    const { data: usernameTaken } = await admin
      .from("teachers")
      .select("id")
      .eq("staff_username", staffUsername)
      .maybeSingle();
    if (usernameTaken) {
      console.log(`Skip ${normalizedEmail}: staff_username "${staffUsername}" already taken`);
      continue;
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: normalizedEmail,
      password: seed.password,
      email_confirm: true,
      app_metadata: { role: "teacher" },
      user_metadata: { display_name: seed.displayName },
    });
    if (createError || !created.user) {
      console.error(`Failed to create auth user for ${normalizedEmail}: ${createError?.message}`);
      continue;
    }

    const { error: profileError } = await admin.from("profiles").upsert(
      { id: created.user.id, email: normalizedEmail, display_name: seed.displayName, role: "teacher" },
      { onConflict: "id" }
    );
    if (profileError) {
      console.error(`Failed to upsert profile for ${normalizedEmail}: ${profileError.message}`);
      await admin.auth.admin.deleteUser(created.user.id);
      continue;
    }

    const { error: teacherError } = await admin.from("teachers").insert({
      user_id: created.user.id,
      display_name: seed.displayName,
      email: normalizedEmail,
      staff_username: staffUsername,
      subjects: [],
      course_ids: [],
      certified: false,
      active: true,
    });
    if (teacherError) {
      console.error(`Failed to insert teacher row for ${normalizedEmail}: ${teacherError.message}`);
      await admin.auth.admin.deleteUser(created.user.id);
      continue;
    }

    console.log(`Created staff: ${normalizedEmail} (username=${staffUsername})`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
