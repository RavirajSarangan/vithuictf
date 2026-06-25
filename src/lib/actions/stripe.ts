"use server";

import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { BRAND } from "@/lib/constants";
import { isOnlinePaymentsAvailable } from "@/lib/payment-access";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Online payments are not configured yet.");
  return new Stripe(key);
}

export async function createStripeCheckoutSession(data: {
  studentId: string;
  studentName: string;
  amount?: number;
  description?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: settings } = await supabase
    .from("platform_settings")
    .select("online_payments_enabled, default_tuition_lkr")
    .eq("id", 1)
    .maybeSingle();

  const onlinePaymentsEnabled = settings?.online_payments_enabled ?? false;
  if (!isOnlinePaymentsAvailable({ onlinePaymentsEnabled })) {
    throw new Error("Online payments are coming soon. Please contact the academy to pay fees.");
  }

  const amount = data.amount ?? Number(settings?.default_tuition_lkr ?? 5000);

  const stripe = getStripe();
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${origin}/settings?payment=success`,
    cancel_url: `${origin}/settings?payment=cancelled`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "lkr",
          unit_amount: Math.round(amount * 100),
          product_data: {
            name: data.description ?? `${BRAND.name} — ${data.studentName}`,
          },
        },
      },
    ],
    metadata: {
      student_id: data.studentId,
      student_name: data.studentName,
      user_id: user.id,
    },
  });

  return { url: session.url };
}
