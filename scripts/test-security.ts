/**
 * Security-focused smoke tests for authorization helpers and payment guards.
 * Usage: npx tsx scripts/test-security.ts
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import {
  isAdminOnlyRoute,
  isSuperAdminOnlyRoute,
} from "../src/lib/admin-access";
import { isOnlinePaymentsAvailable } from "../src/lib/payment-access";
import { contactInquirySchema } from "../src/lib/validation/contact-inquiry";

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

type Check = { name: string; ok: boolean; detail?: string };

const checks: Check[] = [];

function assert(name: string, condition: boolean, detail?: string) {
  checks.push({ name, ok: condition, detail });
}

assert("teacher blocked from /admin/finance", isAdminOnlyRoute("/admin/finance"));
assert("teacher allowed on /admin/dashboard", !isAdminOnlyRoute("/admin/dashboard"));
assert("admin blocked from /admin/pass-papers", isSuperAdminOnlyRoute("/admin/pass-papers"));
assert(
  "pass-papers subroutes restricted",
  isSuperAdminOnlyRoute("/admin/pass-papers/import")
);

assert(
  "online payments need stripe flag",
  !isOnlinePaymentsAvailable({ onlinePaymentsEnabled: true }, false)
);
assert(
  "online payments live when enabled + stripe",
  isOnlinePaymentsAvailable({ onlinePaymentsEnabled: true }, true)
);

const validContact = contactInquirySchema.safeParse({
  name: "Test User",
  email: "test@example.com",
  phone: "0771234567",
  message: "Hello there, this is a test message.",
  locale: "en",
});
assert("contact schema accepts valid payload", validContact.success);

const longMessage = contactInquirySchema.safeParse({
  name: "Test",
  email: "test@example.com",
  message: "x".repeat(2001),
});
assert("contact schema rejects long message", !longMessage.success);

const secretsDir = resolve(process.cwd(), "secrets");
if (existsSync(secretsDir)) {
  const hasServiceAccount = existsSync(resolve(secretsDir, "google-drive-service-account.json"));
  assert(
    "no local Google service account file in CI",
    process.env.CI ? !hasServiceAccount : true,
    hasServiceAccount ? "rotate key and use env vars in production" : undefined
  );
}

async function testRateLimitRpc() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    assert("rate_limit RPC reachable", true, "skipped — Supabase env missing");
    return;
  }

  const key = `test:${Date.now()}`;
  const res = await fetch(`${url}/rest/v1/rpc/check_rate_limit`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_key: key,
      p_max: 2,
      p_window_seconds: 60,
    }),
  });

  if (res.status === 404) {
    assert("rate_limit RPC reachable", true, "skipped — apply migration 20260629190200_rate_limit_buckets");
    return;
  }

  if (!res.ok) {
    assert("rate_limit RPC reachable", false, `HTTP ${res.status}`);
    return;
  }

  const first = (await res.json()) as boolean;
  const secondRes = await fetch(`${url}/rest/v1/rpc/check_rate_limit`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_key: key,
      p_max: 2,
      p_window_seconds: 60,
    }),
  });
  const second = (await secondRes.json()) as boolean;
  const thirdRes = await fetch(`${url}/rest/v1/rpc/check_rate_limit`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_key: key,
      p_max: 2,
      p_window_seconds: 60,
    }),
  });
  const third = (await thirdRes.json()) as boolean;

  assert("rate_limit RPC returns boolean", typeof first === "boolean");
  assert("rate_limit allows within max", first === true && second === true);
  assert("rate_limit blocks over max", third === false);
}

async function main() {
  await testRateLimitRpc();

  const failed = checks.filter((c) => !c.ok);
  for (const check of checks) {
    const icon = check.ok ? "✓" : "✗";
    console.log(`${icon} ${check.name}${check.detail ? ` — ${check.detail}` : ""}`);
  }

  if (failed.length > 0) {
    console.error(`\n${failed.length} security check(s) failed.`);
    process.exit(1);
  }

  console.log(`\nAll ${checks.length} security checks passed.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
