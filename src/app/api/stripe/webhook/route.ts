import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!secret || !stripeKey) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const stripe = new Stripe(stripeKey);
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const studentId = session.metadata?.student_id;
    const studentName = session.metadata?.student_name ?? "Student";
    const amount = (session.amount_total ?? 0) / 100;

    if (studentId && amount > 0) {
      const admin = createAdminClient();
      await admin.from("payments").insert({
        student_id: studentId,
        student_name: studentName,
        amount,
        status: "paid",
        method: "stripe",
        payment_date: new Date().toISOString().slice(0, 10),
      });
    }
  }

  return NextResponse.json({ received: true });
}
