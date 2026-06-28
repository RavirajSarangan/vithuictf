import type { PassPaperFolder, PassPaperItem } from "@/types";

export type DriveLinkKind = "file" | "folder";

const ALLOWED_DRIVE_HOSTS = new Set(["drive.google.com", "docs.google.com"]);

export function normalizeDriveHostname(hostname: string): string {
  return hostname.replace(/^www\./, "");
}

export function isAllowedDriveHost(hostname: string): boolean {
  return ALLOWED_DRIVE_HOSTS.has(normalizeDriveHostname(hostname));
}

export function getDriveLinkKind(url: string): DriveLinkKind {
  try {
    const parsed = new URL(url.trim());
    const path = parsed.pathname.toLowerCase();
    if (path.includes("/drive/folders/") || path.includes("/folders/")) {
      return "folder";
    }
    if (path.includes("/folderview")) {
      return "folder";
    }
    return "file";
  } catch {
    return "file";
  }
}

export function buildFolderMap(folders: PassPaperFolder[]): Map<string, PassPaperFolder> {
  return new Map(folders.map((folder) => [folder.id, folder]));
}

export function isFolderPublishedWithAncestors(
  folder: PassPaperFolder,
  folderMap: Map<string, PassPaperFolder>
): boolean {
  if (!folder.published) return false;
  let parentId = folder.parentId;
  while (parentId) {
    const parent = folderMap.get(parentId);
    if (!parent || !parent.published) return false;
    parentId = parent.parentId;
  }
  return true;
}

export function filterVisibleFolders(
  folders: PassPaperFolder[],
  publishedOnly: boolean
): PassPaperFolder[] {
  if (!publishedOnly) return folders;
  const folderMap = buildFolderMap(folders);
  return folders.filter((folder) => isFolderPublishedWithAncestors(folder, folderMap));
}

export function filterVisibleItems(
  items: PassPaperItem[],
  folders: PassPaperFolder[],
  publishedOnly: boolean
): PassPaperItem[] {
  if (!publishedOnly) return items;
  const folderMap = buildFolderMap(folders);
  return items.filter((item) => {
    if (!item.published) return false;
    const folder = folderMap.get(item.folderId);
    if (!folder) return false;
    return isFolderPublishedWithAncestors(folder, folderMap);
  });
}

export function getFolderAncestors(
  folderId: string,
  folders: PassPaperFolder[]
): PassPaperFolder[] {
  const folderMap = buildFolderMap(folders);
  const ancestors: PassPaperFolder[] = [];
  let current = folderMap.get(folderId);
  while (current?.parentId) {
    const parent = folderMap.get(current.parentId);
    if (!parent) break;
    ancestors.unshift(parent);
    current = parent;
  }
  return ancestors;
}

export function buildFolderTree(folders: PassPaperFolder[]) {
  const byParent = new Map<string | null, PassPaperFolder[]>();
  for (const folder of folders) {
    const key = folder.parentId;
    const list = byParent.get(key) ?? [];
    list.push(folder);
    byParent.set(key, list);
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
  }
  return byParent;
}

export function isFolderDescendant(
  folders: PassPaperFolder[],
  ancestorId: string,
  candidateId: string
): boolean {
  if (ancestorId === candidateId) return true;
  const tree = buildFolderTree(folders);
  const stack = [ancestorId];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    const children = tree.get(current) ?? [];
    for (const child of children) {
      if (child.id === candidateId) return true;
      stack.push(child.id);
    }
  }
  return false;
}

export function getFolderDescendantIds(
  folders: PassPaperFolder[],
  folderId: string
): string[] {
  const tree = buildFolderTree(folders);
  const ids: string[] = [];
  const stack = [folderId];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    const children = tree.get(current) ?? [];
    for (const child of children) {
      ids.push(child.id);
      stack.push(child.id);
    }
  }
  return ids;
}

export function getFolderSlugPath(folderId: string, folders: PassPaperFolder[]): string[] {
  const folder = folders.find((f) => f.id === folderId);
  if (!folder) return [];
  const ancestors = getFolderAncestors(folderId, folders);
  return [...ancestors.map((f) => f.slug), folder.slug];
}

export function buildPassPaperUrl(
  basePath: string,
  folderId: string | null,
  folders: PassPaperFolder[]
): string {
  if (!folderId) return basePath;
  const slugs = getFolderSlugPath(folderId, folders);
  return slugs.length > 0 ? `${basePath}/${slugs.join("/")}` : basePath;
}

export function resolveFolderIdFromSlugPath(
  slugs: string[],
  folders: PassPaperFolder[]
): string | null {
  if (slugs.length === 0) return null;
  let parentId: string | null = null;
  for (const slug of slugs) {
    const match = folders.find((f) => f.parentId === parentId && f.slug === slug);
    if (!match) return null;
    parentId = match.id;
  }
  return parentId;
}

export function resolveFolderPathIds(
  slugs: string[],
  folders: PassPaperFolder[]
): string[] {
  const ids: string[] = [];
  let parentId: string | null = null;
  for (const slug of slugs) {
    const match = folders.find((f) => f.parentId === parentId && f.slug === slug);
    if (!match) break;
    ids.push(match.id);
    parentId = match.id;
  }
  return ids;
}
