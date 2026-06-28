"use client";

import { useEffect } from "react";
import {
  applyBrandLogoCssVariablesToRoot,
  parseBrandLogoSettings,
} from "@/lib/brand-logo-settings";
import { isSupabaseConfigured } from "@/lib/supabase/client";
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

    let disposed = false;
    let removeChannel: (() => void) | undefined;

    void (async () => {
      const { createClient } = await import("@/lib/supabase/client");
      if (disposed) return;

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

      if (disposed) {
        void supabase.removeChannel(channel);
        return;
      }

      removeChannel = () => {
        void supabase.removeChannel(channel);
      };
    })();

    return () => {
      disposed = true;
      removeChannel?.();
    };
  }, [initialSettings]);

  return null;
}
