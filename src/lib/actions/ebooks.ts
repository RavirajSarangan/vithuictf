"use server";

import { safeRevalidatePath as revalidatePath } from "@/lib/safe-revalidate";
import { requireStaff, getSessionProfile } from "@/lib/actions/auth";
import { actionFailure } from "@/lib/actions/action-result";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/audit";
import { createClient } from "@/lib/supabase/server";
import { mapEbook } from "@/lib/supabase/mappers";
import type { Ebook } from "@/types";

const ADMIN_HOME_PATH = "/admin/home";

function revalidateEbookPaths() {
  revalidatePath(ADMIN_HOME_PATH);
  revalidatePath("/");
}

export async function listAdminEbooks(): Promise<Ebook[]> {
  try {
    await requireStaff();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("ebooks")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) return [];
    return (data ?? []).map(mapEbook);
  } catch {
    return [];
  }
}

export async function createEbook(input: {
  title: string;
  subtitle?: string;
  coverImageUrl?: string;
  badgeLabel?: string;
  footerLabel?: string;
  accentColor?: string;
  previewUrl?: string;
  driveLink?: string;
  published?: boolean;
}) {
  try {
    await requireStaff();
    const title = input.title.trim();
    if (!title) return actionFailure(new Error("Title required"), "Title is required");

    const profile = await getSessionProfile();
    const supabase = await createClient();

    const { data: maxRow } = await supabase
      .from("ebooks")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextSortOrder = (maxRow?.sort_order ?? -1) + 1;

    const { data, error } = await supabase
      .from("ebooks")
      .insert({
        title,
        subtitle: input.subtitle?.trim() ?? "",
        cover_image_url: input.coverImageUrl?.trim() ?? "",
        badge_label: input.badgeLabel?.trim() || "DOWNLOAD",
        footer_label: input.footerLabel?.trim() || "E-BOOK",
        accent_color: input.accentColor?.trim() || "#F5A623",
        preview_url: input.previewUrl?.trim() || null,
        drive_link: input.driveLink?.trim() || null,
        published: input.published ?? true,
        sort_order: nextSortOrder,
        created_by: profile?.id ?? null,
      })
      .select("*")
      .single();

    if (error || !data) return actionFailure(error, "Failed to create e-book");

    await logAdminAction("ebook.create", "ebook", data.id, { title });
    revalidateEbookPaths();
    return { ok: true as const, ebook: mapEbook(data) };
  } catch (error) {
    return actionFailure(error, "Failed to create e-book");
  }
}

export async function updateEbook(
  id: string,
  patch: {
    title?: string;
    subtitle?: string;
    coverImageUrl?: string;
    badgeLabel?: string;
    footerLabel?: string;
    accentColor?: string;
    previewUrl?: string | null;
    driveLink?: string | null;
    published?: boolean;
    sortOrder?: number;
  }
) {
  try {
    await requireStaff();
    const supabase = await createClient();

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (patch.title !== undefined) updates.title = patch.title.trim();
    if (patch.subtitle !== undefined) updates.subtitle = patch.subtitle.trim();
    if (patch.coverImageUrl !== undefined) updates.cover_image_url = patch.coverImageUrl.trim();
    if (patch.badgeLabel !== undefined) updates.badge_label = patch.badgeLabel.trim() || "DOWNLOAD";
    if (patch.footerLabel !== undefined) updates.footer_label = patch.footerLabel.trim() || "E-BOOK";
    if (patch.accentColor !== undefined) updates.accent_color = patch.accentColor.trim() || "#F5A623";
    if (patch.previewUrl !== undefined) updates.preview_url = patch.previewUrl?.trim() || null;
    if (patch.driveLink !== undefined) updates.drive_link = patch.driveLink?.trim() || null;
    if (patch.published !== undefined) updates.published = patch.published;
    if (patch.sortOrder !== undefined) updates.sort_order = patch.sortOrder;

    const { error } = await supabase.from("ebooks").update(updates).eq("id", id);
    if (error) return actionFailure(error, "Failed to update e-book");

    await logAdminAction("ebook.update", "ebook", id, updates);
    revalidateEbookPaths();
    return { ok: true as const };
  } catch (error) {
    return actionFailure(error, "Failed to update e-book");
  }
}

export async function deleteEbook(id: string) {
  try {
    await requireStaff();
    const supabase = await createClient();
    const { error } = await supabase.from("ebooks").delete().eq("id", id);
    if (error) return actionFailure(error, "Failed to delete e-book");

    await logAdminAction("ebook.delete", "ebook", id);
    revalidateEbookPaths();
    return { ok: true as const };
  } catch (error) {
    return actionFailure(error, "Failed to delete e-book");
  }
}

/** Public — fired from the homepage Download button. No auth: anon visitors have no session. */
export async function incrementEbookDownload(id: string): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("ebooks").select("download_count").eq("id", id).maybeSingle();
    if (!data) return;
    await admin
      .from("ebooks")
      .update({ download_count: data.download_count + 1 })
      .eq("id", id);
  } catch {
    // Best-effort counter — never block the visitor's download.
  }
}
