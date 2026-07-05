"use client";

import { useMemo } from "react";
import { Banknote, ReceiptText, Wallet } from "lucide-react";
import { SectionCard } from "@/components/student/dashboard/section-card";
import { StudentEmptyState } from "@/components/student/portal/student-portal-states";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SessionCharge, SessionChargeStatus, StudentBillingSummary } from "@/types";

const STATUS_STYLES: Record<SessionChargeStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
  waived: "border-slate-200 bg-slate-50 text-slate-600",
  void: "border-slate-200 bg-slate-50 text-slate-400",
};

const STATUS_LABELS: Record<SessionChargeStatus, string> = {
  pending: "Due",
  paid: "Paid",
  waived: "Waived",
  void: "Void",
};

function formatMonth(billingMonth: string): string {
  const date = new Date(`${billingMonth.slice(0, 7)}-01T00:00:00`);
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function StatTile({
  label,
  value,
  icon: Icon,
  highlight,
}: {
  label: string;
  value: string;
  icon: typeof Wallet;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border px-4 py-3.5 shadow-sm",
        highlight ? "border-amber-200 bg-amber-50/70" : "border-icvf-border bg-white"
      )}
    >
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl",
          highlight ? "bg-amber-100 text-amber-700" : "bg-icvf-navy/10 text-icvf-navy"
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-icvf-text-light">{label}</p>
        <p className={cn("truncate text-base font-bold sm:text-lg", highlight ? "text-amber-800" : "text-icvf-navy")}>
          {value}
        </p>
      </div>
    </div>
  );
}

export function StudentPaymentsView({
  summaries,
  charges,
}: {
  summaries: StudentBillingSummary[];
  charges: SessionCharge[];
}) {
  const totals = useMemo(() => {
    return summaries.reduce(
      (acc, s) => ({
        charged: acc.charged + s.totalChargedLkr,
        paid: acc.paid + s.totalPaidLkr,
        outstanding: acc.outstanding + s.totalOutstandingLkr,
      }),
      { charged: 0, paid: 0, outstanding: 0 }
    );
  }, [summaries]);

  const chargesByMonth = useMemo(() => {
    const groups = new Map<string, SessionCharge[]>();
    for (const charge of charges) {
      const key = charge.billingMonth;
      const list = groups.get(key);
      if (list) list.push(charge);
      else groups.set(key, [charge]);
    }
    return Array.from(groups.entries());
  }, [charges]);

  if (!summaries.length && !charges.length) {
    return (
      <StudentEmptyState message="No class fees have been recorded yet. Charges appear here after each class you attend." />
    );
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 sm:gap-6">
      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <StatTile
          label="Outstanding"
          value={`Rs. ${totals.outstanding.toLocaleString()}`}
          icon={Wallet}
          highlight={totals.outstanding > 0}
        />
        <StatTile label="Total paid" value={`Rs. ${totals.paid.toLocaleString()}`} icon={Banknote} />
        <StatTile label="Total charged" value={`Rs. ${totals.charged.toLocaleString()}`} icon={ReceiptText} />
      </div>

      {summaries.length ? (
        <SectionCard
          title="Fees by course"
          description="Per-class billing for each of your enrolled courses"
          icon={ReceiptText}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-icvf-border/80 text-left text-xs text-icvf-text-light">
                  <th className="px-4 py-2.5 font-medium sm:px-5">Course</th>
                  <th className="px-4 py-2.5 text-right font-medium sm:px-5">Classes billed</th>
                  <th className="px-4 py-2.5 text-right font-medium sm:px-5">Charged</th>
                  <th className="px-4 py-2.5 text-right font-medium sm:px-5">Paid</th>
                  <th className="px-4 py-2.5 text-right font-medium sm:px-5">Outstanding</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map((row) => (
                  <tr key={row.courseId} className="border-b border-icvf-border/50 last:border-0">
                    <td className="px-4 py-3 font-medium text-icvf-navy sm:px-5">{row.courseName}</td>
                    <td className="px-4 py-3 text-right sm:px-5">{row.sessionsBilled}</td>
                    <td className="px-4 py-3 text-right sm:px-5">Rs. {row.totalChargedLkr.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-emerald-700 sm:px-5">
                      Rs. {row.totalPaidLkr.toLocaleString()}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 text-right font-semibold sm:px-5",
                        row.totalOutstandingLkr > 0 ? "text-amber-700" : "text-icvf-text-light"
                      )}
                    >
                      Rs. {row.totalOutstandingLkr.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      ) : null}

      {chargesByMonth.length ? (
        <SectionCard
          title="Charge history"
          description="Each attended class adds a charge for that month"
          icon={Banknote}
        >
          <div className="divide-y divide-icvf-border/50">
            {chargesByMonth.map(([month, monthCharges]) => (
              <div key={month} className="px-4 py-3 sm:px-5">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-icvf-text-light">
                    {formatMonth(month)}
                  </p>
                  <p className="text-xs text-icvf-text-light">
                    Rs. {monthCharges.reduce((sum, c) => sum + c.amountLkr, 0).toLocaleString()}
                  </p>
                </div>
                <ul className="flex flex-col gap-1.5">
                  {monthCharges.map((charge) => (
                    <li key={charge.id} className="flex items-center justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-icvf-navy">
                          {charge.courseName ?? "Course"}
                          {charge.sessionNumber ? ` — Class ${charge.sessionNumber}` : ""}
                        </p>
                        {charge.scheduledDate ? (
                          <p className="text-xs text-icvf-text-light">{charge.scheduledDate}</p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-sm font-medium">Rs. {charge.amountLkr.toLocaleString()}</span>
                        <Badge variant="outline" className={STATUS_STYLES[charge.status]}>
                          {STATUS_LABELS[charge.status]}
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}
