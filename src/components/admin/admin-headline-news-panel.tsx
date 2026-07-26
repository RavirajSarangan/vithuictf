"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getActionErrorMessage } from "@/lib/action-error";
import {
  addHeadlineNews,
  deleteHeadlineNews,
  updateHeadlineNews,
  type HeadlineNewsInput,
} from "@/lib/actions/admin";
import { syncClientCachesAfterAdminSave } from "@/lib/client-cache-sync";
import { useAdminHeadlineNews } from "@/hooks/use-data";
import { AdminImageUpload } from "@/components/admin/admin-image-upload";
import { AdminTableSection } from "@/components/admin/admin-table-section";
import { DeleteConfirmDialog } from "@/components/admin/bulk-delete-dialog";
import { useBulkDeleteHandler } from "@/hooks/use-bulk-delete";
import { bulkDeleteHeadlineNews } from "@/lib/actions/bulk-delete";
import { headlineNewsTableSummary, genericSelectionInsights } from "@/lib/table-insights";
import { HeroHeadlineNews } from "@/components/landing/hero-headline-news";
import { GlassCard } from "@/components/shared/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import type { HeadlineNews } from "@/types";

type FormState = {
  tagLabel: string;
  title: string;
  caption: string;
  imageUrl: string;
  linkLabel: string;
  linkUrl: string;
  priority: string;
  isActive: boolean;
};

const EMPTY_FORM: FormState = {
  tagLabel: "News",
  title: "",
  caption: "",
  imageUrl: "",
  linkLabel: "",
  linkUrl: "",
  priority: "0",
  isActive: true,
};

function headlineNewsToForm(item: HeadlineNews): FormState {
  return {
    tagLabel: item.tagLabel,
    title: item.title,
    caption: item.caption,
    imageUrl: item.imageUrl,
    linkLabel: item.linkLabel,
    linkUrl: item.linkUrl,
    priority: String(item.priority),
    isActive: item.isActive,
  };
}

function formToInput(form: FormState): HeadlineNewsInput {
  return {
    tagLabel: form.tagLabel,
    title: form.title,
    caption: form.caption,
    imageUrl: form.imageUrl,
    linkLabel: form.linkLabel,
    linkUrl: form.linkUrl,
    priority: Number.parseInt(form.priority, 10) || 0,
    isActive: form.isActive,
  };
}

