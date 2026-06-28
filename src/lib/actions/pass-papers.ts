"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/actions/auth";
import { isAllowedDriveHost, isFolderDescendant, getFolderDescendantIds } from "@/lib/pass-papers-utils";
import type { PassPaperExamType, PassPaperLayout, PassPaperMedium } from "@/types";
import { mapPassPaperFolder } from "@/lib/supabase/mappers";
import type { PassPaperFolder } from "@/types";

function revalidatePassPaperPaths() {
  revalidatePath("/pass-papers");
  revalidatePath("/parent/pass-papers");
  revalidatePath("/admin/pass-papers");
}

function validateDriveUrl(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    throw new Error("Invalid drive URL");
  }
  if (parsed.protocol !== "https:") {
    throw new Error("Drive URL must use HTTPS");
  }
  if (!isAllowedDriveHost(parsed.hostname)) {
    throw new Error("Only Google Drive or Google Docs links are allowed");
  }
  return parsed.toString();
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 64) || "folder";
}

async function loadAllFolders(supabase: Awaited<ReturnType<typeof createClient>>): Promise<PassPaperFolder[]> {
  const { data, error } = await supabase
    .from("pass_paper_folders")
    .select("*")
    .order("sort_order")
    .order("title");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapPassPaperFolder(row));
}

async function assertValidParentMove(
  supabase: Awaited<ReturnType<typeof createClient>>,
  folderId: string,
  newParentId: string | null
) {
  if (newParentId === null) return;
  if (newParentId === folderId) {
    throw new Error("A folder cannot be its own parent");
  }
  const folders = await loadAllFolders(supabase);
  if (isFolderDescendant(folders, folderId, newParentId)) {
    throw new Error("Cannot move a folder into its own descendant");
  }
}

