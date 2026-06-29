import type { PlatformSettings } from "@/types";
import { DEFAULT_BRAND_LOGO_SETTINGS } from "@/lib/brand-logo-settings";

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  onlinePaymentsEnabled: false,
  defaultInstituteFeeLkr: 5000,
  perClassFeeLkr: 1200,
  marketingComingSoonEnabled: true,
  sitePublicMode: "live",
  brandLogo: DEFAULT_BRAND_LOGO_SETTINGS,
  updatedAt: new Date(0).toISOString(),
};

/** Online checkout is live when admin enabled it and Stripe is configured server-side. */
export function isOnlinePaymentsAvailable(
  settings: Pick<PlatformSettings, "onlinePaymentsEnabled">,
  stripeConfigured = false
): boolean {
  return settings.onlinePaymentsEnabled && stripeConfigured;
}

export function getOnlinePaymentsStatusLabel(
  settings: Pick<PlatformSettings, "onlinePaymentsEnabled">,
  stripeConfigured = false
): "live" | "coming-soon" | "misconfigured" {
  if (!settings.onlinePaymentsEnabled) return "coming-soon";
  if (!stripeConfigured) return "misconfigured";
  return "live";
}