function formToPreviewItem(form: FormState): HeadlineNews {
  return {
    id: "preview",
    tagLabel: form.tagLabel || "News",
    title: form.title,
    caption: form.caption,
    imageUrl: form.imageUrl,
    linkLabel: form.linkLabel,
    linkUrl: form.linkUrl,
    priority: Number.parseInt(form.priority, 10) || 0,
    isActive: form.isActive,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function AdminHeadlineNewsPanel() {
  const router = useRouter();
  const { data, refresh } = useAdminHeadlineNews();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleBulkDelete = useBulkDeleteHandler(bulkDeleteHeadlineNews, "headline news item", () => {
    refresh();
    syncClientCachesAfterAdminSave();
    router.refresh();
  });
  const summaryItems = useMemo(() => headlineNewsTableSummary(data), [data]);
  const previewItem = useMemo(() => formToPreviewItem(form), [form]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const onSave = async () => {
    if (!form.title.trim()) {
      toast.error("Enter a title");
      return;
    }
    setSaving(true);
    try {
      const payload = formToInput(form);
      if (editingId) {
        await updateHeadlineNews(editingId, payload);
        toast.success("Headline news updated");
      } else {
        await addHeadlineNews(payload);
        toast.success("Headline news created");
      }
      resetForm();
      refresh();
      syncClientCachesAfterAdminSave();
      router.refresh();
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to save"));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    setDeleting(true);
    try {
      await deleteHeadlineNews(id);
      if (editingId === id) resetForm();
      refresh();
      syncClientCachesAfterAdminSave();
      router.refresh();
      toast.success("Headline news deleted");
      setDeleteTargetId(null);
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to delete"));
    } finally {
      setDeleting(false);
    }
  };

  const onEdit = (item: HeadlineNews) => {
    setEditingId(item.id);
    setForm(headlineNewsToForm(item));
  };

  return (
    <div className="flex flex-col gap-6">
      <GlassCard className="p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-heading text-lg font-semibold">
              {editingId ? "Edit headline news" : "New headline news"}
            </h3>
            <p className="text-sm text-muted-foreground">
              Shown inline in the homepage hero. The highest-priority active item is displayed.
            </p>
          </div>
          {editingId && (
            <Button type="button" variant="outline" size="sm" onClick={resetForm}>
              Cancel edit
            </Button>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Tag label</Label>
            <Input
              value={form.tagLabel}
              onChange={(e) => setForm((prev) => ({ ...prev, tagLabel: e.target.value }))}
              placeholder="News"
            />
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Input
              type="number"
              value={form.priority}
              onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="New batch enrolling now"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Caption</Label>
            <Textarea
              value={form.caption}
              onChange={(e) => setForm((prev) => ({ ...prev, caption: e.target.value }))}
              className="min-h-20 border-input bg-muted text-foreground"
              placeholder="Short supporting detail…"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <AdminImageUpload
              label="Image (optional)"
              folder="headline-news"
              value={form.imageUrl}
              onChange={(url) => setForm((prev) => ({ ...prev, imageUrl: url }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Link label (optional)</Label>
            <Input
              value={form.linkLabel}
              onChange={(e) => setForm((prev) => ({ ...prev, linkLabel: e.target.value }))}
              placeholder="Learn more"
            />
          </div>
          <div className="space-y-2">
            <Label>Link URL (optional)</Label>
            <Input
              value={form.linkUrl}
              onChange={(e) => setForm((prev) => ({ ...prev, linkUrl: e.target.value }))}
              placeholder="https://… or /register"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border px-4 py-3 sm:col-span-2">
            <div>
              <Label className="text-foreground">Active</Label>
              <p className="text-xs text-muted-foreground">Inactive items never show on the homepage.</p>
            </div>
            <Switch
              checked={form.isActive}
              onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isActive: checked }))}
            />
          </div>
        </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Live preview
            </Label>
            <div className="rounded-2xl border border-dashed border-icvf-accent/30 bg-icvf-surface/40 p-4">
              <HeroHeadlineNews headlineNews={previewItem} />
              {!previewItem.title.trim() && !previewItem.caption.trim() && (
                <p className="text-xs text-muted-foreground">
                  Add a title or caption to see the hero preview.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button type="button" disabled={saving} onClick={() => void onSave()}>
            {saving ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Saving…
              </>
            ) : editingId ? (
              "Update headline news"
            ) : (
              <>
                <Plus className="mr-2 size-4" />
                Create headline news
              </>
            )}
          </Button>
        </div>
      </GlassCard>

      <AdminTableSection
        data={data}
        emptyMessage="No headline news yet"
        summaryItems={summaryItems}
        getSelectionInsights={(rows) =>
          genericSelectionInsights(rows, (row) => ((row as HeadlineNews).isActive ? "Active" : "Inactive"))
        }
        entityLabel="headline news item"
        onBulkDelete={handleBulkDelete}
        onDelete={setDeleteTargetId}
        onView={onEdit}
        onActionComplete={() => {
          refresh();
          syncClientCachesAfterAdminSave();
          router.refresh();
        }}
        columns={[
          { key: "title", label: "Title" },
          { key: "tagLabel", label: "Tag" },
          { key: "priority", label: "Priority" },
          {
            key: "isActive",
            label: "Status",
            render: (row) => (
              <Badge variant={row.isActive ? "default" : "secondary"}>
                {row.isActive ? "Active" : "Inactive"}
              </Badge>
            ),
          },
        ]}
      />

      <DeleteConfirmDialog
        open={!!deleteTargetId}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
        entityLabel="headline news item"
        deleting={deleting}
        onConfirm={() => {
          if (deleteTargetId) void onDelete(deleteTargetId);
        }}
      />
    </div>
  );
}
