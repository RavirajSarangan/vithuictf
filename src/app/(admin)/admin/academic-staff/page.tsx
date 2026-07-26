"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  addAcademicStaffMember,
  deleteAcademicStaffMember,
  updateAcademicStaffMember,
  uploadAcademicStaffImage,
} from "@/lib/actions/admin";
import { useAdminAcademicStaff } from "@/hooks/use-data";
import { AdminTableSection } from "@/components/admin/admin-table-section";
import { AdminImageUpload } from "@/components/admin/admin-image-upload";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { SummaryCardItem } from "@/components/admin/table-summary-cards";
import { GraduationCap, Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import type { AcademicStaffMember } from "@/types";

const staffSchema = z.object({
  name: z.string().min(2, "Name is required"),
  role: z.string().min(2, "Role is required"),
  affiliate: z.string().optional(),
  bio: z.string().optional(),
  photoUrl: z.union([z.string().url(), z.literal("")]).optional(),
  isActive: z.boolean(),
  sortOrder: z.number().min(0).max(999),
});

type StaffFormValues = z.infer<typeof staffSchema>;

const DEFAULT_VALUES: StaffFormValues = {
  name: "",
  role: "",
  affiliate: "",
  bio: "",
  photoUrl: "",
  isActive: true,
  sortOrder: 0,
};

export default function AdminAcademicStaffPage() {
  const { data, refresh } = useAdminAcademicStaff();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AcademicStaffMember | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AcademicStaffMember | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const summaryItems = useMemo<SummaryCardItem[]>(
    () => [{ label: "Academic staff", value: data.length }],
    [data]
  );

  const columns = useMemo(
    () => [
      {
        key: "photoUrl",
        label: "",
        render: (row: AcademicStaffMember) =>
          row.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={row.photoUrl}
              alt={row.name}
              className="size-10 rounded-full object-cover"
            />
          ) : (
            <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <GraduationCap className="size-4" />
            </span>
          ),
      },
      { key: "name", label: "Name" },
      { key: "role", label: "Role" },
      {
        key: "affiliate",
        label: "Affiliate",
        render: (row: AcademicStaffMember) =>
          row.affiliate ? row.affiliate : <span className="text-muted-foreground">—</span>,
      },
      {
        key: "isActive",
        label: "Visible",
        render: (row: AcademicStaffMember) =>
          row.isActive ? (
            <Badge variant="outline">Shown on home page</Badge>
          ) : (
            <span className="text-muted-foreground">Hidden</span>
          ),
      },
      { key: "sortOrder", label: "Order" },
    ],
    []
  );

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const openCreate = () => {
    setEditing(null);
    form.reset(DEFAULT_VALUES);
    setOpen(true);
  };

  const openEdit = (member: AcademicStaffMember) => {
    setEditing(member);
    form.reset({
      name: member.name,
      role: member.role,
      affiliate: member.affiliate,
      bio: member.bio,
      photoUrl: member.photoUrl,
      isActive: member.isActive,
      sortOrder: member.sortOrder,
    });
    setOpen(true);
  };

  const onSubmit = async (values: StaffFormValues) => {
    setSubmitting(true);
    try {
      const result = editing
        ? await updateAcademicStaffMember(editing.id, values)
        : await addAcademicStaffMember(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(editing ? "Staff member updated" : "Staff member added");
      refresh();
      setOpen(false);
    } catch {
      toast.error("Failed to save staff member");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const result = await deleteAcademicStaffMember(deleteTarget.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      refresh();
      toast.success("Staff member deleted");
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Academic Staff"
        description="Manage the academic staff profiles shown on the home page"
        action={
          <Button onClick={openCreate}>
            <Plus className="mr-2 size-4" /> Add staff member
          </Button>
        }
      />

      {data.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No academic staff yet"
          description="Add your first academic staff profile"
          action={
            <Button onClick={openCreate}>
              <Plus className="mr-2 size-4" /> Add staff member
            </Button>
          }
        />
      ) : (
        <AdminTableSection
          data={data}
          columns={columns}
          summaryItems={summaryItems}
          entityLabel="staff member"
          onDelete={(id) => setDeleteTarget(data.find((m) => m.id === id) ?? null)}
          onView={(row) => openEdit(row)}
          onActionComplete={refresh}
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[min(90dvh,calc(100vh-2rem))] overflow-y-auto overscroll-contain sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit staff member" : "Add staff member"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 pb-1">
              <FormField
                control={form.control}
                name="photoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <AdminImageUpload
                        label="Photo"
                        folder="academic-staff"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        uploadAction={uploadAcademicStaffImage}
                        requireSquare
                        hint="Square image recommended. JPG/PNG uploads are auto-converted to WebP."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role / title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Senior Lecturer" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="affiliate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Affiliate (institution / qualification)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="B.Sc, University of Jaffna" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Show on home page</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Turn off to hide this staff member without deleting their profile.
                      </p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display order</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={999}
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" /> Saving...
                  </>
                ) : editing ? (
                  <>
                    <Pencil className="mr-2 size-4" /> Update staff member
                  </>
                ) : (
                  "Save staff member"
                )}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name ?? "member"}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the staff profile from the home page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
