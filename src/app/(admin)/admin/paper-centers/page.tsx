"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  addManagedPaperCenter,
  deleteManagedPaperCenter,
  setManagedPaperCenterActive,
  updateManagedPaperCenter,
} from "@/lib/actions/paper-centers";
import { paperCenterLoginPath } from "@/lib/paper-center-slug";
import { useAdminPaperCenters } from "@/hooks/use-admin-data";
import { AdminTable } from "@/components/admin/admin-table";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import type { PaperCenter, PaperCenterGrade } from "@/types";
import { PAPER_CENTER_GRADES, formatPaperCenterGradeLabel } from "@/lib/paper-centers/grades";
import { GradeCheckboxes } from "@/components/paper-centers/grade-checkboxes";
import { PaperCenterStaffMessageDialog } from "@/components/paper-centers/paper-center-staff-message-dialog";
import { Copy, ExternalLink, Loader2, MapPin, MessageSquare, Pencil, Plus, Users } from "lucide-react";
import { toast } from "sonner";

const centerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  slug: z.string().optional(),
  district: z.string().min(1, "District is required"),
  address: z.string().min(1, "Address is required"),
  mapUrl: z.string().optional(),
  grades: z
    .array(z.enum(["10", "11", "12", "13"]))
    .min(1, "Select at least one grade"),
  isActive: z.boolean().optional(),
});

type CenterFormValues = z.infer<typeof centerSchema>;

type MessageTarget = {
  paperCenterId?: string;
  paperCenterName: string;
};

function copyText(value: string, label: string) {
  void navigator.clipboard.writeText(value);
  toast.success(`${label} copied`);
}

export default function AdminPaperCentersPage() {
  const { data: centers, refresh } = useAdminPaperCenters();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PaperCenter | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [messageTarget, setMessageTarget] = useState<MessageTarget | null>(null);

  const form = useForm<CenterFormValues>({
    resolver: zodResolver(centerSchema),
    defaultValues: {
      name: "",
      slug: "",
      district: "",
      address: "",
      mapUrl: "",
      grades: [] as PaperCenterGrade[],
      isActive: true,
    },
  });

  const sorted = useMemo(
    () => [...centers].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [centers]
  );

  const openCreate = () => {
    setEditing(null);
    form.reset({
      name: "",
      slug: "",
      district: "",
      address: "",
      mapUrl: "",
      grades: [],
      isActive: true,
    });
    setOpen(true);
  };

  const openEdit = (center: PaperCenter) => {
    setEditing(center);
    form.reset({
      name: center.name,
      slug: center.slug,
      district: center.district,
      address: center.address,
      mapUrl: center.mapUrl,
      grades: center.grades,
      isActive: center.isActive,
    });
    setOpen(true);
  };

  const onSubmit = async (values: CenterFormValues) => {
    setSubmitting(true);
    try {
      const payload = {
        name: values.name,
        slug: values.slug,
        district: values.district,
        address: values.address,
        mapUrl: values.mapUrl,
        grades: values.grades,
        isActive: values.isActive ?? true,
      };

      const result = editing
        ? await updateManagedPaperCenter(editing.id, payload)
        : await addManagedPaperCenter(payload);

      refresh();
      setOpen(false);
      toast.success(editing ? "Paper center updated" : "Paper center created");
      toast.info(`Staff login URL: ${result.loginUrl}`, { duration: 12000 });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (center: PaperCenter) => {
    if (!confirm(`Delete ${center.name}?`)) return;
    try {
      await deleteManagedPaperCenter(center.id);
      refresh();
      toast.success("Paper center deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    }
  };

  const handleToggleActive = async (center: PaperCenter) => {
    try {
      await setManagedPaperCenterActive(center.id, !center.isActive);
      refresh();
      toast.success(center.isActive ? "Center deactivated" : "Center activated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Manage Paper Centers"
        description="Create exam paper centers, set login URLs, and manage staff portal access."
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setMessageTarget({ paperCenterName: "All centers" })}
            >
              <MessageSquare className="mr-2 size-4" />
              Message all staff
            </Button>
            <Button onClick={openCreate}>
              <Plus className="mr-2 size-4" />
              Add center
            </Button>
          </div>
        }
      />

      {sorted.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No paper centers yet"
          description="Add your first paper center to enable staff login and exam paper uploads."
          action={
            <Button onClick={openCreate}>
              <Plus className="mr-2 size-4" />
              Add center
            </Button>
          }
        />
      ) : (
        <AdminTable
          columns={[
            { key: "name", label: "Center" },
            { key: "district", label: "District" },
            {
              key: "grades",
              label: "Grades",
              render: (row: PaperCenter) => (
                <div className="flex flex-wrap gap-1">
                  {row.grades.length > 0 ? (
                    row.grades.map((grade) => (
                      <Badge key={grade} variant="outline">
                        {formatPaperCenterGradeLabel(grade)}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
              ),
            },
            { key: "address", label: "Address" },
            {
              key: "slug",
              label: "Login URL",
              render: (row: PaperCenter) => {
                const path = paperCenterLoginPath(row.slug);
                const full = origin ? `${origin}${path}` : path;
                return (
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="rounded bg-muted px-2 py-1 text-xs">{path}</code>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => copyText(full, "Login URL")}
                      aria-label="Copy login URL"
                    >
                      <Copy className="size-3.5" />
                    </Button>
                    <Link
                      href={path}
                      target="_blank"
                      className="inline-flex size-7 items-center justify-center rounded-md hover:bg-muted"
                      aria-label="Open login page"
                    >
                      <ExternalLink className="size-3.5" />
                    </Link>
                  </div>
                );
              },
            },
            {
              key: "isActive",
              label: "Status",
              render: (row: PaperCenter) => (
                <Badge variant={row.isActive ? "default" : "outline"}>
                  {row.isActive ? "Active" : "Inactive"}
                </Badge>
              ),
            },
            {
              key: "id",
              label: "Actions",
              render: (row: PaperCenter) => (
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => openEdit(row)}>
                    <Pencil className="mr-1 size-3.5" />
                    Edit
                  </Button>
                  <Link href="/admin/people?tab=paperCenter" className={buttonVariants({ variant: "outline", size: "sm" })}>
                    <Users className="mr-1 size-3.5" />
                    Staff
                  </Link>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setMessageTarget({
                        paperCenterId: row.id,
                        paperCenterName: row.name,
                      })
                    }
                  >
                    <MessageSquare className="mr-1 size-3.5" />
                    Message
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => void handleToggleActive(row)}>
                    {row.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              ),
            },
          ]}
          data={sorted}
          onDelete={(id) => {
            const center = sorted.find((item) => item.id === id);
            if (center) void handleDelete(center);
          }}
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit paper center" : "Add paper center"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Center name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="ICTF Jaffna Paper Center" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL slug</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="ictf-jaffna-paper-center" />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Login path: /login/paper-center/your-slug
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="district"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>District</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Jaffna" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="grades"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grades served</FormLabel>
                    <FormControl>
                      <GradeCheckboxes
                        value={field.value}
                        onChange={field.onChange}
                        options={PAPER_CENTER_GRADES}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address / place</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Jaffna Town" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mapUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Map URL (optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://maps.google.com/..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {editing && (
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <FormLabel>Active on website</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Saving…
                  </>
                ) : editing ? (
                  "Save changes"
                ) : (
                  "Create center"
                )}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <PaperCenterStaffMessageDialog
        open={messageTarget !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setMessageTarget(null);
        }}
        paperCenterId={messageTarget?.paperCenterId}
        paperCenterName={messageTarget?.paperCenterName}
      />
    </div>
  );
}
