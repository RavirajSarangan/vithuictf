"use client";

import { useMemo, useState } from "react";
import { addSubjectCategory, deleteSubjectCategory } from "@/lib/actions/calendar";
import { bulkDeleteSubjectCategories } from "@/lib/actions/bulk-delete";
import { useAdminSubjectCategories } from "@/hooks/use-calendar";
import { AdminTableSection } from "@/components/admin/admin-table-section";
import { DeleteConfirmDialog } from "@/components/admin/bulk-delete-dialog";
import { useBulkDeleteHandler } from "@/hooks/use-bulk-delete";
import { categoryTableSummary, categorySelectionInsights } from "@/lib/table-insights";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";

import { getActionErrorMessage } from "@/lib/action-error";
export default function AdminCategoriesPage() {
  const { data, refresh } = useAdminSubjectCategories();
  const [form, setForm] = useState({ name: "", slug: "", color: "#273461" });
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleBulkDelete = useBulkDeleteHandler(bulkDeleteSubjectCategories, "category", refresh);
  const summaryItems = useMemo(() => categoryTableSummary(data), [data]);

  const handleAdd = async () => {
    try {
      const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, "-");
      await addSubjectCategory({ name: form.name, slug, color: form.color });
      refresh();
      setForm({ name: "", slug: "", color: "#273461" });
      toast.success("Category added");
    } catch (e) {
      toast.error(getActionErrorMessage(e, "Failed to add category"));
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await deleteSubjectCategory(id);
      refresh();
      toast.success("Category deleted");
      setDeleteTargetId(null);
    } catch (e) {
      toast.error(getActionErrorMessage(e, "Delete failed"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Subject Categories" description="Calendar color categories for class scheduling" />
      <div className="grid gap-3 rounded-xl border  p-4 md:grid-cols-4">
        <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}  placeholder="Biology" /></div>
        <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })}  placeholder="biology" /></div>
        <div><Label>Color</Label><Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-10 bg-muted border-input" /></div>
        <div className="flex items-end"><Button onClick={handleAdd} className="w-full"><Plus className="mr-2 size-4" />Add Category</Button></div>
      </div>
      <AdminTableSection
        data={data}
        columns={[
          { key: "name", label: "Name" },
          { key: "slug", label: "Slug" },
          { key: "color", label: "Color" },
          { key: "active", label: "Active" },
        ]}
        summaryItems={summaryItems}
        getSelectionInsights={categorySelectionInsights}
        entityLabel="category"
        onBulkDelete={handleBulkDelete}
        onDelete={(id) => setDeleteTargetId(id)}
        onActionComplete={refresh}
      />

      <DeleteConfirmDialog
        open={!!deleteTargetId}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
        entityLabel="this category"
        deleting={deleting}
        onConfirm={() => {
          if (deleteTargetId) void handleDelete(deleteTargetId);
        }}
      />
    </div>
  );
}
