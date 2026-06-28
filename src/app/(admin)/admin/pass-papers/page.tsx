"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { usePassPaperFoldersAdmin, usePassPaperItems, useAllPassPaperItems } from "@/hooks/use-pass-papers";
import {
  bulkCreatePassPaperYearFolders,
  createPassPaperFolder,
  createPassPaperItem,
  deletePassPaperFolder,
  deletePassPaperItem,
  publishPassPaperFolderWithDescendants,
  publishPassPaperItemsInFolder,
  updatePassPaperFolder,
  updatePassPaperItem,
} from "@/lib/actions/pass-papers";
import { buildPassPaperUrl, getDriveLinkKind, isFolderDescendant } from "@/lib/pass-papers-utils";
import { PassPaperFolderTree } from "@/components/pass-papers/pass-paper-folder-tree";
import { PassPaperFolderBreadcrumbs } from "@/components/pass-papers/pass-paper-folder-breadcrumbs";
import {
  PassPaperBulkYearsDialog,
  PassPaperLinkEditDialog,
  PassPaperLinkForm,
  parseLinkFormValues,
  type PassPaperLinkFormValues,
} from "@/components/pass-papers/pass-paper-link-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AdminTable } from "@/components/admin/admin-table";
import { Badge } from "@/components/ui/badge";
import type { PassPaperFolder, PassPaperItem, PassPaperLayout } from "@/types";
import { FolderOpen, Link2, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PassPaperBrowser } from "@/components/pass-papers/pass-paper-browser";

const ICON_OPTIONS = ["folder", "folder-open", "book-open", "file-text", "graduation-cap", "layers"];
const LAYOUT_OPTIONS = ["folder", "grid", "list"] as const;

type FolderDraft = {
  title: string;
  description: string;
  iconKey: string;
  accentColor: string;
  layout: PassPaperLayout;
  published: boolean;
  parentId: string | null;
};

function folderToDraft(folder: PassPaperFolder): FolderDraft {
  return {
    title: folder.title,
    description: folder.description,
    iconKey: folder.iconKey,
    accentColor: folder.accentColor,
    layout: folder.layout,
    published: folder.published,
    parentId: folder.parentId,
  };
}

