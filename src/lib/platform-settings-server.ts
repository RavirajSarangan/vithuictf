import { createClient } from "@/lib/supabase/server";
import { DEFAULT_PLATFORM_SETTINGS } from "@/lib/payment-access";
import { mapPlatformSettings } from "@/lib/supabase/mappers";
import type { PlatformSettings } from "@/types";

/** Server-side singleton platform settings (marketing layouts, brand variables). */
export async function getPlatformSettings(): Promise<PlatformSettings> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("platform_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    return DEFAULT_PLATFORM_SETTINGS;
  }

  return mapPlatformSettings(data);
}
