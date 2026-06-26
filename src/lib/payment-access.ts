import type { PlatformSettings } from "@/types";
import { DEFAULT_BRAND_LOGO_SETTINGS } from "@/lib/brand-logo-settings";

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  onlinePaymentsEnabled: false,
  defaultInstituteFeeLkr: 5000,
  marketingComingSoonEnabled: true,
  sitePublicMode: "live",
  brandLogo: DEFAULT_BRAND_LOGO_SETTINGS,
  updatedAt: new Date(0).toISOString(),
};

/** Whether Stripe secret key is present in the deployment. */
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

/** Online checkout is live only when admin enabled it and Stripe is configured. */
export function isOnlinePaymentsAvailable(settings: Pick<PlatformSettings, "onlinePaymentsEnabled">): boolean {
  return settings.onlinePaymentsEnabled && isStripeConfigured();
}

export function getOnlinePaymentsStatusLabel(
  settings: Pick<PlatformSettings, "onlinePaymentsEnabled">
): "live" | "coming-soon" | "misconfigured" {
  if (!settings.onlinePaymentsEnabled) return "coming-soon";
  if (!isStripeConfigured()) return "misconfigured";
  return "live";
}
