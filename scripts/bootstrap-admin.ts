/**
 * One-off admin bootstrap. Usage:
 *   npx tsx scripts/bootstrap-admin.ts <email> <password> [displayName]
 */
import ws from "ws";

if (!globalThis.WebSocket) {
  globalThis.WebSocket = ws as unknown as typeof WebSocket;
}

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
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

const email = (process.argv[2] ?? "admin@ictf.lk").trim().toLowerCase();
const password = process.argv[3] ?? "";
const displayName = process.argv[4] ?? "ICTF Admin";

if (!password || password.length < 8) {
  console.error("Usage: npx tsx scripts/bootstrap-admin.ts <email> <password> [displayName]");
  process.exit(1);
}

async function main() {
  const admin = createAdminClient();

  const { data: listed, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listError) throw new Error(listError.message);

  const authUser = listed.users.find((user) => user.email?.toLowerCase() === email) ?? null;

  const { data: profile } = await admin
    .from("profiles")
    .select("id, role, email")
    .eq("email", email)
    .maybeSingle();

  const userId = authUser?.id ?? profile?.id;

  if (userId) {
    const { error: pwError } = await admin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
      app_metadata: { role: "admin" },
      user_metadata: { display_name: displayName },
    });
    if (pwError) throw new Error(pwError.message);

    const { error: roleError } = await admin
      .from("profiles")
      .upsert(
        {
          id: userId,
          email,
          display_name: displayName,
          role: "admin",
        },
        { onConflict: "id" }
      );
    if (roleError) throw new Error(roleError.message);

    console.log(`Updated admin: ${email} (role=admin)`);
    return;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: "admin" },
    user_metadata: { display_name: displayName },
  });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("No user returned");

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: data.user.id,
      email,
      display_name: displayName,
      role: "admin",
    },
    { onConflict: "id" }
  );
  if (profileError) throw new Error(profileError.message);

  console.log(`Created admin: ${email} (role=admin)`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
