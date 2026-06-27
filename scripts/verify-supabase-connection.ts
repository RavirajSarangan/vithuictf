/**
 * Verify Supabase env, REST connectivity, and core tables.
 * Usage: npm run db:verify
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { getSupabaseAnonKey, getSupabaseUrl } from "../src/lib/supabase/env";

const CORE_TABLES: Array<{ table: string; select: string }> = [
  { table: "profiles", select: "id" },
  { table: "students", select: "id" },
  { table: "courses", select: "id" },
  { table: "teachers", select: "id" },
  { table: "parents", select: "id" },
  { table: "results", select: "id" },
  { table: "resources", select: "id" },
  { table: "achievements", select: "id" },
  { table: "badge_definitions", select: "id" },
  { table: "leaderboard", select: "id" },
  { table: "exams", select: "id" },
  { table: "activities", select: "id" },
  { table: "payments", select: "id" },
  { table: "certificates", select: "id" },
  { table: "notifications", select: "id" },
  { table: "parent_student_links", select: "parent_id" },
  { table: "site_stats", select: "id" },
  { table: "network_stats", select: "id" },
  { table: "featured_rankings", select: "id" },
  { table: "companies", select: "id" },
  { table: "class_programs", select: "id" },
  { table: "paper_centers", select: "id" },
  { table: "home_about", select: "id" },
  { table: "faqs", select: "id" },
  { table: "success_stories", select: "id" },
  { table: "calendar_sessions", select: "id" },
  { table: "subject_categories", select: "id" },
  { table: "blog_categories", select: "id" },
  { table: "blog_posts", select: "id" },
];

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
const anon = getSupabaseAnonKey();
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("Supabase connection check\n");
console.log(`URL:              ${url ? "set" : "MISSING"}`);
console.log(`Anon key:         ${anon ? "set" : "MISSING"}`);
console.log(`Service role key: ${service ? "set" : "MISSING (registration will fail)"}`);

async function checkTable({ table, select }: { table: string; select: string }) {
  const res = await fetch(`${url}/rest/v1/${table}?select=${select}&limit=1`, {
    headers: {
      apikey: anon,
      Authorization: `Bearer ${anon}`,
    },
  });
  return { table, status: res.status, ok: res.ok };
}

async function main() {
  if (!url || !anon) {
    console.error("\nConfigure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
    process.exit(1);
  }

  const results = await Promise.all(CORE_TABLES.map(checkTable));
  const failed = results.filter((r) => !r.ok);

  console.log("\nTable checks:");
  for (const row of results) {
    const icon = row.ok ? "OK" : "FAIL";
    console.log(`  ${icon.padEnd(5)} ${row.table} (HTTP ${row.status})`);
  }

  console.log(`\n${results.length - failed.length}/${results.length} tables reachable`);

  const regCols = await fetch(
    `${url}/rest/v1/students?select=username,index_number,phone,nic_number,notify_email&limit=1`,
    {
    headers: {
      apikey: anon,
      Authorization: `Bearer ${anon}`,
    },
  });
  const regOk = regCols.ok;
  console.log(`\nRegistration columns: ${regOk ? "OK" : "MISSING — run npm run db:migrate or apply SQL in Supabase"}`);
  if (!regOk) {
    const body = await regCols.text();
    console.warn(body.slice(0, 200));
    process.exit(2);
  }

  const platformRes = await fetch(
    `${url}/rest/v1/platform_settings?select=site_public_mode,marketing_coming_soon_enabled&id=eq.1`,
    {
      headers: {
        apikey: anon,
        Authorization: `Bearer ${anon}`,
      },
    }
  );
  const platformOk = platformRes.ok;
  console.log(
    `Site mode column: ${platformOk ? "OK" : "MISSING — apply supabase/migrations/20240625220000_site_public_mode.sql"}`
  );
  if (!platformOk) {
    const body = await platformRes.text();
    console.warn(body.slice(0, 200));
    process.exit(2);
  }

  const platform = (await platformRes.json()) as {
    site_public_mode?: string;
    marketing_coming_soon_enabled?: boolean;
  }[];
  const row = platform[0];
  if (row) {
    console.log(`  site_public_mode: ${row.site_public_mode ?? "live"}`);
    console.log(`  marketing_coming_soon_enabled: ${row.marketing_coming_soon_enabled ?? true}`);
  }

  if (failed.length > 0) {
    console.warn("\nMissing tables — apply supabase/all-migrations-combined.sql in the SQL Editor.");
    process.exit(2);
  }

  if (!service) {
    console.warn("\nAdd SUPABASE_SERVICE_ROLE_KEY to enable registration and admin uploads.");
    process.exit(2);
  }

  console.log("\nBackend ready for registration and portal use.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
