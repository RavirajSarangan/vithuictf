/**
 * Resend domain setup helper for ictf.lk (LankaHost DNS).
 *
 * Usage:
 *   npx tsx scripts/verify-resend-domain.ts           # show records + DNS check
 *   npx tsx scripts/verify-resend-domain.ts --verify  # trigger Resend verification
 *   npx tsx scripts/verify-resend-domain.ts --test you@example.com
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { promises as dns } from "dns";
import { Resend } from "resend";

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

const DOMAIN = "ictf.lk";
const args = process.argv.slice(2);
const shouldVerify = args.includes("--verify");
const showFull = args.includes("--full");
const shouldWait = args.includes("--wait");
const testEmail = args.find((a) => a.includes("@") && !a.startsWith("-"));

type ResendRecord = {
  record: string;
  name: string;
  type: string;
  value: string;
  priority?: number;
  status?: string;
};

function fqdn(name: string, domain: string): string {
  if (!name || name === "@") return domain;
  return `${name}.${domain}`;
}

async function lookupTxt(host: string): Promise<string[][]> {
  try {
    return await dns.resolveTxt(host);
  } catch {
    return [];
  }
}

async function lookupMx(host: string): Promise<string[]> {
  try {
    const rows = await dns.resolveMx(host);
    return rows.map((r) => `${r.priority} ${r.exchange}`);
  } catch {
    return [];
  }
}

async function checkRecord(record: ResendRecord, domain: string) {
  const host = fqdn(record.name, domain);
  if (record.type === "TXT") {
    const values = await lookupTxt(host);
    const flat = values.map((chunks) => chunks.join(""));
    const ok = flat.some((v) => v.includes(record.value) || record.value.includes(v));
    return { host, ok, found: flat };
  }
  if (record.type === "MX") {
    const values = await lookupMx(host);
    const ok = values.some((v) => v.includes(record.value));
    return { host, ok, found: values };
  }
  return { host, ok: false, found: [] as string[] };
}

async function main() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim();

  if (!apiKey) {
    console.error("Missing RESEND_API_KEY in .env.local");
    process.exit(1);
  }

  console.log("\n=== Resend config ===");
  console.log(`RESEND_FROM_EMAIL: ${fromEmail ?? "(not set)"}`);
  console.log(`Expected domain:   ${DOMAIN}`);

  const resend = new Resend(apiKey);
  const { data: list, error: listError } = await resend.domains.list();
  if (listError) {
    console.error("Failed to list domains:", listError.message);
    process.exit(1);
  }

  const domain = list?.data?.find((d) => d.name === DOMAIN);
  if (!domain) {
    console.error(`Domain ${DOMAIN} not found in Resend. Add it at https://resend.com/domains`);
    process.exit(1);
  }

  const { data: detail, error: detailError } = await resend.domains.get(domain.id);
  if (detailError || !detail) {
    console.error("Failed to get domain:", detailError?.message ?? "unknown");
    process.exit(1);
  }

  console.log(`\n=== Resend domain: ${detail.name} ===`);
  console.log(`Status: ${detail.status}`);
  console.log(`Region: ${detail.region}`);

  const records = (detail.records ?? []) as ResendRecord[];

  console.log("\n=== DNS records to add at LankaHost (dns*.lankahost.net) ===\n");
  console.log("| Type | Host / Name | Value | Priority |");
  console.log("|------|-------------|-------|----------|");
  for (const r of records) {
    const hostLabel = r.name === "@" ? "@" : r.name;
    const priority = r.priority ?? "";
    const value =
      showFull || r.value.length <= 60
        ? r.value
        : `${r.value.slice(0, 57)}...`;
    console.log(`| ${r.type} | ${hostLabel} | ${value} | ${priority} |`);
  }

  if (showFull) {
    console.log("\n=== Copy-paste blocks (LankaHost) ===\n");
    for (const r of records) {
      console.log(`--- ${r.record} ${r.type} (${r.name}) ---`);
      console.log(`Host: ${r.name === "@" ? "@" : r.name}`);
      console.log(`Type: ${r.type}`);
      if (r.priority !== undefined) console.log(`Priority: ${r.priority}`);
      console.log(`Value: ${r.value}`);
      console.log("");
    }
  }

  console.log("\nLankaHost panel: use Host/Name exactly as shown (e.g. `send`, `resend._domainkey`).");
  console.log("Do NOT change the root SPF on @ — Resend uses the `send` subdomain.\n");

  console.log("=== Public DNS check ===\n");
  let allOk = true;
  for (const r of records) {
    const result = await checkRecord(r, DOMAIN);
    const status = result.ok ? "OK" : "MISSING";
    if (!result.ok) allOk = false;
    console.log(`${status}  ${r.type}  ${result.host}`);
    if (result.found.length) {
      for (const f of result.found) console.log(`       → ${f}`);
    }
  }

  if (shouldVerify) {
    console.log("\n=== Triggering Resend verification ===");
    const { error: verifyError } = await resend.domains.verify(domain.id);
    if (verifyError) {
      console.error("Verify failed:", verifyError.message);
      process.exit(1);
    }
    console.log("Verification started. Re-run this script in a few minutes to check status.");

    const { data: refreshed } = await resend.domains.get(domain.id);
    if (refreshed) console.log(`Current status: ${refreshed.status}`);
  } else if (!allOk) {
    console.log("\nAdd the records above in LankaHost, then run:");
    console.log("  npx tsx scripts/verify-resend-domain.ts --verify");
  }

  if (testEmail) {
    if (!fromEmail) {
      console.error("Set RESEND_FROM_EMAIL before sending a test email.");
      process.exit(1);
    }
    if (detail.status !== "verified") {
      console.warn(
        `\nWarning: domain status is "${detail.status}", not "verified". Test send may fail.\n`
      );
    }
    console.log(`\n=== Sending test email to ${testEmail} ===`);
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: testEmail,
      subject: "ICTF Resend domain test",
      html: "<p>If you received this, Resend domain verification is working.</p>",
      text: "If you received this, Resend domain verification is working.",
    });
    if (error) {
      console.error("Send failed:", error.message);
      process.exit(1);
    }
    console.log("Sent. Message id:", data?.id);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
