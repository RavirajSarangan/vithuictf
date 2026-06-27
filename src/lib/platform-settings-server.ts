import { createPublicClient } from "@/lib/supabase/server";
import { DEFAULT_PLATFORM_SETTINGS } from "@/lib/payment-access";
import { mapPlatformSettings } from "@/lib/supabase/mappers";
import type { PlatformSettings } from "@/types";

/** Server-side platform settings (marketing layouts, brand variables). */
export async function getPlatformSettings(): Promise<PlatformSettings> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("platform_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) {
      return DEFAULT_PLATFORM_SETTINGS;
    }

    return mapPlatformSettings(data);
  } catch {
    return DEFAULT_PLATFORM_SETTINGS;
  }
}
