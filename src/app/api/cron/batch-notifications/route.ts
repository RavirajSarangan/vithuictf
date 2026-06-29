import { NextResponse } from "next/server";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import {
  notifyBatchStudentsPortalOnly,
  notifyBatchStudentsWhatsAppLastClass,
} from "@/lib/academics/batch-notifications";

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function tomorrowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function minutesUntil(time: string): number {
  const [h, m] = time.split(":").map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(h, m, 0, 0);
  return (target.getTime() - now.getTime()) / 60000;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdminClientConfigured()) {
    return NextResponse.json({ error: "Admin client not configured" }, { status: 500 });
  }

  const supabase = createAdminClient();
  const today = todayStr();
  const tomorrow = tomorrowStr();
  const stats = {
    classReminders: 0,
    lastClassEve: 0,
    lastClassDay: 0,
  };

  const { data: todaySessions } = await supabase
    .from("class_sessions")
    .select(
      "id, batch_id, session_number, scheduled_date, start_time, status, zoom_link, reminder_sent_at, last_class_notified_at, last_class_eve_notified_at, course_batches(name, batch_code, zoom_link)"
    )
    .eq("scheduled_date", today)
    .eq("status", "scheduled");

  for (const session of todaySessions ?? []) {
    const batchRaw = session.course_batches as unknown;
    const batch = (Array.isArray(batchRaw) ? batchRaw[0] : batchRaw) as {
      name: string;
      batch_code: string;
      zoom_link: string | null;
    } | null;

    if (!session.reminder_sent_at && minutesUntil(session.start_time) <= 30 && minutesUntil(session.start_time) >= -5) {
      const zoom = session.zoom_link ?? batch?.zoom_link ?? null;
      const title = `Class starting soon — ${batch?.name ?? "Batch"}`;
      const body = `Class ${session.session_number} starts at ${session.start_time.slice(0, 5)}.${zoom ? ` Zoom: ${zoom}` : ""}`;
      await notifyBatchStudentsPortalOnly(session.batch_id, title, body, {
        sessionId: session.id,
        kind: "class_reminder",
      });
      await supabase
        .from("class_sessions")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", session.id);
      stats.classReminders += 1;
    }

    const { data: lastSession } = await supabase
      .from("class_sessions")
      .select("id, scheduled_date")
      .eq("batch_id", session.batch_id)
      .neq("status", "cancelled")
      .order("session_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastSession?.id === session.id && !session.last_class_notified_at) {
      await notifyBatchStudentsWhatsAppLastClass({
        batchId: session.batch_id,
        sessionId: session.id,
        batchName: batch?.name ?? "Batch",
        classDate: session.scheduled_date,
        classTime: session.start_time,
        zoomLink: session.zoom_link ?? batch?.zoom_link,
      });
      await supabase
        .from("class_sessions")
        .update({ last_class_notified_at: new Date().toISOString() })
        .eq("id", session.id);
      stats.lastClassDay += 1;
    }
  }

  const { data: tomorrowSessions } = await supabase
    .from("class_sessions")
    .select("id, batch_id, session_number, scheduled_date, start_time, last_class_eve_notified_at, course_batches(name)")
    .eq("scheduled_date", tomorrow)
    .eq("status", "scheduled");

  for (const session of tomorrowSessions ?? []) {
    const { data: lastSession } = await supabase
      .from("class_sessions")
      .select("id")
      .eq("batch_id", session.batch_id)
      .neq("status", "cancelled")
      .order("session_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastSession?.id !== session.id || session.last_class_eve_notified_at) continue;

    const batchRaw = session.course_batches as unknown;
    const batch = (Array.isArray(batchRaw) ? batchRaw[0] : batchRaw) as { name: string } | null;
    const title = `Final class tomorrow — ${batch?.name ?? "Batch"}`;
    const body = `Your last class is tomorrow (${session.scheduled_date}) at ${session.start_time.slice(0, 5)}.`;
    await notifyBatchStudentsPortalOnly(session.batch_id, title, body, {
      sessionId: session.id,
      kind: "last_class_eve",
    });
    await supabase
      .from("class_sessions")
      .update({ last_class_eve_notified_at: new Date().toISOString() })
      .eq("id", session.id);
    stats.lastClassEve += 1;
  }

  return NextResponse.json({ ok: true, stats });
}
