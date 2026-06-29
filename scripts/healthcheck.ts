/**
 * Full-stack connectivity health check (DB, realtime, email, payments, build env).
 * Usage: npm run healthcheck
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { spawn } from "child_process";

type Status = "ok" | "warn" | "fail";

interface Check {
  name: string;
  status: Status;
  detail: string;
}

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    let value = trimmed.slice(eq + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

function run(command: string, args: string[]): Promise<number> {
  return new Promise((resolvePromise) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: process.platform === "win32",
      env: process.env,
    });
    child.on("close", (code) => resolvePromise(code ?? 1));
    child.on("error", () => resolvePromise(1));
  });
}

function envCheck(): Check[] {
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ] as const;
  const anon =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const checks: Check[] = [];

  for (const key of required) {
    checks.push({
      name: key,
      status: process.env[key]?.trim() ? "ok" : "fail",
      detail: process.env[key]?.trim() ? "set" : "missing",
    });
  }

  checks.push({
    name: "Supabase anon/publishable key",
    status: anon?.trim() ? "ok" : "fail",
    detail: anon?.trim() ? "set" : "missing",
  });

  checks.push({
    name: "STRIPE_SECRET_KEY",
    status: process.env.STRIPE_SECRET_KEY?.trim() ? "ok" : "warn",
    detail: process.env.STRIPE_SECRET_KEY?.trim()
      ? "set"
      : "missing — monthly institute fees disabled",
  });

  checks.push({
    name: "STRIPE_WEBHOOK_SECRET",
    status: process.env.STRIPE_WEBHOOK_SECRET?.trim() ? "ok" : "warn",
    detail: process.env.STRIPE_WEBHOOK_SECRET?.trim()
      ? "set"
      : "missing — payment webhooks will not record",
  });

  checks.push({
    name: "RESEND_API_KEY",
    status: process.env.RESEND_API_KEY?.trim() ? "ok" : "warn",
    detail: process.env.RESEND_API_KEY?.trim() ? "set" : "missing — emails disabled",
  });

  const from = process.env.RESEND_FROM_EMAIL?.trim() ?? "";
  const fromOk = /^[^<>\s]+@[^<>\s]+$/.test(from) || /^.+<[^<>@\s]+@[^<>@\s]+>$/.test(from);
  checks.push({
    name: "RESEND_FROM_EMAIL format",
    status: !from ? "warn" : fromOk ? "ok" : "fail",
    detail: !from ? "not set" : fromOk ? "valid" : "invalid — use Name <email@domain>",
  });

  checks.push({
    name: "WHATSAPP_ACCESS_TOKEN",
    status: process.env.WHATSAPP_ACCESS_TOKEN?.trim() ? "ok" : "warn",
    detail: process.env.WHATSAPP_ACCESS_TOKEN?.trim()
      ? "set"
      : "missing — WhatsApp notifications disabled",
  });

  checks.push({
    name: "WHATSAPP_PHONE_NUMBER_ID",
    status: process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() ? "ok" : "warn",
    detail: process.env.WHATSAPP_PHONE_NUMBER_ID?.trim()
      ? "set"
      : "missing — WhatsApp notifications disabled",
  });

  const announcementTemplate =
    process.env.WHATSAPP_ANNOUNCEMENT_TEMPLATE?.trim() ||
    process.env.WHATSAPP_TEMPLATE_NAME?.trim() ||
    "ictf_batch_announcement";
  const lastClassTemplate =
    process.env.WHATSAPP_LAST_CLASS_TEMPLATE?.trim() ||
    process.env.WHATSAPP_LAST_CLASS_TEMPLATE_NAME?.trim() ||
    "ictf_batch_last_class";

  checks.push({
    name: "WHATSAPP_ANNOUNCEMENT_TEMPLATE",
    status: "ok",
    detail: announcementTemplate,
  });

  checks.push({
    name: "WHATSAPP_LAST_CLASS_TEMPLATE",
    status: "ok",
    detail: lastClassTemplate,
  });

  checks.push({
    name: "CRON_SECRET",
    status: process.env.CRON_SECRET?.trim() ? "ok" : "warn",
    detail: process.env.CRON_SECRET?.trim()
      ? "set — batch notification cron enabled"
      : "missing — /api/cron/batch-notifications will reject requests",
  });

  const secretsDir = resolve(process.cwd(), "secrets");
  const hasLocalServiceAccount =
    existsSync(secretsDir) &&
    existsSync(resolve(secretsDir, "google-drive-service-account.json"));
  checks.push({
    name: "Local secrets/ credentials",
    status: hasLocalServiceAccount ? "warn" : "ok",
    detail: hasLocalServiceAccount
      ? "google-drive-service-account.json on disk — use env vars in production and rotate if shared"
      : "no committed service account file detected",
  });

  return checks;
}

function printChecks(title: string, checks: Check[]) {
  console.log(`\n${title}`);
  for (const row of checks) {
    const icon = row.status === "ok" ? "OK" : row.status === "warn" ? "WARN" : "FAIL";
    console.log(`  ${icon.padEnd(5)} ${row.name}: ${row.detail}`);
  }
}

async function main() {
  console.log("ICTF SLMP — full-stack health check\n");

  const envChecks = envCheck();
  printChecks("Environment", envChecks);

  console.log("\nDatabase (Supabase REST)…");
  const dbCode = await run("npx", ["tsx", "scripts/verify-supabase-connection.ts"]);

  console.log("\nRealtime (Supabase WebSocket)…");
  const rtCode = await run("npx", ["tsx", "scripts/verify-realtime-connection.ts"]);

  console.log("\nEmail domain (Resend DNS)…");
  const emailCode = await run("npx", ["tsx", "scripts/verify-resend-domain.ts"]);

  console.log("\nSecurity smoke tests…");
  const securityCode = await run("npx", ["tsx", "scripts/test-security.ts"]);

  const failed =
    envChecks.some((c) => c.status === "fail") ||
    dbCode !== 0 ||
    rtCode !== 0 ||
    securityCode !== 0;
  const warnings =
    envChecks.some((c) => c.status === "warn") || emailCode !== 0;

  console.log("\n--- Summary ---");
  console.log(`Database:  ${dbCode === 0 ? "OK" : "FAIL"}`);
  console.log(`Realtime:  ${rtCode === 0 ? "OK" : "FAIL"}`);
  console.log(`Security:  ${securityCode === 0 ? "OK" : "FAIL"}`);
  console.log(`Email DNS: ${emailCode === 0 ? "OK" : "WARN (add LankaHost DNS records)"}`);

  if (failed) {
    console.error("\nHealth check failed — fix FAIL items above.");
    process.exit(1);
  }

  if (warnings) {
    console.warn("\nHealth check passed with warnings — Stripe/email may be limited.");
    process.exit(0);
  }

  console.log("\nAll checks passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
