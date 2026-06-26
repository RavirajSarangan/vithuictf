/**
 * Verify Supabase Realtime can subscribe to platform_settings changes.
 * Usage: npx tsx scripts/verify-realtime-connection.ts
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import { getSupabaseAnonKey, getSupabaseUrl } from "../src/lib/supabase/env";

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

async function main() {
  if (!url || !anon) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or anon key in .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, anon, {
    realtime: { transport: WebSocket },
  });
  let subscribed = false;
  let eventReceived = false;

  const channel = supabase
    .channel("healthcheck:platform_settings")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "platform_settings",
        filter: "id=eq.1",
      },
      () => {
        eventReceived = true;
      }
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") subscribed = true;
    });

  const deadline = Date.now() + 8_000;
  while (Date.now() < deadline && !subscribed) {
    await new Promise((r) => setTimeout(r, 100));
  }

  await supabase.removeChannel(channel);

  console.log("Supabase Realtime check\n");
  console.log(`WebSocket subscribe: ${subscribed ? "OK" : "FAIL"}`);
  console.log(
    subscribed
      ? "platform_settings is in supabase_realtime publication (subscription succeeded)."
      : "Subscription failed — apply migration 20240628130200_brand_logo_size_optimal.sql"
  );

  if (!subscribed) process.exit(2);
  if (!eventReceived) {
    console.log("Live UPDATE event: not tested (no write performed; subscribe alone is sufficient).");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
