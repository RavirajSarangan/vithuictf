"use client";

import { useEffect } from "react";
import {
  applyBrandLogoCssVariablesToRoot,
  parseBrandLogoSettings,
} from "@/lib/brand-logo-settings";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { BrandLogoSettings } from "@/types";

const PLATFORM_SETTINGS_CHANNEL = "platform_settings:brand_logo";

interface BrandLogoCssSyncProps {
  initialSettings: BrandLogoSettings;
}

/** Keeps :root logo CSS variables in sync with platform_settings (SSR seed + Realtime). */
export function BrandLogoCssSync({ initialSettings }: BrandLogoCssSyncProps) {
  useEffect(() => {
    applyBrandLogoCssVariablesToRoot(initialSettings);

    if (!isSupabaseConfigured()) return;

    const supabase = createClient();
    const channel = supabase
      .channel(PLATFORM_SETTINGS_CHANNEL)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "platform_settings",
          filter: "id=eq.1",
        },
        (payload) => {
          const row = payload.new as { brand_logo_settings?: unknown };
          if (row.brand_logo_settings !== undefined) {
            applyBrandLogoCssVariablesToRoot(parseBrandLogoSettings(row.brand_logo_settings));
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [initialSettings]);

  return null;
}

export { PLATFORM_SETTINGS_CHANNEL };