export default function AdminPassPapersPage() {
  const { folders, loading, refresh, patchFolder } = usePassPaperFoldersAdmin();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = folders.find((f) => f.id === selectedId) ?? null;
  const { items, refresh: refreshItems } = usePassPaperItems(selected?.id ?? null);
  const { items: allItems } = useAllPassPaperItems();
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<FolderDraft | null>(null);
  const draftFolderIdRef = useRef<string | null>(null);

  const [newFolderTitle, setNewFolderTitle] = useState("");
  const [publishOnAdd, setPublishOnAdd] = useState(false);
  const [linkSubmitting, setLinkSubmitting] = useState(false);
  const [bulkYearsOpen, setBulkYearsOpen] = useState(false);
  const [bulkYearsSubmitting, setBulkYearsSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<PassPaperItem | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [linkFormKey, setLinkFormKey] = useState(0);

  useEffect(() => {
    if (!selected) {
      setDraft(null);
      draftFolderIdRef.current = null;
      return;
    }
    if (draftFolderIdRef.current !== selected.id) {
      setDraft(folderToDraft(selected));
      draftFolderIdRef.current = selected.id;
    }
  }, [selected]);

  const parentOptions = useMemo(() => {
    if (!selected) return folders;
    return folders.filter(
      (f) => f.id !== selected.id && !isFolderDescendant(folders, selected.id, f.id)
    );
  }, [folders, selected]);

  const previewFolders = useMemo(() => {
    if (!selected || !draft) return folders;
    return folders.map((folder) => (folder.id === selected.id ? { ...folder, ...draft } : folder));
  }, [folders, selected, draft]);

  const saveFolderDraft = async (nextDraft: FolderDraft) => {
    if (!selected) return;
    setSaving(true);
    try {
      await updatePassPaperFolder(selected.id, {
        title: nextDraft.title,
        description: nextDraft.description,
        iconKey: nextDraft.iconKey,
        accentColor: nextDraft.accentColor,
        layout: nextDraft.layout,
        published: nextDraft.published,
        parentId: nextDraft.parentId,
      });
      patchFolder(selected.id, {
        ...nextDraft,
        parentId: nextDraft.parentId,
      });
      refresh();
      toast.success("Folder saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
      setDraft(folderToDraft(selected));
    } finally {
      setSaving(false);
    }
  };

  const handleCreateFolder = async (parentId: string | null) => {
    if (!newFolderTitle.trim()) return;
    try {
      const result = await createPassPaperFolder({
        parentId,
        title: newFolderTitle.trim(),
      });
      setNewFolderTitle("");
      refresh();
      setSelectedId(result.id);
      toast.success(parentId ? "Subfolder created" : "Root folder created");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Create failed");
    }
  };

  const handleDeleteFolder = async (folder?: PassPaperFolder) => {
    const target = folder ?? selected;
    if (!target) return;
    if (!confirm(`Delete "${target.title}" and all nested folders and links?`)) return;
    const parentId = target.parentId;
    try {
      await deletePassPaperFolder(target.id);
      if (selectedId === target.id) {
        setSelectedId(parentId);
      }
      refresh();
      toast.success("Folder deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const handleCopyPublicUrl = async (folder: PassPaperFolder) => {
    const path = buildPassPaperUrl("/pass-papers", folder.id, folders);
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Public URL copied");
    } catch {
      toast.error("Could not copy URL");
    }
  };

  const handlePublishSubtree = async (published: boolean) => {
    if (!selected) return;
    try {
      const result = await publishPassPaperFolderWithDescendants(selected.id, published);
      refresh();
      toast.success(
        `${published ? "Published" : "Unpublished"} ${result.updated} folder${result.updated === 1 ? "" : "s"}`
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  const handlePublishAllLinks = async (published: boolean) => {
    if (!selected) return;
    try {
      await publishPassPaperItemsInFolder(selected.id, published);
      refreshItems();
      toast.success(published ? "All links in folder published" : "All links in folder unpublished");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  const handleAddLink = async (values: PassPaperLinkFormValues) => {
    if (!selected) return;
    setLinkSubmitting(true);
    try {
      const parsed = parseLinkFormValues(values, publishOnAdd);
      await createPassPaperItem({
        folderId: selected.id,
        ...parsed,
      });
      refreshItems();
      setLinkFormKey((k) => k + 1);
      toast.success("Pass paper link added");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Add failed");
    } finally {
      setLinkSubmitting(false);
    }
  };

  const handleEditLink = async (values: PassPaperLinkFormValues) => {
    if (!editingItem) return;
    setLinkSubmitting(true);
    try {
      const year = values.year.trim() ? Number(values.year) : null;
      await updatePassPaperItem(editingItem.id, {
        folderId: values.folderId || editingItem.folderId,
        title: values.title.trim(),
        driveUrl: values.driveUrl.trim(),
        year: year && !Number.isNaN(year) ? year : null,
        medium: values.medium || null,
        examType: values.examType,
        published: values.published,
      });
      refreshItems();
      toast.success("Link updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setLinkSubmitting(false);
    }
  };

  const handleBulkYears = async (startYear: number, endYear: number) => {
    if (!selected) return;
    setBulkYearsSubmitting(true);
    try {
      const result = await bulkCreatePassPaperYearFolders(selected.id, startYear, endYear);
      refresh();
      toast.success(`Created ${result.created} year folder${result.created === 1 ? "" : "s"}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Bulk create failed");
    } finally {
      setBulkYearsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pass Papers Network"
        description="Manage folder structure, design, and Google Drive links (no uploads)"
      />

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="space-y-3 rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 font-medium">
            <FolderOpen className="size-4" /> Folders
          </div>
          <PassPaperFolderTree
            folders={folders}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onDelete={(folder) => void handleDeleteFolder(folder)}
            onCopyPublicUrl={(folder) => void handleCopyPublicUrl(folder)}
            loading={loading}
          />
          <div className="space-y-2 border-t border-border pt-3">
            <Label className="text-xs text-muted-foreground">New folder</Label>
            <div className="flex gap-2">
              <Input
                value={newFolderTitle}
                onChange={(e) => setNewFolderTitle(e.target.value)}
                placeholder="Folder name"
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleCreateFolder(selected?.id ?? null);
                }}
              />
              <Button
                type="button"
                size="icon"
                title="Add subfolder under selection"
                onClick={() => void handleCreateFolder(selected?.id ?? null)}
              >
                <Plus className="size-4" />
              </Button>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => void handleCreateFolder(null)}
            >
              New root folder
            </Button>
            {selected ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setBulkYearsOpen(true)}
              >
                Bulk year folders
              </Button>
            ) : null}
          </div>
        </aside>

        <div className="space-y-6">
          <PassPaperFolderBreadcrumbs
            folders={folders}
            selected={selected}
            onSelect={setSelectedId}
          />

          {selected && draft ? (
            <>
              <section className="space-y-4 rounded-lg border border-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-semibold">Folder design</h2>
                  <Button
                    type="button"
                    size="sm"
                    disabled={saving}
                    onClick={() => void saveFolderDraft(draft)}
                  >
                    {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                    Save changes
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={draft.title}
                      onChange={(e) => setDraft((prev) => (prev ? { ...prev, title: e.target.value } : prev))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Parent folder</Label>
                    <Select
                      value={draft.parentId ?? "root"}
                      onValueChange={(value) =>
                        setDraft((prev) =>
                          prev ? { ...prev, parentId: value === "root" ? null : value } : prev
                        )
                      }
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="root">Root level</SelectItem>
                        {parentOptions.map((folder) => (
                          <SelectItem key={folder.id} value={folder.id}>
                            {folder.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Accent color</Label>
                    <Input
                      type="color"
                      value={draft.accentColor}
                      onChange={(e) => setDraft((prev) => (prev ? { ...prev, accentColor: e.target.value } : prev))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Icon</Label>
                    <Select
                      value={draft.iconKey}
                      onValueChange={(value) => {
                        if (!value) return;
                        setDraft((prev) => (prev ? { ...prev, iconKey: value } : prev));
                      }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ICON_OPTIONS.map((icon) => (
                          <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Layout</Label>
                    <Select
                      value={draft.layout}
                      onValueChange={(value) => {
                        if (!value) return;
                        setDraft((prev) =>
                          prev ? { ...prev, layout: value as PassPaperLayout } : prev
                        );
                      }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {LAYOUT_OPTIONS.map((layout) => (
                          <SelectItem key={layout} value={layout}>{layout}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={draft.description}
                    onChange={(e) => setDraft((prev) => (prev ? { ...prev, description: e.target.value } : prev))}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2 rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-sm">
                  <Link2 className="size-4 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">Public path:</span>
                  <code className="break-all text-xs">
                    {buildPassPaperUrl("/pass-papers", selected.id, folders)}
                  </code>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="ml-auto"
                    onClick={() => void handleCopyPublicUrl(selected)}
                  >
                    Copy URL
                  </Button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={draft.published}
                      onCheckedChange={(published) =>
                        setDraft((prev) => (prev ? { ...prev, published } : prev))
                      }
                    />
                    <Label>Published</Label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={saving}
                      onClick={() => void handlePublishSubtree(true)}
                    >
                      Publish subtree
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={saving}
                      onClick={() => void handlePublishSubtree(false)}
                    >
                      Unpublish subtree
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={saving}
                      onClick={() => void handleDeleteFolder()}
                    >
                      <Trash2 className="mr-1 size-3.5" /> Delete folder
                    </Button>
                  </div>
                </div>
              </section>

              <section className="space-y-4 rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-semibold">Drive links</h2>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void handlePublishAllLinks(true)}
                    >
                      Publish all links
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void handlePublishAllLinks(false)}
                    >
                      Unpublish all links
                    </Button>
                  </div>
                </div>
                <PassPaperLinkForm
                  key={linkFormKey}
                  mode="add"
                  publishOnAdd={publishOnAdd}
                  onPublishOnAddChange={setPublishOnAdd}
                  onSubmit={handleAddLink}
                  submitting={linkSubmitting}
                />
                <AdminTable
                  columns={[
                    { key: "title", label: "Title" },
                    {
                      key: "driveUrl",
                      label: "Type",
                      render: (row) => (
                        <Badge variant="outline">
                          {getDriveLinkKind(row.driveUrl) === "folder" ? "Folder link" : "File"}
                        </Badge>
                      ),
                    },
                    {
                      key: "published",
                      label: "Status",
                      render: (row) => (
                        <Badge variant={row.published ? "default" : "outline"}>
                          {row.published ? "Published" : "Draft"}
                        </Badge>
                      ),
                    },
                    {
                      key: "id",
                      label: "Actions",
                      render: (row) => (
                        <div className="flex flex-wrap gap-2">
                          <a
                            href={row.driveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-icvf-navy underline"
                          >
                            Open
                          </a>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingItem(row);
                              setEditDialogOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              try {
                                await updatePassPaperItem(row.id, { published: !row.published });
                                refreshItems();
                              } catch (e) {
                                toast.error(e instanceof Error ? e.message : "Update failed");
                              }
                            }}
                          >
                            {row.published ? "Unpublish" : "Publish"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              if (!confirm(`Delete link "${row.title}"?`)) return;
                              try {
                                await deletePassPaperItem(row.id);
                                refreshItems();
                                toast.success("Link deleted");
                              } catch (e) {
                                toast.error(e instanceof Error ? e.message : "Delete failed");
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      ),
                    },
                  ]}
                  data={items}
                />
              </section>

              <section className="space-y-3 rounded-lg border border-dashed border-border p-4">
                <h2 className="font-semibold">Preview</h2>
                <PassPaperBrowser folders={previewFolders} items={allItems} publishedOnly={false} />
              </section>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Create or select a folder to manage pass papers.</p>
          )}
        </div>
      </div>

      <PassPaperBulkYearsDialog
        open={bulkYearsOpen}
        onOpenChange={setBulkYearsOpen}
        onSubmit={handleBulkYears}
        submitting={bulkYearsSubmitting}
      />

      <PassPaperLinkEditDialog
        item={editingItem}
        folders={folders}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSubmit={handleEditLink}
        submitting={linkSubmitting}
      />
    </div>
  );
}
