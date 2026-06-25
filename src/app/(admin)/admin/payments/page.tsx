"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addPayment } from "@/lib/actions/admin";
import { useAdminPayments, useAdminStudents } from "@/hooks/use-data";
import { AdminPaymentSettingsPanel } from "@/components/admin/admin-payment-settings";
import { ExportCsvButton } from "@/components/admin/export-csv-button";
import { useAuth } from "@/providers/auth-provider";
import { AdminTable } from "@/components/admin/admin-table";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";

const paymentSchema = z.object({
  studentId: z.string().min(1, "Select a student"),
  amount: z.number().min(1, "Amount must be positive"),
  status: z.enum(["paid", "pending", "overdue"]),
  method: z.string().min(2, "Payment method is required"),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

export default function AdminPaymentsPage() {
  const { data, refresh } = useAdminPayments();
  const { data: students } = useAdminStudents();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { studentId: "", amount: 15000, status: "pending", method: "Cash" },
  });

  const onSubmit = async (values: PaymentFormValues) => {
    const student = students.find((s) => s.id === values.studentId);
    if (!student) {
      toast.error("Student not found");
      return;
    }

    setSubmitting(true);
    try {
      await addPayment({
        studentId: student.id,
        studentName: student.displayName,
        amount: values.amount,
        status: values.status,
        method: values.method,
      });
      refresh();
      setOpen(false);
      form.reset();
      toast.success("Payment recorded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {user?.role === "admin" ? <AdminPaymentSettingsPanel /> : null}

      <PageHeader
        title="Payment records"
        description="Track institute fees and payments recorded manually or via Stripe"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <ExportCsvButton
              rows={data}
              filename="icvf-payments.csv"
              columns={[
                { key: "studentName", label: "Student" },
                { key: "amount", label: "Amount" },
                { key: "status", label: "Status" },
                { key: "method", label: "Method" },
                { key: "date", label: "Date" },
              ]}
            />
            <Button className="bg-icvf-accent hover:bg-icvf-accent-hover" onClick={() => setOpen(true)}>
              <Plus className="mr-2 size-4" /> Record Payment
            </Button>
          </div>
        }
      />

      {data.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No payments yet"
          description="Record student fee payments here"
          action={
            <Button className="bg-icvf-accent" onClick={() => setOpen(true)}>
              <Plus className="mr-2 size-4" /> Record Payment
            </Button>
          }
          className="border-white/10 bg-white/5 text-white"
        />
      ) : (
        <AdminTable
          columns={[
            { key: "studentName", label: "Student" },
            {
              key: "amount",
              label: "Amount",
              render: (row) => `Rs. ${row.amount.toLocaleString()}`,
            },
            {
              key: "status",
              label: "Status",
              render: (row) => (
                <Badge
                  className={
                    row.status === "paid"
                      ? "bg-green-600"
                      : row.status === "overdue"
                        ? "bg-destructive"
                        : "bg-icvf-accent/80"
                  }
                >
                  {row.status}
                </Badge>
              ),
            },
            { key: "method", label: "Method" },
            { key: "date", label: "Date" },
          ]}
          data={data}
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select student" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {students.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (LKR)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                        </SelectContent>
                      </Select>
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
                        <Input {...field} placeholder="Cash, Bank, Card" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" className="bg-icvf-accent" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Payment"
                )}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
