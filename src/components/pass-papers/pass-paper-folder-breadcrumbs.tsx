"use client";

import type { PassPaperFolder } from "@/types";
import { getFolderAncestors } from "@/lib/pass-papers-utils";
import { ChevronRight } from "lucide-react";

type PassPaperFolderBreadcrumbsProps = {
  folders: PassPaperFolder[];
  selected: PassPaperFolder | null;
  onSelect: (id: string | null) => void;
};

export function PassPaperFolderBreadcrumbs({
  folders,
  selected,
  onSelect,
}: PassPaperFolderBreadcrumbsProps) {
  if (!selected) return null;

  const ancestors = getFolderAncestors(selected.id, folders);
  const trail = [...ancestors, selected];

  return (
    <nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
      <button type="button" className="hover:text-foreground" onClick={() => onSelect(null)}>
        All folders
      </button>
      {trail.map((folder, index) => (
        <span key={folder.id} className="flex items-center gap-1">
          <ChevronRight className="size-4" />
          <button
            type="button"
            className="hover:text-foreground"
            onClick={() => onSelect(folder.id)}
          >
            {folder.title}
          </button>
          {index === trail.length - 1 ? null : null}
        </span>
      ))}
    </nav>
  );
}
