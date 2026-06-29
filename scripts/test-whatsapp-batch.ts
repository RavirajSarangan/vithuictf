/**
 * Send a test WhatsApp batch template using credentials from .env.local
 *
 * Usage:
 *   npm run whatsapp:test -- --phone 94771234567 --template announcement
 *   npm run whatsapp:test -- --phone 94771234567 --template last-class
 *
 * Options:
 *   --phone       Sri Lanka mobile (07… or 94…)
 *   --template    announcement | last-class  (default: announcement)
 *   --title       Announcement title (default: ICTF test)
 *   --body        Announcement body
 *   --dry-run     Print payload only, do not send
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { getWhatsAppConfig } from "../src/lib/whatsapp/config";
import { sendWhatsAppTemplate } from "../src/lib/whatsapp/client";

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

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

async function main() {
  loadEnvLocal();

  const phone = arg("phone");
  const templateArg = arg("template") ?? "announcement";
  const dryRun = hasFlag("dry-run");

  if (!phone) {
    console.error("Missing --phone (e.g. 94771234567)");
    process.exit(1);
  }

  const config = getWhatsAppConfig();
  if (!config) {
    console.error("WhatsApp not configured. Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in .env.local");
    process.exit(1);
  }

  const template = templateArg === "last-class" ? "last_class" : "announcement";
  const templateName =
    template === "last_class" ? config.lastClassTemplate : config.announcementTemplate;

  console.log("WhatsApp batch template test\n");
  console.log(`  Phone number ID : ${config.phoneNumberId}`);
  console.log(`  API version     : ${config.apiVersion}`);
  console.log(`  Template name   : ${templateName}`);
  console.log(`  Recipient       : ${phone}`);
  console.log(`  Mode            : ${template}\n`);

  if (dryRun) {
    console.log("Dry run — not sending.");
    process.exit(0);
  }

  const result = await sendWhatsAppTemplate({
    to: phone,
    template,
    variables:
      template === "last_class"
        ? {
            studentName: "Test Student",
            batchName: "OL ICT 2026 — Batch A",
            classDate: new Date().toISOString().slice(0, 10),
            classTime: "18:00",
            zoomLink: "https://zoom.us/j/example",
          }
        : {
            title: arg("title") ?? "ICTF test message",
            body:
              arg("body") ??
              "This is a test announcement from the batch notification system. If you received this, WhatsApp is wired correctly.",
          },
  });

  if (result.ok) {
    console.log("Sent successfully.");
    console.log(`  Message ID: ${result.messageId ?? "(none)"}`);
    process.exit(0);
  }

  if (result.skipped) {
    console.error(`Skipped: ${result.error}`);
    process.exit(1);
  }

  console.error(`Failed: ${result.error}`);
  console.error("\nCommon fixes:");
  console.error("  • Template name must match Meta exactly (see docs/whatsapp-batch-templates.md)");
  console.error("  • Template must be APPROVED in Meta Business Manager");
  console.error("  • Recipient must be added as a test number on the WhatsApp app (dev mode)");
  process.exit(1);
}

void main();