export async function createPassPaperFolder(data: {
  parentId?: string | null;
  title: string;
  description?: string;
  iconKey?: string;
  accentColor?: string;
  layout?: PassPaperLayout;
  sortOrder?: number;
  published?: boolean;
}) {
  await requireSuperAdmin();
  if (!data.title.trim()) throw new Error("Folder title is required");

  const supabase = await createClient();
  const slug = slugify(data.title);

  const { data: row, error } = await supabase
    .from("pass_paper_folders")
    .insert({
      parent_id: data.parentId ?? null,
      title: data.title.trim(),
      slug,
      description: data.description?.trim() ?? "",
      icon_key: data.iconKey ?? "folder",
      accent_color: data.accentColor ?? "#1e3a5f",
      layout: data.layout ?? "folder",
      sort_order: data.sortOrder ?? 0,
      published: data.published ?? false,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  revalidatePassPaperPaths();
  return { id: row.id };
}

export async function updatePassPaperFolder(
  id: string,
  data: {
    title?: string;
    description?: string;
    iconKey?: string;
    accentColor?: string;
    layout?: PassPaperLayout;
    sortOrder?: number;
    published?: boolean;
    parentId?: string | null;
  }
) {
  await requireSuperAdmin();
  const supabase = await createClient();

  if (data.parentId !== undefined) {
    await assertValidParentMove(supabase, id, data.parentId);
  }

  const updates: Record<string, unknown> = {};
  if (data.title !== undefined) {
    updates.title = data.title.trim();
    updates.slug = slugify(data.title);
  }
  if (data.description !== undefined) updates.description = data.description.trim();
  if (data.iconKey !== undefined) updates.icon_key = data.iconKey;
  if (data.accentColor !== undefined) updates.accent_color = data.accentColor;
  if (data.layout !== undefined) updates.layout = data.layout;
  if (data.sortOrder !== undefined) updates.sort_order = data.sortOrder;
  if (data.published !== undefined) updates.published = data.published;
  if (data.parentId !== undefined) updates.parent_id = data.parentId;

  const { error } = await supabase.from("pass_paper_folders").update(updates).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePassPaperPaths();
}

export async function deletePassPaperFolder(id: string) {
  await requireSuperAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("pass_paper_folders").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePassPaperPaths();
}

export async function bulkCreatePassPaperYearFolders(
  parentId: string,
  startYear: number,
  endYear: number
) {
  await requireSuperAdmin();
  if (!parentId) throw new Error("Parent folder is required");
  if (startYear > endYear) throw new Error("Start year must be less than or equal to end year");
  if (startYear < 1900 || endYear > 2100) throw new Error("Year must be between 1900 and 2100");

  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase
    .from("pass_paper_folders")
    .select("slug")
    .eq("parent_id", parentId);

  if (existingError) throw new Error(existingError.message);

  const existingSlugs = new Set((existing ?? []).map((row) => row.slug));
  let created = 0;

  for (let year = startYear; year <= endYear; year++) {
    const slug = String(year);
    if (existingSlugs.has(slug)) continue;

    const { error } = await supabase.from("pass_paper_folders").insert({
      parent_id: parentId,
      title: slug,
      slug,
      description: "",
      icon_key: "folder",
      accent_color: "#1e3a5f",
      layout: "folder",
      sort_order: year,
      published: false,
    });

    if (error) throw new Error(error.message);
    created += 1;
  }

  revalidatePassPaperPaths();
  return { created };
}

export async function publishPassPaperFolderWithDescendants(
  folderId: string,
  published: boolean
) {
  await requireSuperAdmin();
  const supabase = await createClient();
  const folders = await loadAllFolders(supabase);
  const descendantIds = getFolderDescendantIds(folders, folderId);
  const ids = [folderId, ...descendantIds];

  const { error } = await supabase
    .from("pass_paper_folders")
    .update({ published })
    .in("id", ids);

  if (error) throw new Error(error.message);
  revalidatePassPaperPaths();
  return { updated: ids.length };
}

export async function publishPassPaperItemsInFolder(folderId: string, published: boolean) {
  await requireSuperAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("pass_paper_items")
    .update({ published })
    .eq("folder_id", folderId);

  if (error) throw new Error(error.message);
  revalidatePassPaperPaths();
}

export async function createPassPaperItem(data: {
  folderId: string;
  title: string;
  driveUrl: string;
  year?: number;
  medium?: PassPaperMedium;
  examType?: PassPaperExamType;
  sortOrder?: number;
  published?: boolean;
}) {
  await requireSuperAdmin();
  if (!data.title.trim()) throw new Error("Title is required");

  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("pass_paper_items")
    .insert({
      folder_id: data.folderId,
      title: data.title.trim(),
      drive_url: validateDriveUrl(data.driveUrl),
      year: data.year ?? null,
      medium: data.medium ?? null,
      exam_type: data.examType ?? "other",
      sort_order: data.sortOrder ?? 0,
      published: data.published ?? false,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  revalidatePassPaperPaths();
  return { id: row.id };
}

export async function updatePassPaperItem(
  id: string,
  data: {
    folderId?: string;
    title?: string;
    driveUrl?: string;
    year?: number | null;
    medium?: PassPaperMedium | null;
    examType?: PassPaperExamType;
    sortOrder?: number;
    published?: boolean;
  }
) {
  await requireSuperAdmin();
  const supabase = await createClient();
  const updates: Record<string, unknown> = {};
  if (data.folderId !== undefined) updates.folder_id = data.folderId;
  if (data.title !== undefined) updates.title = data.title.trim();
  if (data.driveUrl !== undefined) updates.drive_url = validateDriveUrl(data.driveUrl);
  if (data.year !== undefined) updates.year = data.year;
  if (data.medium !== undefined) updates.medium = data.medium;
  if (data.examType !== undefined) updates.exam_type = data.examType;
  if (data.sortOrder !== undefined) updates.sort_order = data.sortOrder;
  if (data.published !== undefined) updates.published = data.published;

  const { error } = await supabase.from("pass_paper_items").update(updates).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePassPaperPaths();
}

export async function deletePassPaperItem(id: string) {
  await requireSuperAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("pass_paper_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePassPaperPaths();
}
