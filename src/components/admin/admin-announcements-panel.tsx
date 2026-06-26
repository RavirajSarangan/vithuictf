"use client";

import { useMemo, useState } from "react";
import {
  addMarketingAnnouncement,
  deleteMarketingAnnouncement,
  updateMarketingAnnouncement,
  type MarketingAnnouncementInput,
} from "@/lib/actions/admin";
import { useAdminMarketingAnnouncements } from "@/hooks/use-data";
import { AdminImageUpload } from "@/components/admin/admin-image-upload";
import { AdminTable } from "@/components/admin/admin-table";
import { MarketingAnnouncementPopup } from "@/components/landing/marketing-announcement-popup";
import { GlassCard } from "@/components/shared/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Eye, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import type {
  MarketingAnnouncement,
  MarketingAnnouncementContentType,
  MarketingAnnouncementDisplayStyle,
} from "@/types";

const CONTENT_TYPE_OPTIONS: { value: MarketingAnnouncementContentType; label: string }[] = [
  { value: "text_only", label: "Text only" },
  { value: "image_only", label: "Image only" },
  { value: "text_image", label: "Text + image" },
  { value: "text_image_link", label: "Text + image + link" },
];

const DISPLAY_STYLE_OPTIONS: { value: MarketingAnnouncementDisplayStyle; label: string }[] = [
  { value: "card", label: "Card" },
  { value: "minimal", label: "Minimal" },
  { value: "image_hero", label: "Image hero" },
  { value: "promo", label: "Promo" },
];

type FormState = {
  title: string;
  body: string;
  imageUrl: string;
  ctaLabel: string;
  ctaUrl: string;
  contentType: MarketingAnnouncementContentType;
  displayStyle: MarketingAnnouncementDisplayStyle;
  startsAt: string;
  endsAt: string;
  priority: string;
  isActive: boolean;
};

const EMPTY_FORM: FormState = {
  title: "",
  body: "",
  imageUrl: "",
  ctaLabel: "",
  ctaUrl: "",
  contentType: "text_only",
  displayStyle: "card",
  startsAt: "",
  endsAt: "",
  priority: "0",
  isActive: true,
};

