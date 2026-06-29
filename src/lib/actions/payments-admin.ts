"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/audit";

export async function updatePlatformPaymentSettings(data: {
  onlinePaymentsEnabled: boolean;
  defaultInstituteFeeLkr: number;
  perClassFeeLkr?: number;
}) {
  await requireAdmin();

  if (data.defaultInstituteFeeLkr < 1) {
    throw new Error("Default institute fee must be at least LKR 1");
  }
  if (data.perClassFeeLkr !== undefined && data.perClassFeeLkr < 1) {
    throw new Error("Per-class fee must be at least LKR 1");
  }

  const supabase = await createClient();
  const update: Record<string, unknown> = {
    online_payments_enabled: data.onlinePaymentsEnabled,
    default_institute_fee_lkr: data.defaultInstituteFeeLkr,
    updated_at: new Date().toISOString(),
  };
  if (data.perClassFeeLkr !== undefined) {
    update.per_class_fee_lkr = data.perClassFeeLkr;
  }

  const { error } = await supabase.from("platform_settings").update(update).eq("id", 1);

  if (error) throw new Error(error.message);

  await logAdminAction("payments.settings_update", "platform_settings", "1", {
    onlinePaymentsEnabled: data.onlinePaymentsEnabled,
    defaultInstituteFeeLkr: data.defaultInstituteFeeLkr,
    perClassFeeLkr: data.perClassFeeLkr,
  });

  revalidatePath("/admin/payments");
  revalidatePath("/admin/finance");
  revalidatePath("/settings");
  revalidatePath("/coming-soon/payments");
}

export async function getPlatformPaymentSettings() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("platform_settings").select("*").eq("id", 1).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}
