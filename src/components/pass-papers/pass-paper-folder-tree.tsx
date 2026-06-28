"use client";

import { useMemo, useState, useEffect } from "react";
import type { PassPaperFolder } from "@/types";
import { buildFolderTree, getFolderAncestors } from "@/lib/pass-papers-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, ChevronRight, Folder, MoreHorizontal, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type PassPaperFolderTreeProps = {
  folders: PassPaperFolder[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete?: (folder: PassPaperFolder) => void;
  onCopyPublicUrl?: (folder: PassPaperFolder) => void;
  loading?: boolean;
};

function TreeNode({
  folder,
  tree,
  depth,
  selectedId,
  onSelect,
  onDelete,
  onCopyPublicUrl,
  expandedIds,
  toggleExpanded,
}: {
  folder: PassPaperFolder;
  tree: Map<string | null, PassPaperFolder[]>;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete?: (folder: PassPaperFolder) => void;
  onCopyPublicUrl?: (folder: PassPaperFolder) => void;
  expandedIds: Set<string>;
  toggleExpanded: (id: string) => void;
}) {
  const children = tree.get(folder.id) ?? [];
  const hasChildren = children.length > 0;
  const isExpanded = expandedIds.has(folder.id);
  const isSelected = selectedId === folder.id;
  const showMenu = onDelete || onCopyPublicUrl;

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-md pr-1",
          isSelected ? "bg-muted" : "hover:bg-muted/50"
        )}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            className="flex size-7 shrink-0 items-center justify-center rounded hover:bg-muted"
            onClick={() => toggleExpanded(folder.id)}
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </button>
        ) : (
          <span className="size-7 shrink-0" />
        )}
        <button
          type="button"
          onClick={() => onSelect(folder.id)}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2 py-2 text-left text-sm",
            isSelected && "font-medium"
          )}
        >
          <Folder className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{folder.title}</span>
          {folder.published ? (
            <Badge variant="secondary" className="ml-auto shrink-0 text-[10px]">
              Live
            </Badge>
          ) : null}
        </button>
        {showMenu ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0 opacity-0 group-hover:opacity-100 data-[popup-open]:opacity-100"
                  aria-label={`Actions for ${folder.title}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onSelect(folder.id)}>Manage folder</DropdownMenuItem>
              {onCopyPublicUrl ? (
                <DropdownMenuItem onClick={() => onCopyPublicUrl(folder)}>Copy public URL</DropdownMenuItem>
              ) : null}
              {onDelete ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => onDelete(folder)}
                  >
                    <Trash2 className="size-4" />
                    Delete folder
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
      {hasChildren && isExpanded
        ? children.map((child) => (
            <TreeNode
              key={child.id}
              folder={child}
              tree={tree}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onDelete={onDelete}
              onCopyPublicUrl={onCopyPublicUrl}
              expandedIds={expandedIds}
              toggleExpanded={toggleExpanded}
            />
          ))
        : null}
    </div>
  );
}

export function PassPaperFolderTree({
  folders,
  selectedId,
  onSelect,
  onDelete,
  onCopyPublicUrl,
  loading,
}: PassPaperFolderTreeProps) {
  const tree = useMemo(() => buildFolderTree(folders), [folders]);
  const roots = tree.get(null) ?? [];

  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!selectedId) return;
    const ancestors = getFolderAncestors(selectedId, folders);
    if (ancestors.length === 0) return;
    setExpandedIds((prev) => {
      const next = new Set(prev);
      for (const folder of ancestors) {
        next.add(folder.id);
      }
      return next;
    });
  }, [selectedId, folders]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (roots.length === 0) {
    return <p className="text-sm text-muted-foreground">No folders yet.</p>;
  }

  return (
    <div className="space-y-0.5">
      {roots.map((folder) => (
        <TreeNode
          key={folder.id}
          folder={folder}
          tree={tree}
          depth={0}
          selectedId={selectedId}
          onSelect={onSelect}
          onDelete={onDelete}
          onCopyPublicUrl={onCopyPublicUrl}
          expandedIds={expandedIds}
          toggleExpanded={toggleExpanded}
        />
      ))}
    </div>
  );
}
