import "server-only";

import type { PlatformSettings } from "@/types";
import { isOnlinePaymentsAvailable as isOnlinePaymentsAvailableClient } from "@/lib/payment-access";

/** Whether Stripe secret key is present in the deployment (server-only). */
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

/** Online checkout availability including Stripe secret presence. */
export function isOnlinePaymentsAvailable(
  settings: Pick<PlatformSettings, "onlinePaymentsEnabled">
): boolean {
  return isOnlinePaymentsAvailableClient(settings, isStripeConfigured());
}
