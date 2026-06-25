"use server";

import { createClient } from "@/lib/supabase/server";

export async function logAdminAction(
  action: string,
  entityType?: string,
  entityId?: string,
  metadata?: Record<string, unknown>
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("admin_actions").insert({
      user_id: user.id,
      action,
      entity_type: entityType ?? null,
      entity_id: entityId ?? null,
      metadata: metadata ?? {},
    });
  } catch (err) {
    console.error("audit log failed:", err);
  }
}
