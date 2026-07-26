"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, BookOpen, Loader2, Pencil, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AdminImageUpload } from "@/components/admin/admin-image-upload";
import { getActionErrorMessage } from "@/lib/action-error";
import { createEbook, deleteEbook, updateEbook } from "@/lib/actions/ebooks";
import { useAdminEbooks } from "@/hooks/use-data";
import type { Ebook } from "@/types";

type EbookDraft = {
  title: string;
  subtitle: string;
  coverImageUrl: string;
  badgeLabel: string;
  footerLabel: string;
  accentColor: string;
  previewUrl: string;
  driveLink: string;
  published: boolean;
};

const EMPTY_DRAFT: EbookDraft = {
  title: "",
  subtitle: "",
  coverImageUrl: "",
  badgeLabel: "DOWNLOAD",
  footerLabel: "E-BOOK",
  accentColor: "#F5A623",
  previewUrl: "",
  driveLink: "",
  published: true,
};

function ebookToDraft(ebook: Ebook): EbookDraft {
  return {
    title: ebook.title,
    subtitle: ebook.subtitle,
    coverImageUrl: ebook.coverImageUrl,
    badgeLabel: ebook.badgeLabel,
    footerLabel: ebook.footerLabel,
    accentColor: ebook.accentColor,
    previewUrl: ebook.previewUrl ?? "",
    driveLink: ebook.driveLink ?? "",
    published: ebook.published,
  };
}

