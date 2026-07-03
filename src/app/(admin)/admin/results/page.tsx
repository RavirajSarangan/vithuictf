"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addResult, deleteResult } from "@/lib/actions/admin";
import { bulkDeleteResults } from "@/lib/actions/bulk-delete";
import { useAdminResults, useAdminStudents } from "@/hooks/use-data";
import { AdminTableSection } from "@/components/admin/admin-table-section";
import { DeleteConfirmDialog } from "@/components/admin/bulk-delete-dialog";
import { useBulkDeleteHandler } from "@/hooks/use-bulk-delete";
import { resultTableSummary, resultSelectionInsights } from "@/lib/table-insights";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";

import { getActionErrorMessage } from "@/lib/action-error";
const resultSchema = z.object({
  studentId: z.string().min(1, "Select a student"),
  examTitle: z.string().min(2, "Exam title is required"),
  subject: z.string().min(2, "Subject is required"),
  grade: z.string().min(1, "Grade is required"),
  marks: z.number().min(0).max(100),
  maxMarks: z.number().min(1).max(100),
  rank: z.number().min(0),
  term: z.string().min(1, "Term is required"),
  resultDate: z.string().min(1, "Date is required"),
});

type ResultFormValues = z.infer<typeof resultSchema>;

export default function AdminResultsPage() {
  const { data, refresh } = useAdminResults();
  const { data: students } = useAdminStudents();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleBulkDelete = useBulkDeleteHandler(bulkDeleteResults, "result", refresh);
  const summaryItems = useMemo(() => resultTableSummary(data), [data]);

  const form = useForm<ResultFormValues>({
    resolver: zodResolver(resultSchema),
    defaultValues: {
      studentId: "",
      examTitle: "",
      subject: "",
      grade: "A",
      marks: 75,
      maxMarks: 100,
      rank: 1,
      term: "Term 1",
      resultDate: new Date().toISOString().slice(0, 10),
    },
  });

  const onSubmit = async (values: ResultFormValues) => {
    setSubmitting(true);
    try {
      await addResult(values);
      refresh();
      setOpen(false);
      form.reset();
      toast.success("Result recorded");
    } catch (e) {
      toast.error(getActionErrorMessage(e, "Failed to add result"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await deleteResult(id);
      refresh();
      toast.success("Result deleted");
      setDeleteTargetId(null);
    } catch (e) {
      toast.error(getActionErrorMessage(e, "Delete failed"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Results"
        description="Record and manage student exam results"
        action={
          <Button  onClick={() => setOpen(true)}>
            <Plus className="mr-2 size-4" /> Add Result
          </Button>
        }
      />

      {data.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No results yet"
          description="Add exam results for your students"
          action={
            <Button  onClick={() => setOpen(true)}>
              <Plus className="mr-2 size-4" /> Add Result
            </Button>
          }
          
        />
      ) : (
        <AdminTableSection
          data={data}
          columns={[
            { key: "examTitle", label: "Exam" },
            { key: "subject", label: "Subject" },
            { key: "grade", label: "Grade" },
            { key: "marks", label: "Marks" },
            { key: "rank", label: "Rank" },
            { key: "term", label: "Term" },
          ]}
          summaryItems={summaryItems}
          getSelectionInsights={resultSelectionInsights}
          entityLabel="result"
          onBulkDelete={handleBulkDelete}
          onDelete={(id) => setDeleteTargetId(id)}
          onActionComplete={refresh}
        />
      )}

      <DeleteConfirmDialog
        open={!!deleteTargetId}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
        entityLabel="this result"
        deleting={deleting}
        onConfirm={() => {
          if (deleteTargetId) void handleDelete(deleteTargetId);
        }}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Record Exam Result</DialogTitle>
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
                            {s.displayName} ({s.studentId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="examTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exam</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Term Test 1" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Pure Maths" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grade</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="marks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marks</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rank"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rank</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="term"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Term</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="resultDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit"  disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Result"
                )}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
