"use server";

import { isStripeConfigured } from "@/lib/payment-access.server";

export async function getStripeConfigured(): Promise<boolean> {
  return isStripeConfigured();
}
