import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";

type AttendanceStatus = "present" | "absent" | "late";
type SessionChargeStatus = "pending" | "paid" | "waived" | "void";

export const DEFAULT_PER_CLASS_FEE_LKR = 1200;

function billingClient(fallback: SupabaseClient<Database>): SupabaseClient<Database> {
  return isAdminClientConfigured() ? createAdminClient() : fallback;
}

export async function getPerClassFeeLkr(
  supabase: SupabaseClient<Database>
): Promise<number> {
  const db = billingClient(supabase);
  const { data } = await db
    .from("platform_settings")
    .select("per_class_fee_lkr")
    .eq("id", 1)
    .maybeSingle();

  const fee = Number(data?.per_class_fee_lkr);
  return Number.isFinite(fee) && fee > 0 ? fee : DEFAULT_PER_CLASS_FEE_LKR;
}

/** Manual re-sync for a session (DB trigger handles normal attendance flow). */
export async function syncChargesForSession(
  supabase: SupabaseClient<Database>,
  sessionId: string,
  records: { studentId: string; status: AttendanceStatus }[]
) {
  const db = billingClient(supabase);
  const { data: session, error: sessionError } = await db
    .from("class_sessions")
    .select("id, batch_id, scheduled_date, status")
    .eq("id", sessionId)
    .maybeSingle();

  if (sessionError) throw new Error(sessionError.message);
  if (!session) throw new Error("Session not found");

  const { data: batch, error: batchError } = await db
    .from("course_batches")
    .select("course_id")
    .eq("id", session.batch_id)
    .maybeSingle();

  if (batchError) throw new Error(batchError.message);
  if (!batch?.course_id) throw new Error("Batch course not found");

  if (session.status === "cancelled") {
    await db
      .from("session_charges")
      .update({ status: "void", updated_at: new Date().toISOString() })
      .eq("session_id", sessionId)
      .eq("status", "pending");
    return;
  }

  const fee = await getPerClassFeeLkr(supabase);
  const billingMonth = session.scheduled_date.slice(0, 7) + "-01";

  for (const record of records) {
    if (record.status === "present" || record.status === "late") {
      const { data: attendance } = await db
        .from("attendance_records")
        .select("id")
        .eq("session_id", sessionId)
        .eq("student_id", record.studentId)
        .maybeSingle();

      const { data: existing } = await db
        .from("session_charges")
        .select("id, status")
        .eq("session_id", sessionId)
        .eq("student_id", record.studentId)
        .maybeSingle();

      const keepStatus: SessionChargeStatus =
        existing?.status === "paid" || existing?.status === "waived"
          ? existing.status
          : "pending";

      const row = {
        student_id: record.studentId,
        session_id: sessionId,
        batch_id: session.batch_id,
        course_id: batch.course_id,
        attendance_record_id: attendance?.id ?? null,
        amount_lkr: fee,
        status: keepStatus,
        billing_month: billingMonth,
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        await db.from("session_charges").update(row).eq("id", existing.id);
      } else {
        await db.from("session_charges").insert(row);
      }
    } else {
      await db
        .from("session_charges")
        .update({ status: "void", updated_at: new Date().toISOString() })
        .eq("session_id", sessionId)
        .eq("student_id", record.studentId)
        .eq("status", "pending");
    }
  }
}

export async function allocatePaymentToCharges(
  supabase: SupabaseClient<Database>,
  paymentId: string,
  chargeIds: string[]
) {
  if (!chargeIds.length) return;

  const db = billingClient(supabase);

  const { data: payment, error: paymentError } = await db
    .from("payments")
    .select("id, amount, status")
    .eq("id", paymentId)
    .maybeSingle();

  if (paymentError) throw new Error(paymentError.message);
  if (!payment) throw new Error("Payment not found");
  if (payment.status !== "paid") throw new Error("Only paid payments can be allocated");

  const { data: charges, error: chargesError } = await db
    .from("session_charges")
    .select("id, amount_lkr, status")
    .in("id", chargeIds)
    .eq("status", "pending");

  if (chargesError) throw new Error(chargesError.message);
  if (!charges?.length) throw new Error("No pending charges found");

  let remaining = Number(payment.amount);
  const allocations: { payment_id: string; session_charge_id: string; amount_lkr: number }[] = [];

  for (const charge of charges) {
    if (remaining <= 0) break;
    const chargeAmount = Number(charge.amount_lkr);
    const allocAmount = Math.min(remaining, chargeAmount);
    if (allocAmount <= 0) continue;

    allocations.push({
      payment_id: paymentId,
      session_charge_id: charge.id,
      amount_lkr: allocAmount,
    });
    remaining -= allocAmount;
  }

  if (!allocations.length) throw new Error("Payment amount is insufficient");

  const { error: allocError } = await db.from("payment_allocations").insert(allocations);
  if (allocError) throw new Error(allocError.message);

  for (const alloc of allocations) {
    const charge = charges.find((c) => c.id === alloc.session_charge_id);
    if (!charge) continue;

    const totalAllocated = alloc.amount_lkr;
    if (totalAllocated >= Number(charge.amount_lkr)) {
      await db
        .from("session_charges")
        .update({ status: "paid", updated_at: new Date().toISOString() })
        .eq("id", charge.id);
    }
  }
}
