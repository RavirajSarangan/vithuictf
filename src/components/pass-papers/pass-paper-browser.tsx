"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PassPaperFolder, PassPaperItem } from "@/types";
import {
  buildFolderTree,
  buildPassPaperUrl,
  filterVisibleFolders,
  filterVisibleItems,
  getDriveLinkKind,
  resolveFolderPathIds,
} from "@/lib/pass-papers-utils";
import { extractDriveResourceId, buildDriveDownloadUrl } from "@/lib/pass-papers/drive-id";
import { ChevronRight, Download, ExternalLink, Eye, FolderOpen } from "lucide-react";
import { PassPaperFolderIcon } from "@/lib/pass-papers/icon-map";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  PassPaperPreviewDialog,
  type PassPaperPreviewItem,
} from "@/components/pass-papers/pass-paper-preview-dialog";
import { cn } from "@/lib/utils";

function itemSubtitle(item: PassPaperItem, isFolderLink: boolean): string {
  return [
    isFolderLink ? "Open folder on Drive" : null,
    item.year,
    item.medium,
    item.examType !== "other" ? item.examType.toUpperCase() : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function PassPaperBrowser({
  folders,
  items,
  loading,
  publishedOnly = true,
  basePath,
  pathSlugs = [],
}: {
  folders: PassPaperFolder[];
  items: PassPaperItem[];
  loading?: boolean;
  publishedOnly?: boolean;
  basePath?: string;
  pathSlugs?: string[];
}) {
  const router = useRouter();
  const useUrlPaths = Boolean(basePath);
  const [previewItem, setPreviewItem] = useState<PassPaperPreviewItem | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const visibleFolders = useMemo(
    () => filterVisibleFolders(folders, publishedOnly),
    [folders, publishedOnly]
  );
  const visibleItems = useMemo(
    () => filterVisibleItems(items, folders, publishedOnly),
    [items, folders, publishedOnly]
  );

  const path = useMemo(
    () => resolveFolderPathIds(pathSlugs, visibleFolders),
    [pathSlugs, visibleFolders]
  );

  const tree = useMemo(() => buildFolderTree(visibleFolders), [visibleFolders]);

  const currentFolderId = path.length ? path[path.length - 1] : null;
  const currentFolder = visibleFolders.find((f) => f.id === currentFolderId) ?? null;
  const childFolders = tree.get(currentFolderId) ?? [];
  const folderItems = visibleItems
    .filter((item) => item.folderId === currentFolderId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));

  const layout = currentFolder?.layout ?? "folder";
  const pathMismatch =
    useUrlPaths && pathSlugs.length > 0 && path.length !== pathSlugs.length;

  const navigateToFolder = (folderId: string | null) => {
    if (!useUrlPaths || !basePath) return;
    router.push(buildPassPaperUrl(basePath, folderId, visibleFolders));
  };

  const navigateToPathIndex = (index: number) => {
    if (!useUrlPaths || !basePath) return;
    const folderId = index < 0 ? null : path[index] ?? null;
    router.push(buildPassPaperUrl(basePath, folderId, visibleFolders));
  };

  useEffect(() => {
    if (!useUrlPaths || !basePath || loading) return;
    if (pathMismatch && pathSlugs.length > 0) {
      router.replace(basePath);
    }
  }, [useUrlPaths, basePath, loading, pathMismatch, pathSlugs.length, router]);

  const openPreview = (item: PassPaperItem) => {
    const fileId = extractDriveResourceId(item.driveUrl);
    if (!fileId) return;
    setPreviewItem({
      title: item.title,
      fileId,
      subtitle: itemSubtitle(item, false),
    });
    setPreviewOpen(true);
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading pass papers…</p>;
  }

  const unpublishedCurrent =
    publishedOnly && currentFolderId && !currentFolder;

  return (
    <div className="flex flex-col gap-4">
      <nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        {useUrlPaths && basePath ? (
          <Link href={basePath} className="hover:text-foreground">
            Pass Papers
          </Link>
        ) : (
          <button type="button" className="hover:text-foreground" onClick={() => navigateToPathIndex(-1)}>
            Pass Papers
          </button>
        )}
        {path.map((folderId, index) => {
          const folder = visibleFolders.find((f) => f.id === folderId);
          if (!folder) return null;
          const href = basePath ? buildPassPaperUrl(basePath, folderId, visibleFolders) : undefined;
          return (
            <span key={folderId} className="flex items-center gap-1">
              <ChevronRight className="size-4" />
              {href ? (
                <Link href={href} className="hover:text-foreground">
                  {folder.title}
                </Link>
              ) : (
                <button
                  type="button"
                  className="hover:text-foreground"
                  onClick={() => navigateToPathIndex(index)}
                >
                  {folder.title}
                </button>
              )}
            </span>
          );
        })}
      </nav>

      {pathMismatch ? (
        <p className="text-sm text-muted-foreground">Folder not found. Showing pass papers home.</p>
      ) : null}

      {currentFolder?.description ? (
        <p className="text-sm text-muted-foreground">{currentFolder.description}</p>
      ) : null}

      {unpublishedCurrent ? (
        <p className="text-sm text-muted-foreground">
          This folder is not published yet. Check back later.
        </p>
      ) : null}

      {childFolders.length > 0 && (
        <div
          className={cn(
            layout === "list" && "flex flex-col gap-2",
            layout === "grid" && "grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
            layout === "folder" && "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          )}
        >
          {childFolders.map((folder) => {
            const href =
              useUrlPaths && basePath
                ? buildPassPaperUrl(basePath, folder.id, visibleFolders)
                : undefined;

            const content = (
              <>
                <div
                  className={cn(
                    "mb-3 flex size-10 items-center justify-center rounded-lg",
                    layout === "list" && "mb-0"
                  )}
                  style={{ backgroundColor: `${folder.accentColor}22`, color: folder.accentColor }}
                >
                  <PassPaperFolderIcon iconKey={folder.iconKey} className="size-5" />
                </div>
                <div>
                  <p className="font-medium">{folder.title}</p>
                  {folder.description ? (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{folder.description}</p>
                  ) : null}
                </div>
              </>
            );

            const className = cn(
              "rounded-xl border border-border p-4 text-left transition-colors hover:bg-muted/50",
              layout === "list" && "flex items-center gap-3"
            );

            return href ? (
              <Link
                key={folder.id}
                href={href}
                className={className}
                style={{ borderColor: `${folder.accentColor}33` }}
              >
                {content}
              </Link>
            ) : (
              <button
                key={folder.id}
                type="button"
                onClick={() => navigateToFolder(folder.id)}
                className={className}
                style={{ borderColor: `${folder.accentColor}33` }}
              >
                {content}
              </button>
            );
          })}
        </div>
      )}

      {folderItems.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Papers</h3>
          <div className="divide-y divide-border rounded-lg border border-border">
            {folderItems.map((item) => {
              const isFolderLink = getDriveLinkKind(item.driveUrl) === "folder";
              const fileId = !isFolderLink ? extractDriveResourceId(item.driveUrl) : null;
              const subtitle = itemSubtitle(item, isFolderLink);

              if (isFolderLink || !fileId) {
                return (
                  <a
                    key={item.id}
                    href={item.driveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-11 items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-muted/50"
                  >
                    <div className="flex items-start gap-3">
                      {isFolderLink ? (
                        <FolderOpen className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      ) : null}
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{subtitle}</p>
                      </div>
                    </div>
                    <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
                  </a>
                );
              }

              return (
                <div
                  key={item.id}
                  className="flex min-h-11 flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm hover:bg-muted/50 sm:flex-nowrap"
                >
                  <button
                    type="button"
                    onClick={() => openPreview(item)}
                    className="flex min-w-0 flex-1 items-start gap-3 text-left"
                  >
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{subtitle}</p>
                    </div>
                  </button>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 px-2"
                      onClick={() => openPreview(item)}
                    >
                      <Eye className="size-3.5" />
                      <span className="hidden sm:inline">Preview</span>
                    </Button>
                    <a
                      href={buildDriveDownloadUrl(fileId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8 gap-1 px-2")}
                    >
                      <Download className="size-3.5" />
                      <span className="hidden sm:inline">Download</span>
                    </a>
                    <a
                      href={item.driveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open in Google Drive"
                      className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "size-8")}
                    >
                      <ExternalLink className="size-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!unpublishedCurrent && !pathMismatch && childFolders.length === 0 && folderItems.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {currentFolder
            ? "No pass papers in this folder yet."
            : "No published pass paper folders yet."}
        </p>
      )}

      <PassPaperPreviewDialog
        item={previewItem}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}