function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDatetimeLocalValue(value: string): string | null {
  if (!value.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function announcementToForm(announcement: MarketingAnnouncement): FormState {
  return {
    title: announcement.title,
    body: announcement.body,
    imageUrl: announcement.imageUrl,
    ctaLabel: announcement.ctaLabel,
    ctaUrl: announcement.ctaUrl,
    contentType: announcement.contentType,
    displayStyle: announcement.displayStyle,
    startsAt: toDatetimeLocalValue(announcement.startsAt),
    endsAt: toDatetimeLocalValue(announcement.endsAt),
    priority: String(announcement.priority),
    isActive: announcement.isActive,
  };
}

function formToInput(form: FormState): MarketingAnnouncementInput {
  return {
    title: form.title,
    body: form.body,
    imageUrl: form.imageUrl,
    ctaLabel: form.ctaLabel,
    ctaUrl: form.ctaUrl,
    contentType: form.contentType,
    displayStyle: form.displayStyle,
    startsAt: fromDatetimeLocalValue(form.startsAt),
    endsAt: fromDatetimeLocalValue(form.endsAt),
    priority: Number.parseInt(form.priority, 10) || 0,
    isActive: form.isActive,
  };
}

function formToPreviewAnnouncement(form: FormState): MarketingAnnouncement {
  return {
    id: "preview",
    title: form.title,
    body: form.body,
    imageUrl: form.imageUrl,
    ctaLabel: form.ctaLabel,
    ctaUrl: form.ctaUrl,
    contentType: form.contentType,
    displayStyle: form.displayStyle,
    startsAt: fromDatetimeLocalValue(form.startsAt),
    endsAt: fromDatetimeLocalValue(form.endsAt),
    priority: Number.parseInt(form.priority, 10) || 0,
    isActive: form.isActive,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function getAnnouncementStatus(announcement: MarketingAnnouncement): {
  label: string;
  variant: "default" | "secondary" | "outline" | "destructive";
} {
  const now = Date.now();
  if (!announcement.isActive) {
    return { label: "Inactive", variant: "secondary" };
  }
  if (announcement.startsAt && new Date(announcement.startsAt).getTime() > now) {
    return { label: "Scheduled", variant: "outline" };
  }
  if (announcement.endsAt && new Date(announcement.endsAt).getTime() < now) {
    return { label: "Expired", variant: "destructive" };
  }
  return { label: "Live", variant: "default" };
}

export function AdminAnnouncementsPanel() {
  const { data, refresh } = useAdminMarketingAnnouncements();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const previewAnnouncement = useMemo(() => formToPreviewAnnouncement(form), [form]);

  const needsImage =
    form.contentType === "image_only" ||
    form.contentType === "text_image" ||
    form.contentType === "text_image_link";
  const needsLink = form.contentType === "text_image_link";
  const needsText = form.contentType !== "image_only";

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const onSave = async () => {
    setSaving(true);
    try {
      const payload = formToInput(form);
      if (editingId) {
        await updateMarketingAnnouncement(editingId, payload);
        toast.success("Announcement updated");
      } else {
        await addMarketingAnnouncement(payload);
        toast.success("Announcement created");
      }
      resetForm();
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    try {
      await deleteMarketingAnnouncement(id);
      if (editingId === id) resetForm();
      refresh();
      toast.success("Announcement deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete");
    }
  };

  const onEdit = (announcement: MarketingAnnouncement) => {
    setEditingId(announcement.id);
    setForm(announcementToForm(announcement));
  };

  return (
    <div className="flex flex-col gap-6">
      <GlassCard className="p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-heading text-lg font-semibold">
              {editingId ? "Edit announcement" : "New announcement"}
            </h3>
            <p className="text-sm text-muted-foreground">
              Popups appear on all marketing pages while active and within the scheduled window.
            </p>
          </div>
          {editingId && (
            <Button type="button" variant="outline" size="sm" onClick={resetForm}>
              Cancel edit
            </Button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Content type</Label>
            <Select
              value={form.contentType}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  contentType: value as MarketingAnnouncementContentType,
                }))
              }
            >
              <SelectTrigger >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Display style</Label>
            <Select
              value={form.displayStyle}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  displayStyle: value as MarketingAnnouncementDisplayStyle,
                }))
              }
            >
              <SelectTrigger >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DISPLAY_STYLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {needsText && (
            <>
              <div className="space-y-2 sm:col-span-2">
                <Label>Title</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  
                  placeholder="New release, offer, or update"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Body</Label>
                <Textarea
                  value={form.body}
                  onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
                  className="min-h-24 border-input bg-muted text-foreground"
                  placeholder="Announcement details…"
                />
              </div>
            </>
          )}

          {needsImage && (
            <div className="space-y-2 sm:col-span-2">
              <AdminImageUpload
                label="Image"
                folder="announcements"
                value={form.imageUrl}
                onChange={(url) => setForm((prev) => ({ ...prev, imageUrl: url }))}
              />
            </div>
          )}

          {needsLink && (
            <>
              <div className="space-y-2">
                <Label>CTA label</Label>
                <Input
                  value={form.ctaLabel}
                  onChange={(e) => setForm((prev) => ({ ...prev, ctaLabel: e.target.value }))}
                  
                  placeholder="Learn more"
                />
              </div>
              <div className="space-y-2">
                <Label>CTA URL</Label>
                <Input
                  value={form.ctaUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, ctaUrl: e.target.value }))}
                  
                  placeholder="https://… or /register"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Starts at</Label>
            <Input
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => setForm((prev) => ({ ...prev, startsAt: e.target.value }))}
              
            />
          </div>
          <div className="space-y-2">
            <Label>Ends at</Label>
            <Input
              type="datetime-local"
              value={form.endsAt}
              onChange={(e) => setForm((prev) => ({ ...prev, endsAt: e.target.value }))}
              
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

          <div className="flex items-center justify-between rounded-lg border  px-4 py-3">
            <div>
              <Label className="text-foreground">Active</Label>
              <p className="text-xs text-muted-foreground">Inactive announcements never show publicly.</p>
            </div>
            <Switch
              checked={form.isActive}
              onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isActive: checked }))}
            />
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
              "Update announcement"
            ) : (
              <>
                <Plus className="mr-2 size-4" />
                Create announcement
              </>
            )}
          </Button>
          <Button type="button" variant="outline" onClick={() => setPreviewOpen(true)}>
            <Eye className="mr-2 size-4" />
            Preview popup
          </Button>
        </div>
      </GlassCard>

      <AdminTable
        data={data}
        emptyMessage="No announcements yet"
        onDelete={(id) => void onDelete(id)}
        onView={onEdit}
        columns={[
          {
            key: "title",
            label: "Title",
            render: (row) => row.title || "(Image only)",
          },
          {
            key: "contentType",
            label: "Type",
            render: (row) =>
              CONTENT_TYPE_OPTIONS.find((o) => o.value === row.contentType)?.label ?? row.contentType,
          },
          {
            key: "displayStyle",
            label: "Style",
            render: (row) =>
              DISPLAY_STYLE_OPTIONS.find((o) => o.value === row.displayStyle)?.label ?? row.displayStyle,
          },
          {
            key: "priority",
            label: "Priority",
          },
          {
            key: "isActive",
            label: "Status",
            render: (row) => {
              const status = getAnnouncementStatus(row);
              return <Badge variant={status.variant}>{status.label}</Badge>;
            },
          },
        ]}
      />

      {previewOpen && (
        <MarketingAnnouncementPopup
          announcement={previewAnnouncement}
          preview
          previewOpen={previewOpen}
          onPreviewOpenChange={setPreviewOpen}
        />
      )}
    </div>
  );
}
