"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addTeacher, deleteTeacher } from "@/lib/actions/admin";
import { useAdminTeachers } from "@/hooks/use-data";
import { AdminTable } from "@/components/admin/admin-table";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

const teacherSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  subjects: z.string().optional(),
});

type TeacherFormValues = z.infer<typeof teacherSchema>;

export default function AdminTeachersPage() {
  const { data, refresh } = useAdminTeachers();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherSchema),
    defaultValues: { displayName: "", email: "", subjects: "" },
  });

  const handleAdd = async (values: TeacherFormValues) => {
    setSubmitting(true);
    try {
      const subjects = values.subjects
        ? values.subjects.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      const result = await addTeacher({
        displayName: values.displayName,
        email: values.email,
        subjects,
      });
      refresh();
      setOpen(false);
      form.reset();
      toast.success("Teacher account created");
      if (result.tempPassword) {
        toast.info(`Temporary password: ${result.tempPassword}`, { duration: 12000 });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add teacher");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTeacher(id);
      refresh();
      toast.success("Teacher removed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Teachers"
        description="Manage teaching staff and portal access"
        action={
          <Button className="bg-icvf-accent hover:bg-icvf-accent-hover" onClick={() => setOpen(true)}>
            <Plus className="mr-2 size-4" /> Add Teacher
          </Button>
        }
      />

      {data.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No teachers yet"
          description="Create teacher accounts to grant staff portal access"
          action={
            <Button className="bg-icvf-accent" onClick={() => setOpen(true)}>
              <Plus className="mr-2 size-4" /> Add Teacher
            </Button>
          }
          className="border-white/10 bg-white/5 text-white"
        />
      ) : (
        <AdminTable
          columns={[
            { key: "displayName", label: "Name" },
            { key: "email", label: "Email" },
            {
              key: "subjects",
              label: "Subjects",
              render: (row) => row.subjects?.join(", ") || "—",
            },
            {
              key: "certified",
              label: "Certified",
              render: (row) => (
                <Badge variant={row.certified ? "default" : "outline"} className={row.certified ? "bg-icvf-accent" : "border-white/20 text-white/70"}>
                  {row.certified ? "Yes" : "No"}
                </Badge>
              ),
            },
          ]}
          data={data}
          onDelete={handleDelete}
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Teacher</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAdd)} className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Teacher name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (login)</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} placeholder="teacher@ictf.lk" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subjects"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subjects (comma-separated)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Physics, Chemistry" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="bg-icvf-accent" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" /> Creating...
                  </>
                ) : (
                  "Create Teacher Account"
                )}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