function EbookFields({
  draft,
  onChange,
  idPrefix,
}: {
  draft: EbookDraft;
  onChange: (patch: Partial<EbookDraft>) => void;
  idPrefix: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-title`}>Title</Label>
          <Input
            id={`${idPrefix}-title`}
            value={draft.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Introduction to IoT"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-subtitle`}>Subtitle</Label>
          <Input
            id={`${idPrefix}-subtitle`}
            value={draft.subtitle}
            onChange={(e) => onChange({ subtitle: e.target.value })}
            placeholder="For O/L & A/L students"
          />
        </div>
      </div>

      <AdminImageUpload
        label="Cover image"
        value={draft.coverImageUrl}
        folder="ebooks"
        onChange={(url) => onChange({ coverImageUrl: url })}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-badge`}>Badge label</Label>
          <Input
            id={`${idPrefix}-badge`}
            value={draft.badgeLabel}
            onChange={(e) => onChange({ badgeLabel: e.target.value })}
            placeholder="DOWNLOAD"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-footer`}>Footer label</Label>
          <Input
            id={`${idPrefix}-footer`}
            value={draft.footerLabel}
            onChange={(e) => onChange({ footerLabel: e.target.value })}
            placeholder="E-BOOK"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-accent`}>Accent color</Label>
          <div className="flex items-center gap-2">
            <input
              id={`${idPrefix}-accent`}
              type="color"
              value={draft.accentColor}
              onChange={(e) => onChange({ accentColor: e.target.value })}
              className="h-9 w-10 shrink-0 cursor-pointer rounded border border-input bg-transparent p-1"
            />
            <Input
              value={draft.accentColor}
              onChange={(e) => onChange({ accentColor: e.target.value })}
              className="font-mono text-xs"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-preview`}>Preview link</Label>
          <Input
            id={`${idPrefix}-preview`}
            value={draft.previewUrl}
            onChange={(e) => onChange({ previewUrl: e.target.value })}
            placeholder="https://drive.google.com/file/d/.../view"
          />
          <p className="text-xs text-muted-foreground">
            Must be a Google Drive <strong>file</strong> share link (Anyone with the link can view) —
            not a folder link. Opens in an in-page preview, no redirect.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-drive`}>Drive download link</Label>
          <Input
            id={`${idPrefix}-drive`}
            value={draft.driveLink}
            onChange={(e) => onChange({ driveLink: e.target.value })}
            placeholder="https://drive.google.com/file/d/.../view"
          />
          <p className="text-xs text-muted-foreground">
            Same requirement — a Drive <strong>file</strong> link, not a folder. Triggers a direct
            download without leaving the homepage.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-black/20 px-4 py-3">
        <div className="space-y-0.5">
          <Label htmlFor={`${idPrefix}-published`}>Published</Label>
          <p className="text-xs text-muted-foreground">
            When off, this e-book is hidden from the homepage.
          </p>
        </div>
        <Switch
          id={`${idPrefix}-published`}
          checked={draft.published}
          onCheckedChange={(checked) => onChange({ published: checked })}
        />
      </div>
    </div>
  );
}

function EbookListItem({
  ebook,
  isFirst,
  isLast,
  onChanged,
}: {
  ebook: Ebook;
  isFirst: boolean;
  isLast: boolean;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<EbookDraft>(() => ebookToDraft(ebook));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reordering, setReordering] = useState(false);

  const startEditing = () => {
    setDraft(ebookToDraft(ebook));
    setEditing(true);
  };

  const handleSave = async () => {
    if (!draft.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      const result = await updateEbook(ebook.id, {
        title: draft.title,
        subtitle: draft.subtitle,
        coverImageUrl: draft.coverImageUrl,
        badgeLabel: draft.badgeLabel,
        footerLabel: draft.footerLabel,
        accentColor: draft.accentColor,
        previewUrl: draft.previewUrl || null,
        driveLink: draft.driveLink || null,
        published: draft.published,
      });
      if (!result.ok) throw new Error(result.error);
      toast.success("E-book updated");
      setEditing(false);
      onChanged();
    } catch (e) {
      toast.error(getActionErrorMessage(e, "Failed to update e-book"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(`Delete "${ebook.title}"? This cannot be undone.`);
    if (!confirmed) return;
    setDeleting(true);
    try {
      const result = await deleteEbook(ebook.id);
      if (!result.ok) throw new Error(result.error);
      toast.success("E-book deleted");
      onChanged();
    } catch (e) {
      toast.error(getActionErrorMessage(e, "Failed to delete e-book"));
    } finally {
      setDeleting(false);
    }
  };

  const handleMove = async (direction: "up" | "down") => {
    setReordering(true);
    try {
      const nextSortOrder = direction === "up" ? ebook.sortOrder - 1 : ebook.sortOrder + 1;
      const result = await updateEbook(ebook.id, { sortOrder: nextSortOrder });
      if (!result.ok) throw new Error(result.error);
      onChanged();
    } catch (e) {
      toast.error(getActionErrorMessage(e, "Failed to reorder"));
    } finally {
      setReordering(false);
    }
  };

  if (editing) {
    return (
      <div className="rounded-xl border p-4">
        <EbookFields draft={draft} onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))} idPrefix={`edit-${ebook.id}`} />
        <div className="mt-4 flex items-center gap-2">
          <Button size="sm" disabled={saving} onClick={() => void handleSave()}>
            {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Save
          </Button>
          <Button size="sm" variant="outline" disabled={saving} onClick={() => setEditing(false)}>
            <X className="mr-2 size-4" />
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 rounded-xl border p-4">
      <div className="h-16 w-12 shrink-0 overflow-hidden rounded-md border bg-muted/30">
        {ebook.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ebook.coverImageUrl} alt={ebook.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <BookOpen className="size-5" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{ebook.title}</p>
          {ebook.published ? (
            <Badge variant="secondary">Published</Badge>
          ) : (
            <Badge variant="outline">Hidden</Badge>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {ebook.subtitle || "No subtitle"} · {ebook.downloadCount} download
          {ebook.downloadCount === 1 ? "" : "s"}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          title="Move up"
          disabled={isFirst || reordering}
          onClick={() => void handleMove("up")}
        >
          <ArrowUp className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          title="Move down"
          disabled={isLast || reordering}
          onClick={() => void handleMove("down")}
        >
          <ArrowDown className="size-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" title="Edit" onClick={startEditing}>
          <Pencil className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          title="Delete"
          disabled={deleting}
          onClick={() => void handleDelete()}
        >
          {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4 text-destructive" />}
        </Button>
      </div>
    </div>
  );
}

export function AdminEbooksPanel() {
  const { data: ebooks, refresh } = useAdminEbooks();
  const [draft, setDraft] = useState<EbookDraft>(EMPTY_DRAFT);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!draft.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setCreating(true);
    try {
      const result = await createEbook({
        title: draft.title,
        subtitle: draft.subtitle,
        coverImageUrl: draft.coverImageUrl,
        badgeLabel: draft.badgeLabel,
        footerLabel: draft.footerLabel,
        accentColor: draft.accentColor,
        previewUrl: draft.previewUrl || undefined,
        driveLink: draft.driveLink || undefined,
        published: draft.published,
      });
      if (!result.ok) throw new Error(result.error);
      toast.success("E-book created");
      setDraft(EMPTY_DRAFT);
      refresh();
    } catch (e) {
      toast.error(getActionErrorMessage(e, "Failed to create e-book"));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="size-5" />
            Add e-book
          </CardTitle>
          <CardDescription>
            Shown as a floating download card on the homepage hero. Cover image, text, style, and
            download links are all managed here.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <EbookFields draft={draft} onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))} idPrefix="create" />
          <Button disabled={creating} className="w-fit" onClick={() => void handleCreate()}>
            {creating ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Add e-book
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>E-books</CardTitle>
          <CardDescription>
            {ebooks.length} e-book{ebooks.length === 1 ? "" : "s"}. The top entry appears on the homepage.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ebooks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No e-books yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {ebooks.map((ebook, index) => (
                <EbookListItem
                  key={ebook.id}
                  ebook={ebook}
                  isFirst={index === 0}
                  isLast={index === ebooks.length - 1}
                  onChanged={refresh}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
