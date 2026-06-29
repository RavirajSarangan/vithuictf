"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/audit";
import {
  allocatePaymentToCharges,
  getPerClassFeeLkr,
} from "@/lib/billing/session-charges";
import {
  mapSessionCharge,
  mapStudentBillingSummary,
} from "@/lib/supabase/mappers";
import type {
  FinanceOverview,
  SessionCharge,
  StudentBillingSummary,
  StudentFinanceRosterRow,
} from "@/types";

function revalidateFinancePaths() {
  revalidatePath("/admin/finance");
  revalidatePath("/admin/finance/students");
  revalidatePath("/admin/finance/ledger");
  revalidatePath("/admin/dashboard");
}

function monthLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString("en", { month: "short", year: "2-digit" });
}

export async function getFinanceOverview(): Promise<FinanceOverview> {
  await requireAdmin();
  const supabase = await createClient();
  const perClassFeeLkr = await getPerClassFeeLkr(supabase);

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const { data: charges, error } = await supabase
    .from("session_charges")
    .select("id, course_id, amount_lkr, status, billing_month, courses(name)")
    .in("status", ["pending", "paid"]);

  if (error) throw new Error(error.message);

  const rows = charges ?? [];
  const totalSessionRevenueLkr = rows
    .filter((c) => c.status === "paid")
    .reduce((sum, c) => sum + Number(c.amount_lkr), 0);
  const totalOutstandingLkr = rows
    .filter((c) => c.status === "pending")
    .reduce((sum, c) => sum + Number(c.amount_lkr), 0);
  const sessionsBilledThisMonth = rows.filter((c) => c.billing_month === monthStart).length;

  const revenueByCourseMap = new Map<string, { courseName: string; revenueLkr: number }>();
  const monthlyMap = new Map<string, number>();
  const statusCounts = { pending: 0, paid: 0, waived: 0, void: 0 };

  for (const row of rows) {
    const course = row.courses as unknown as { name: string } | null;
    const courseName = course?.name ?? "Unknown";
    const amount = Number(row.amount_lkr);

    if (row.status === "paid") {
      const existing = revenueByCourseMap.get(row.course_id) ?? { courseName, revenueLkr: 0 };
      existing.revenueLkr += amount;
      revenueByCourseMap.set(row.course_id, existing);

      const monthKey = monthLabel(row.billing_month);
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) ?? 0) + amount);
    }

    if (row.status === "pending") statusCounts.pending++;
    if (row.status === "paid") statusCounts.paid++;
  }

  const { data: waivedVoid } = await supabase
    .from("session_charges")
    .select("status")
    .in("status", ["waived", "void"]);
  for (const row of waivedVoid ?? []) {
    if (row.status === "waived") statusCounts.waived++;
    if (row.status === "void") statusCounts.void++;
  }

  const { data: summaryRows } = await supabase
    .from("student_billing_summary")
    .select("student_id, course_id");

  const studentCourseCounts = new Map<string, number>();
  for (const row of summaryRows ?? []) {
    studentCourseCounts.set(
      row.student_id,
      (studentCourseCounts.get(row.student_id) ?? 0) + 1
    );
  }
  const multiCourseStudentCount = [...studentCourseCounts.values()].filter((n) => n > 1).length;

  return {
    totalSessionRevenueLkr,
    totalOutstandingLkr,
    sessionsBilledThisMonth,
    multiCourseStudentCount,
    revenueByCourse: [...revenueByCourseMap.entries()].map(([courseId, v]) => ({
      courseId,
      courseName: v.courseName,
      revenueLkr: v.revenueLkr,
    })),
    monthlyTrend: [...monthlyMap.entries()]
      .map(([month, revenueLkr]) => ({ month, revenueLkr }))
      .slice(-6),
    chargeStatusBreakdown: [
      { name: "Pending", value: statusCounts.pending },
      { name: "Paid", value: statusCounts.paid },
      { name: "Waived", value: statusCounts.waived },
      { name: "Void", value: statusCounts.void },
    ].filter((item) => item.value > 0),
    perClassFeeLkr,
  };
}

export async function getFinanceStudentRoster(): Promise<StudentFinanceRosterRow[]> {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data, error }, { data: students }] = await Promise.all([
    supabase.from("student_billing_summary").select("*"),
    supabase.from("students").select("id, display_name"),
  ]);

  if (error) throw new Error(error.message);

  const nameById = new Map((students ?? []).map((s) => [s.id, s.display_name]));
  const byStudent = new Map<string, StudentFinanceRosterRow>();

  for (const row of data ?? []) {
    const studentId = row.student_id;
    const existing = byStudent.get(studentId) ?? {
      studentId,
      studentName: nameById.get(studentId) ?? "Unknown",
      courseCount: 0,
      sessionsBilled: 0,
      totalChargedLkr: 0,
      totalPaidLkr: 0,
      totalOutstandingLkr: 0,
    };

    existing.courseCount += 1;
    existing.sessionsBilled += Number(row.sessions_billed);
    existing.totalChargedLkr += Number(row.total_charged_lkr);
    existing.totalPaidLkr += Number(row.total_paid_lkr);
    existing.totalOutstandingLkr += Number(row.total_outstanding_lkr);

    byStudent.set(studentId, existing);
  }

  return [...byStudent.values()].sort((a, b) => b.totalOutstandingLkr - a.totalOutstandingLkr);
}

