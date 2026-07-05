import { NextResponse } from "next/server";
import { isAdminClientConfigured } from "@/lib/supabase/admin";
import { runFeeReminders } from "@/lib/billing/fee-reminders";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdminClientConfigured()) {
    return NextResponse.json({ error: "Admin client not configured" }, { status: 500 });
  }

  try {
    const stats = await runFeeReminders();
    return NextResponse.json({ ok: true, stats });
  } catch (error) {
    console.error("[cron/fee-reminders]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Fee reminders failed" },
      { status: 500 }
    );
  }
}
