import type { ComponentType } from "react";
import {
  BookOpen,
  FileText,
  Folder,
  FolderOpen,
  GraduationCap,
  Layers,
} from "lucide-react";

export const PASS_PAPER_ICON_KEYS = [
  "folder",
  "folder-open",
  "book-open",
  "file-text",
  "graduation-cap",
  "layers",
] as const;

export type PassPaperIconKey = (typeof PASS_PAPER_ICON_KEYS)[number];

const ICON_MAP: Record<PassPaperIconKey, ComponentType<{ className?: string }>> = {
  folder: Folder,
  "folder-open": FolderOpen,
  "book-open": BookOpen,
  "file-text": FileText,
  "graduation-cap": GraduationCap,
  layers: Layers,
};

export function PassPaperFolderIcon({
  iconKey,
  className,
}: {
  iconKey: string;
  className?: string;
}) {
  const Icon = ICON_MAP[iconKey as PassPaperIconKey] ?? Folder;
  return <Icon className={className} />;
}