export async function getStudentFinanceDetail(studentId: string): Promise<{
  summaries: StudentBillingSummary[];
  charges: SessionCharge[];
}> {
  await requireAdmin();
  const supabase = await createClient();

  const { data: summaries, error: summaryError } = await supabase
    .from("student_billing_summary")
    .select("*")
    .eq("student_id", studentId);

  if (summaryError) throw new Error(summaryError.message);

  const { data: charges, error: chargesError } = await supabase
    .from("session_charges")
    .select(
      "*, courses(name), course_batches(name), class_sessions(session_number, scheduled_date)"
    )
    .eq("student_id", studentId)
    .order("billing_month", { ascending: false });

  if (chargesError) throw new Error(chargesError.message);

  return {
    summaries: (summaries ?? []).map(mapStudentBillingSummary),
    charges: (charges ?? []).map((row) =>
      mapSessionCharge(
        row as Parameters<typeof mapSessionCharge>[0]
      )
    ),
  };
}

export async function getFinanceLedger(filters?: {
  courseId?: string;
  status?: "pending" | "paid" | "waived" | "void";
  billingMonth?: string;
}): Promise<SessionCharge[]> {
  await requireAdmin();
  const supabase = await createClient();

  let query = supabase
    .from("session_charges")
    .select(
      "*, courses(name), course_batches(name), class_sessions(session_number, scheduled_date)"
    )
    .order("billing_month", { ascending: false })
    .limit(500);

  if (filters?.courseId) query = query.eq("course_id", filters.courseId);
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.billingMonth) query = query.eq("billing_month", filters.billingMonth);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) =>
    mapSessionCharge(row as Parameters<typeof mapSessionCharge>[0])
  );
}

export async function recordFinancePayment(data: {
  studentId: string;
  studentName: string;
  amount: number;
  method?: string;
  chargeIds?: string[];
  courseId?: string;
}) {
  await requireAdmin();
  const supabase = await createClient();

  if (data.amount < 1) throw new Error("Amount must be at least LKR 1");

  const { data: payment, error } = await supabase
    .from("payments")
    .insert({
      student_id: data.studentId,
      student_name: data.studentName,
      amount: data.amount,
      status: "paid",
      method: data.method ?? "Cash",
      payment_date: new Date().toISOString().slice(0, 10),
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  let chargeIds = data.chargeIds ?? [];

  if (!chargeIds.length) {
    let pendingQuery = supabase
      .from("session_charges")
      .select("id")
      .eq("student_id", data.studentId)
      .eq("status", "pending")
      .order("billing_month", { ascending: true });

    if (data.courseId) pendingQuery = pendingQuery.eq("course_id", data.courseId);

    const { data: pendingCharges, error: pendingError } = await pendingQuery;
    if (pendingError) throw new Error(pendingError.message);
    chargeIds = (pendingCharges ?? []).map((c) => c.id);
  }

  if (chargeIds.length) {
    await allocatePaymentToCharges(supabase, payment.id, chargeIds);
  }

  await logAdminAction("finance.payment_record", "payment", payment.id, {
    studentId: data.studentId,
    amount: data.amount,
    chargeCount: chargeIds.length,
  });

  revalidateFinancePaths();
  revalidatePath("/admin/payments");

  return payment.id;
}

export async function waiveCharge(chargeId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("session_charges")
    .update({ status: "waived", updated_at: new Date().toISOString() })
    .eq("id", chargeId)
    .eq("status", "pending");

  if (error) throw new Error(error.message);

  await logAdminAction("finance.charge_waive", "session_charge", chargeId, {});
  revalidateFinancePaths();
}

export async function updatePerClassFee(perClassFeeLkr: number) {
  await requireAdmin();

  if (perClassFeeLkr < 1) {
    throw new Error("Per-class fee must be at least LKR 1");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("platform_settings")
    .update({
      per_class_fee_lkr: perClassFeeLkr,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) throw new Error(error.message);

  await logAdminAction("finance.per_class_fee_update", "platform_settings", "1", {
    perClassFeeLkr,
  });

  revalidateFinancePaths();
  revalidatePath("/admin/payments");
}

export async function getOutstandingSessionFeesTotal(): Promise<number> {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("session_charges")
    .select("amount_lkr")
    .eq("status", "pending");

  if (error) throw new Error(error.message);
  return (data ?? []).reduce((sum, row) => sum + Number(row.amount_lkr), 0);
}
