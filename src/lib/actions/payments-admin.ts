"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/audit";

export async function updatePlatformPaymentSettings(data: {
  onlinePaymentsEnabled: boolean;
  defaultTuitionLkr: number;
}) {
  await requireAdmin();

  if (data.defaultTuitionLkr < 1) {
    throw new Error("Default tuition fee must be at least LKR 1");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("platform_settings")
    .update({
      online_payments_enabled: data.onlinePaymentsEnabled,
      default_tuition_lkr: data.defaultTuitionLkr,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) throw new Error(error.message);

  await logAdminAction("payments.settings_update", "platform_settings", "1", {
    onlinePaymentsEnabled: data.onlinePaymentsEnabled,
    defaultTuitionLkr: data.defaultTuitionLkr,
  });

  revalidatePath("/admin/payments");
  revalidatePath("/settings");
  revalidatePath("/coming-soon/payments");
}

export async function getPlatformPaymentSettings() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("platform_settings").select("*").eq("id", 1).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}
