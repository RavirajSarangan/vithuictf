/**
 * Backfill session_charges from existing attendance records.
 * Usage: npx tsx scripts/backfill-session-charges.ts
 */
import ws from "ws";

if (!globalThis.WebSocket) {
  globalThis.WebSocket = ws as unknown as typeof WebSocket;
}

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { createAdminClient } from "../src/lib/supabase/admin";
import { syncChargesForSession } from "../src/lib/billing/session-charges";

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
  const admin = createAdminClient();

  const { data: attendance, error } = await admin
    .from("attendance_records")
    .select("session_id, student_id, status")
    .in("status", ["present", "late"]);

  if (error) throw new Error(error.message);

  const bySession = new Map<string, { studentId: string; status: "present" | "late" }[]>();

  for (const row of attendance ?? []) {
    const list = bySession.get(row.session_id) ?? [];
    list.push({
      studentId: row.student_id,
      status: row.status as "present" | "late",
    });
    bySession.set(row.session_id, list);
  }

  let synced = 0;
  for (const [sessionId, records] of bySession) {
    await syncChargesForSession(admin, sessionId, records);
    synced += records.length;
  }

  console.log(
    `Backfill complete: ${bySession.size} sessions, ${synced} attendance rows processed.`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
