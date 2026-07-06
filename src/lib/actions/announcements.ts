"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import { getSessionProfile, requireAcademicsStaff } from "@/lib/actions/auth";
import { actionFailure, type ActionResult, type DataActionResult } from "@/lib/actions/action-result";
import { safeRevalidatePath } from "@/lib/safe-revalidate";
import { notifyBatchesStudentsPortal } from "@/lib/academics/batch-notifications";
import { mapAnnouncementReply, mapPortalAnnouncement } from "@/lib/supabase/mappers";
import type { AnnouncementReply, PortalAnnouncement } from "@/types";

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([
  "pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt",
  "png", "jpg", "jpeg", "webp", "zip",
]);

function revalidateAnnouncementPaths() {
  safeRevalidatePath("/academics/announcements");
  safeRevalidatePath("/announcements");
  safeRevalidatePath("/dashboard");
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);
}

function validateUpload(file: File): string | null {
  if (file.size <= 0) return "The selected file is empty";
  if (file.size > MAX_FILE_BYTES) return "File must be 20 MB or smaller";
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.has(ext)) return `File type .${ext || "?"} is not supported`;
  return null;
}

async function uploadToBucket(path: string, file: File): Promise<string> {
  if (!isAdminClientConfigured()) throw new Error("File storage is not configured");
  const admin = createAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage.from("announcements").upload(path, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return path;
}

const ANNOUNCEMENT_SELECT =
  "*, profiles:created_by(display_name), announcement_batches(batch_id, course_batches(name))";

export async function getStaffAnnouncements(): Promise<PortalAnnouncement[]> {
  await requireAcademicsStaff();
  return listAnnouncements();
}

/** Shared by staff and student pages — RLS scopes rows per caller. */
async function listAnnouncements(): Promise<PortalAnnouncement[]> {
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("announcements")
    .select(ANNOUNCEMENT_SELECT)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const announcements = (rows ?? []).map(mapPortalAnnouncement);
  if (!announcements.length) return announcements;

  const { data: replyRows } = await supabase
    .from("announcement_replies")
    .select("announcement_id")
    .in("announcement_id", announcements.map((a) => a.id));

  const counts = new Map<string, number>();
  for (const row of replyRows ?? []) {
    counts.set(row.announcement_id, (counts.get(row.announcement_id) ?? 0) + 1);
  }

  return announcements.map((a) => ({ ...a, replyCount: counts.get(a.id) ?? 0 }));
}

export async function getVisibleAnnouncements(): Promise<PortalAnnouncement[]> {
  const profile = await getSessionProfile();
  if (!profile) throw new Error("Not signed in");
  return listAnnouncements();
}

export async function getAnnouncementThread(announcementId: string): Promise<{
  announcement: PortalAnnouncement;
  replies: AnnouncementReply[];
}> {
  const profile = await getSessionProfile();
  if (!profile) throw new Error("Not signed in");
  const supabase = await createClient();

  const { data: row, error } = await supabase
    .from("announcements")
    .select(ANNOUNCEMENT_SELECT)
    .eq("id", announcementId)
    .single();
  if (error || !row) throw new Error(error?.message ?? "Announcement not found");

  const { data: replyRows } = await supabase
    .from("announcement_replies")
    .select("*, profiles:author_id(display_name, role)")
    .eq("announcement_id", announcementId)
    .order("created_at", { ascending: true });

  return {
    announcement: mapPortalAnnouncement(row),
    replies: (replyRows ?? []).map(mapAnnouncementReply),
  };
}

export async function createAnnouncement(formData: FormData): Promise<ActionResult> {
  try {
    const profile = await requireAcademicsStaff();
    const supabase = await createClient();

    const batchIds = formData.getAll("batchIds").map(String).filter(Boolean);
    const title = String(formData.get("title") ?? "").trim();
    const body = String(formData.get("body") ?? "").trim();
    const pinned = formData.get("pinned") === "true";
    const file = formData.get("file");

    if (!batchIds.length) return { ok: false, error: "Select at least one batch" };
    if (title.length < 3) return { ok: false, error: "Title must be at least 3 characters" };
    if (!body) return { ok: false, error: "Write the announcement body" };

    let attachmentPath: string | null = null;
    let attachmentName: string | null = null;
    if (file instanceof File && file.size > 0) {
      const invalid = validateUpload(file);
      if (invalid) return { ok: false, error: invalid };
      attachmentName = file.name;
      attachmentPath = await uploadToBucket(
        `${profile.id}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`,
        file
      );
    }

    const { data: created, error } = await supabase
      .from("announcements")
      .insert({
        title,
        body,
        attachment_path: attachmentPath,
        attachment_name: attachmentName,
        pinned,
        created_by: profile.id,
      })
      .select("id")
      .single();
    if (error || !created) return actionFailure(error, "Failed to post announcement");

    const { error: linkError } = await supabase
      .from("announcement_batches")
      .insert(batchIds.map((batchId) => ({ announcement_id: created.id, batch_id: batchId })));
    if (linkError) {
      await supabase.from("announcements").delete().eq("id", created.id);
      return actionFailure(linkError, "Failed to link announcement to batches");
    }

    const excerpt = body.length > 140 ? `${body.slice(0, 137)}…` : body;
    await notifyBatchesStudentsPortal(
      batchIds,
      `Announcement — ${title}`,
      excerpt,
      { kind: "announcement_new", announcementId: created.id },
      "announcement"
    );

    revalidateAnnouncementPaths();
    return { ok: true };
  } catch (error) {
    return actionFailure(error, "Failed to post announcement");
  }
}

export async function setAnnouncementPinned(
  announcementId: string,
  pinned: boolean
): Promise<ActionResult> {
  try {
    await requireAcademicsStaff();
    const supabase = await createClient();

    const { error } = await supabase
      .from("announcements")
      .update({ pinned, updated_at: new Date().toISOString() })
      .eq("id", announcementId);
    if (error) return actionFailure(error, "Failed to update announcement");

    revalidateAnnouncementPaths();
    return { ok: true };
  } catch (error) {
    return actionFailure(error, "Failed to update announcement");
  }
}

export async function deleteAnnouncement(announcementId: string): Promise<ActionResult> {
  try {
    await requireAcademicsStaff();
    const supabase = await createClient();

    const { data: row } = await supabase
      .from("announcements")
      .select("attachment_path")
      .eq("id", announcementId)
      .maybeSingle();

    const { error } = await supabase.from("announcements").delete().eq("id", announcementId);
    if (error) return actionFailure(error, "Failed to delete announcement");

    if (row?.attachment_path && isAdminClientConfigured()) {
      await createAdminClient().storage.from("announcements").remove([row.attachment_path]);
    }

    revalidateAnnouncementPaths();
    return { ok: true };
  } catch (error) {
    return actionFailure(error, "Failed to delete announcement");
  }
}

export async function addAnnouncementReply(
  announcementId: string,
  body: string
): Promise<ActionResult> {
  try {
    const profile = await getSessionProfile();
    if (!profile) return { ok: false, error: "Not signed in" };

    const trimmed = body.trim();
    if (!trimmed) return { ok: false, error: "Write a reply first" };
    if (trimmed.length > 2000) return { ok: false, error: "Replies are limited to 2000 characters" };

    const supabase = await createClient();

    // RLS returns the announcement only if the caller may view it.
    const { data: announcement } = await supabase
      .from("announcements")
      .select("id, title, created_by")
      .eq("id", announcementId)
      .maybeSingle();
    if (!announcement) return { ok: false, error: "Announcement not found" };

    const { error } = await supabase.from("announcement_replies").insert({
      announcement_id: announcementId,
      author_id: profile.id,
      body: trimmed,
    });
    if (error) return actionFailure(error, "Failed to post reply");

    // Notify the counterpart: replies from participants alert the author;
    // the author's replies alert the other participants in the thread.
    const notifyClient = isAdminClientConfigured() ? createAdminClient() : supabase;
    const recipients = new Set<string>();
    if (profile.id !== announcement.created_by && announcement.created_by) {
      recipients.add(announcement.created_by);
    } else {
      const { data: participantRows } = await supabase
        .from("announcement_replies")
        .select("author_id")
        .eq("announcement_id", announcementId);
      for (const row of participantRows ?? []) {
        if (row.author_id !== profile.id) recipients.add(row.author_id);
      }
    }
    if (recipients.size) {
      await notifyClient.from("notifications").insert(
        [...recipients].map((userId) => ({
          user_id: userId,
          title: `New reply — ${announcement.title}`,
          body: trimmed.length > 140 ? `${trimmed.slice(0, 137)}…` : trimmed,
          type: "announcement" as const,
          metadata: { kind: "announcement_reply", announcementId },
        }))
      );
    }

    revalidateAnnouncementPaths();
    return { ok: true };
  } catch (error) {
    return actionFailure(error, "Failed to post reply");
  }
}

export async function deleteAnnouncementReply(replyId: string): Promise<ActionResult> {
  try {
    const profile = await getSessionProfile();
    if (!profile) return { ok: false, error: "Not signed in" };
    const supabase = await createClient();

    // RLS limits deletion to the reply author, the announcement author, or admins.
    const { error } = await supabase.from("announcement_replies").delete().eq("id", replyId);
    if (error) return actionFailure(error, "Failed to delete reply");

    revalidateAnnouncementPaths();
    return { ok: true };
  } catch (error) {
    return actionFailure(error, "Failed to delete reply");
  }
}

export async function getAnnouncementAttachmentUrl(
  announcementId: string
): Promise<DataActionResult<{ url: string }>> {
  try {
    const profile = await getSessionProfile();
    if (!profile) return { ok: false, error: "Not signed in" };
    const supabase = await createClient();

    // Visibility check through RLS before minting a signed URL.
    const { data: announcement } = await supabase
      .from("announcements")
      .select("attachment_path")
      .eq("id", announcementId)
      .maybeSingle();
    if (!announcement?.attachment_path) return { ok: false, error: "No attachment found" };
    if (!isAdminClientConfigured()) return { ok: false, error: "File storage is not configured" };

    const { data, error } = await createAdminClient()
      .storage.from("announcements")
      .createSignedUrl(announcement.attachment_path, 60 * 10);
    if (error || !data?.signedUrl) return actionFailure(error, "Failed to open attachment");

    return { ok: true, data: { url: data.signedUrl } };
  } catch (error) {
    return actionFailure(error, "Failed to open attachment");
  }
}
