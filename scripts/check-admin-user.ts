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

async function main() {
  const email = (process.argv[2] ?? "vithoosan@ictf.lk").trim().toLowerCase();
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id, email, role, display_name")
    .eq("email", email)
    .maybeSingle();

  const { data: listed } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const authUser = listed?.users.find((u) => u.email?.toLowerCase() === email) ?? null;

  const admins = (listed?.users ?? [])
    .map((u) => {
      const metaRole = typeof u.app_metadata?.role === "string" ? u.app_metadata.role : null;
      return { email: u.email, role: metaRole, confirmed: !!u.email_confirmed_at };
    })
    .filter((u) => u.role === "admin" || u.role === "super_admin");

  console.log(
    JSON.stringify(
      {
        queriedEmail: email,
        profile,
        authExists: !!authUser,
        authConfirmed: !!authUser?.email_confirmed_at,
        authRole: authUser?.app_metadata?.role ?? null,
        adminUsers: admins,
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
