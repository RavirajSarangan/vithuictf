/**
 * Sync pass paper Drive links from a shared Google Drive folder tree.
 *
 * Usage:
 *   npx tsx scripts/sync-pass-papers-from-drive.ts --dry-run
 *   npx tsx scripts/sync-pass-papers-from-drive.ts --publish --include-files
 */
import ws from "ws";

if (!globalThis.WebSocket) {
  globalThis.WebSocket = ws as unknown as typeof WebSocket;
}

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { createAdminClient } from "../src/lib/supabase/admin";
import {
  syncPassPapersFromDriveInternal,
} from "../src/lib/pass-papers/drive-sync";
import { DEFAULT_DRIVE_ROOT_URL, isGoogleDriveConfigured } from "../src/lib/pass-papers/drive-sync-types";
import type { PassPaperExamType } from "../src/types";

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

function parseArgs(argv: string[]) {
  let rootUrl = DEFAULT_DRIVE_ROOT_URL;
  let dryRun = false;
  let publish = false;
  let includeFiles = false;
  const examTypes: PassPaperExamType[] = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dry-run") dryRun = true;
    else if (arg === "--publish") publish = true;
    else if (arg === "--include-files") includeFiles = true;
    else if (arg === "--al") examTypes.push("al");
    else if (arg === "--ol") examTypes.push("ol");
    else if (arg === "--url" && argv[i + 1]) {
      rootUrl = argv[i + 1]!;
      i += 1;
    }
  }

  return {
    rootUrl,
    dryRun,
    publish,
    includeFiles,
    examTypes: examTypes.length > 0 ? examTypes : (["al", "ol"] as PassPaperExamType[]),
  };
}

loadEnvLocal();

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (!isGoogleDriveConfigured()) {
    console.error(
      "Missing Google Drive credentials. Set GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON or GOOGLE_DRIVE_SERVICE_ACCOUNT_PATH in .env.local"
    );
    process.exit(1);
  }

  const supabase = createAdminClient();
  console.log("Syncing pass papers from Drive…");
  console.log(JSON.stringify(options, null, 2));

  const report = await syncPassPapersFromDriveInternal(supabase, options);
  console.log("\n--- Sync report ---");
  console.log(JSON.stringify(report, null, 2));

  if (report.unmatched.length > 0) {
    console.log(`\n${report.unmatched.length} unmatched item(s). Review names/paths in Drive.`);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
