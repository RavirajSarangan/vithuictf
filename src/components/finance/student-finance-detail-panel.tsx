"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { recordFinancePayment, waiveCharge } from "@/lib/actions/finance";
import { AdminTable } from "@/components/admin/admin-table";
import { ExportCsvButton } from "@/components/admin/export-csv-button";
import { GlassCard } from "@/components/shared/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SessionCharge, StudentBillingSummary } from "@/types";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const paymentSchema = z.object({
  amount: z.number().min(1),
  method: z.string().min(2),
  courseId: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

function statusBadge(status: SessionCharge["status"]) {
  const variants: Record<SessionCharge["status"], "default" | "secondary" | "outline" | "destructive"> = {
    pending: "secondary",
    paid: "default",
    waived: "outline",
    void: "destructive",
  };
  return <Badge variant={variants[status]}>{status}</Badge>;
}

interface StudentFinanceDetailPanelProps {
  studentId: string;
  studentName: string;
  summaries: StudentBillingSummary[];
  charges: SessionCharge[];
  perClassFeeLkr: number;
  onRefresh: () => void;
}

export function StudentFinanceDetailPanel({
  studentId,
  studentName,
  summaries,
  charges,
  perClassFeeLkr,
  onRefresh,
}: StudentFinanceDetailPanelProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [waivingId, setWaivingId] = useState<string | null>(null);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { amount: 1200, method: "Cash", courseId: "all" },
  });

  const totalOutstanding = summaries.reduce((s, r) => s + r.totalOutstandingLkr, 0);

  const onSubmit = async (values: PaymentFormValues) => {
    setSubmitting(true);
    try {
      await recordFinancePayment({
        studentId,
        studentName,
        amount: values.amount,
        method: values.method,
        courseId: values.courseId === "all" ? undefined : values.courseId,
      });
      toast.success("Payment recorded and allocated");
      setOpen(false);
      form.reset();
      onRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  const onWaive = async (chargeId: string) => {
    setWaivingId(chargeId);
    try {
      await waiveCharge(chargeId);
      toast.success("Charge waived");
      onRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to waive charge");
    } finally {
      setWaivingId(null);
    }
  };

  const csvRows = charges.map((c) => ({
    course: c.courseName ?? "",
    batch: c.batchName ?? "",
    session: c.sessionNumber ?? "",
    date: c.scheduledDate ?? "",
    amount: c.amountLkr,
    status: c.status,
    month: c.billingMonth,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Per-class fee: Rs. {perClassFeeLkr.toLocaleString()}
          </p>
          <p className="text-lg font-semibold">
            Outstanding: Rs. {totalOutstanding.toLocaleString()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportCsvButton
            filename={`finance-${studentId}.csv`}
            rows={csvRows}
            columns={[
              { key: "course", label: "Course" },
              { key: "batch", label: "Batch" },
              { key: "session", label: "Session" },
              { key: "date", label: "Date" },
              { key: "amount", label: "Amount (LKR)" },
              { key: "status", label: "Status" },
              { key: "month", label: "Billing month" },
            ]}
          />
          <Button onClick={() => setOpen(true)} disabled={totalOutstanding <= 0}>
            Record payment
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {summaries.map((row) => (
          <GlassCard key={row.courseId} className="p-4">
            <h3 className="font-semibold">{row.courseName}</h3>
            <dl className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Sessions</dt>
                <dd>{row.sessionsBilled}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Charged</dt>
                <dd>Rs. {row.totalChargedLkr.toLocaleString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Paid</dt>
                <dd>Rs. {row.totalPaidLkr.toLocaleString()}</dd>
              </div>
              <div className="flex justify-between font-medium">
                <dt>Balance</dt>
                <dd>Rs. {row.totalOutstandingLkr.toLocaleString()}</dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-muted-foreground">
              {row.sessionsBilled} × Rs. {perClassFeeLkr.toLocaleString()} per attended class
            </p>
          </GlassCard>
        ))}
      </div>

      <AdminTable
        data={charges}
        emptyMessage="No session charges yet"
        columns={[
          { key: "courseName", label: "Course" },
          { key: "batchName", label: "Batch" },
          {
            key: "sessionNumber",
            label: "Session",
            render: (row) => `#${row.sessionNumber ?? "—"} · ${row.scheduledDate ?? ""}`,
          },
          {
            key: "amountLkr",
            label: "Amount",
            render: (row) => `Rs. ${row.amountLkr.toLocaleString()}`,
          },
          {
            key: "status",
            label: "Status",
            render: (row) => statusBadge(row.status),
          },
          { key: "billingMonth", label: "Month" },
          {
            key: "id",
            label: "",
            render: (row) =>
              row.status === "pending" ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={waivingId === row.id}
                  onClick={() => void onWaive(row.id)}
                >
                  Waive
                </Button>
              ) : null,
          },
        ]}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record payment — {studentName}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (LKR)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Method</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="courseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Allocate to course (optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Oldest pending across all courses" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">All courses</SelectItem>
                        {summaries
                          .filter((s) => s.totalOutstandingLkr > 0)
                          .map((s) => (
                            <SelectItem key={s.courseId} value={s.courseId}>
                              {s.courseName} (Rs. {s.totalOutstandingLkr.toLocaleString()} due)
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                Record & allocate
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {waivingId ? (
        <span className="sr-only">Waiving charge…</span>
      ) : null}
    </div>
  );
}
