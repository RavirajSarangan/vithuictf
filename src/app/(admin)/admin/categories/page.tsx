"use client";

import { useState } from "react";
import { addSubjectCategory, deleteSubjectCategory } from "@/lib/actions/calendar";
import { useAdminSubjectCategories } from "@/hooks/use-calendar";
import { AdminTable } from "@/components/admin/admin-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";

export default function AdminCategoriesPage() {
  const { data, refresh } = useAdminSubjectCategories();
  const [form, setForm] = useState({ name: "", slug: "", color: "#273461" });

  const handleAdd = async () => {
    try {
      const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, "-");
      await addSubjectCategory({ name: form.name, slug, color: form.color });
      refresh();
      setForm({ name: "", slug: "", color: "#273461" });
      toast.success("Category added");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add category");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSubjectCategory(id);
      refresh();
      toast.success("Category deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
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
      <AdminTable columns={[{ key: "name", label: "Name" }, { key: "slug", label: "Slug" }, { key: "color", label: "Color" }, { key: "active", label: "Active" }]} data={data} onDelete={handleDelete} />
    </div>
  );
}
