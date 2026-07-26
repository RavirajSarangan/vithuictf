"use server";

// Faculty portal clone of src/lib/actions/announcements.ts. Every query
// targets the faculty_* tables (faculty_announcements,
// faculty_announcement_batches, faculty_announcement_replies) instead of
// their teacher-side equivalents, and every staff gate is
// requireFacultyStaff()/requireFacultyFeatureAccess() instead of
// requireAcademicsStaff()/requireFeatureAccess(). RLS (faculty_staff_can_access_announcement/
// faculty_user_can_view_announcement/faculty_is_announcement_author, see
// 20260726097000_faculty_announcements.sql) does the actual visibility
// scoping; these actions just need to target the right tables.
//
// The upload/validation helpers (sanitizeFileName/validateUpload/
// uploadToBucket/ALLOWED_EXTENSIONS) are private to the original file, so
// they're duplicated here rather than imported — matching the existing
// minor-duplication pattern already used between the teacher and faculty
// academics action files. Attachments are written to the same shared
// "announcements" storage bucket (no new bucket — see the migration), just
// under a "faculty/" path prefix so faculty uploads never collide with
// teacher-side ones.
//
// mapPortalAnnouncement/mapAnnouncementReply (src/lib/supabase/mappers.ts)
// are typed against the teacher-side announcements/announcement_replies Row
// shapes (their announcement_batches join expects a `course_batches` key),
// so they can't be reused as-is against faculty_announcement_batches's
// `faculty_batches` join key — local mapping functions are used instead.

import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import { getSessionProfile, requireFacultyStaff, requireFacultyFeatureAccess } from "@/lib/actions/auth";
import { actionFailure, type ActionResult, type DataActionResult } from "@/lib/actions/action-result";
import { safeRevalidatePath } from "@/lib/safe-revalidate";
import type { AnnouncementReply, PortalAnnouncement, UserRole } from "@/types";

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([
  "pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt",
  "png", "jpg", "jpeg", "webp", "zip",
]);

function revalidateFacultyAnnouncementPaths() {
  safeRevalidatePath("/faculty/announcements");
  safeRevalidatePath("/faculty/dashboard");
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

type FacultyAnnouncementRow = {
  id: string;
  title: string;
  body: string;
  attachment_path: string | null;
  attachment_name: string | null;
  pinned: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  profiles?: { display_name: string } | { display_name: string }[] | null;
  faculty_announcement_batches?:
    | { batch_id: string; faculty_batches?: { name: string } | { name: string }[] | null }[]
    | null;
};

function mapFacultyAnnouncement(row: FacultyAnnouncementRow): PortalAnnouncement {
  const profileRaw = row.profiles;
  const profile = Array.isArray(profileRaw) ? profileRaw[0] : profileRaw;
  const links = row.faculty_announcement_batches ?? [];

  return {
    id: row.id,
    title: row.title,
    body: row.body,
    attachmentPath: row.attachment_path,
    attachmentName: row.attachment_name,
    pinned: row.pinned,
    createdBy: row.created_by,
    authorName: profile?.display_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    batchIds: links.map((l) => l.batch_id),
    batchNames: links
      .map((l) => {
        const batchRaw = l.faculty_batches;
        const batch = Array.isArray(batchRaw) ? batchRaw[0] : batchRaw;
        return batch?.name;
      })
      .filter((name): name is string => Boolean(name)),
  };
}

type FacultyAnnouncementReplyRow = {
  id: string;
  announcement_id: string;
  author_id: string;
  body: string;
  created_at: string;
  profiles?: { display_name: string; role: UserRole } | { display_name: string; role: UserRole }[] | null;
};

function mapFacultyAnnouncementReply(row: FacultyAnnouncementReplyRow): AnnouncementReply {
  const profileRaw = row.profiles;
  const profile = Array.isArray(profileRaw) ? profileRaw[0] : profileRaw;

  return {
    id: row.id,
    announcementId: row.announcement_id,
    authorId: row.author_id,
    authorName: profile?.display_name,
    authorRole: profile?.role,
    body: row.body,
    createdAt: row.created_at,
  };
}

const FACULTY_ANNOUNCEMENT_SELECT =
  "*, profiles:created_by(display_name), faculty_announcement_batches(batch_id, faculty_batches(name))";

export async function getFacultyStaffAnnouncements(): Promise<PortalAnnouncement[]> {
  await requireFacultyStaff();
  return listFacultyAnnouncements();
}

/** Shared by staff and student/parent pages — RLS scopes rows per caller. */
async function listFacultyAnnouncements(): Promise<PortalAnnouncement[]> {
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("faculty_announcements")
    .select(FACULTY_ANNOUNCEMENT_SELECT)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const announcements = (rows ?? []).map((row) => mapFacultyAnnouncement(row as FacultyAnnouncementRow));
  if (!announcements.length) return announcements;

  const { data: replyRows } = await supabase
    .from("faculty_announcement_replies")
    .select("announcement_id")
    .in("announcement_id", announcements.map((a) => a.id));

  const counts = new Map<string, number>();
  for (const row of replyRows ?? []) {
    counts.set(row.announcement_id, (counts.get(row.announcement_id) ?? 0) + 1);
  }

  return announcements.map((a) => ({ ...a, replyCount: counts.get(a.id) ?? 0 }));
}

export async function getFacultyVisibleAnnouncements(): Promise<PortalAnnouncement[]> {
  const profile = await getSessionProfile();
  if (!profile) throw new Error("Not signed in");
  return listFacultyAnnouncements();
}

export async function getFacultyAnnouncementThread(announcementId: string): Promise<{
  announcement: PortalAnnouncement;
  replies: AnnouncementReply[];
}> {
  const profile = await getSessionProfile();
  if (!profile) throw new Error("Not signed in");
  const supabase = await createClient();

  const { data: row, error } = await supabase
    .from("faculty_announcements")
    .select(FACULTY_ANNOUNCEMENT_SELECT)
    .eq("id", announcementId)
    .single();
  if (error || !row) throw new Error(error?.message ?? "Announcement not found");

  const { data: replyRows } = await supabase
    .from("faculty_announcement_replies")
    .select("*, profiles:author_id(display_name, role)")
    .eq("announcement_id", announcementId)
    .order("created_at", { ascending: true });

  return {
    announcement: mapFacultyAnnouncement(row as FacultyAnnouncementRow),
    replies: (replyRows ?? []).map((r) => mapFacultyAnnouncementReply(r as FacultyAnnouncementReplyRow)),
  };
}

export async function createFacultyAnnouncement(formData: FormData): Promise<ActionResult> {
  try {
    const profile = await requireFacultyFeatureAccess("announcements_report_cards");
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
        `faculty/${profile.id}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`,
        file
      );
    }

    const { data: created, error } = await supabase
      .from("faculty_announcements")
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
      .from("faculty_announcement_batches")
      .insert(batchIds.map((batchId) => ({ announcement_id: created.id, batch_id: batchId })));
    if (linkError) {
      await supabase.from("faculty_announcements").delete().eq("id", created.id);
      return actionFailure(linkError, "Failed to link announcement to batches");
    }

    await notifyFacultyAnnouncementBatches(supabase, batchIds, title, body, created.id);

    revalidateFacultyAnnouncementPaths();
    return { ok: true };
  } catch (error) {
    return actionFailure(error, "Failed to post announcement");
  }
}

// Faculty batches don't share the teacher-side batch_enrollments table, so
// notifyBatchesStudentsPortal (src/lib/academics/batch-notifications.ts)
// can't be reused directly — this mirrors its dedupe-across-batches logic
// against faculty_batch_enrollments instead.
async function notifyFacultyAnnouncementBatches(
  supabase: Awaited<ReturnType<typeof createClient>>,
  batchIds: string[],
  title: string,
  body: string,
  announcementId: string
): Promise<void> {
  const { data: enrollments } = await supabase
    .from("faculty_batch_enrollments")
    .select("student_id, batch_id, students(user_id)")
    .in("batch_id", batchIds)
    .eq("active", true);

  const userIds = new Set<string>();
  for (const row of enrollments ?? []) {
    const studentRaw = row.students as unknown;
    const student = (Array.isArray(studentRaw) ? studentRaw[0] : studentRaw) as { user_id: string } | null;
    if (student?.user_id) userIds.add(student.user_id);
  }
  if (!userIds.size) return;

  const excerpt = body.length > 140 ? `${body.slice(0, 137)}…` : body;
  const notifyClient = isAdminClientConfigured() ? createAdminClient() : supabase;
  await notifyClient.from("notifications").insert(
    [...userIds].map((userId) => ({
      user_id: userId,
      title: `Announcement — ${title}`,
      body: excerpt,
      type: "announcement" as const,
      metadata: { kind: "faculty_announcement_new", announcementId },
    }))
  );
}

export async function setFacultyAnnouncementPinned(
  announcementId: string,
  pinned: boolean
): Promise<ActionResult> {
  try {
    await requireFacultyStaff();
    const supabase = await createClient();

    const { error } = await supabase
      .from("faculty_announcements")
      .update({ pinned, updated_at: new Date().toISOString() })
      .eq("id", announcementId);
    if (error) return actionFailure(error, "Failed to update announcement");

    revalidateFacultyAnnouncementPaths();
    return { ok: true };
  } catch (error) {
    return actionFailure(error, "Failed to update announcement");
  }
}

export async function deleteFacultyAnnouncement(announcementId: string): Promise<ActionResult> {
  try {
    await requireFacultyStaff();
    const supabase = await createClient();

    const { data: row } = await supabase
      .from("faculty_announcements")
      .select("attachment_path")
      .eq("id", announcementId)
      .maybeSingle();

    const { error } = await supabase.from("faculty_announcements").delete().eq("id", announcementId);
    if (error) return actionFailure(error, "Failed to delete announcement");

    if (row?.attachment_path && isAdminClientConfigured()) {
      await createAdminClient().storage.from("announcements").remove([row.attachment_path]);
    }

    revalidateFacultyAnnouncementPaths();
    return { ok: true };
  } catch (error) {
    return actionFailure(error, "Failed to delete announcement");
  }
}

export async function addFacultyAnnouncementReply(
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
      .from("faculty_announcements")
      .select("id, title, created_by")
      .eq("id", announcementId)
      .maybeSingle();
    if (!announcement) return { ok: false, error: "Announcement not found" };

    const { error } = await supabase.from("faculty_announcement_replies").insert({
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
        .from("faculty_announcement_replies")
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
          metadata: { kind: "faculty_announcement_reply", announcementId },
        }))
      );
    }

    revalidateFacultyAnnouncementPaths();
    return { ok: true };
  } catch (error) {
    return actionFailure(error, "Failed to post reply");
  }
}

export async function deleteFacultyAnnouncementReply(replyId: string): Promise<ActionResult> {
  try {
    const profile = await getSessionProfile();
    if (!profile) return { ok: false, error: "Not signed in" };
    const supabase = await createClient();

    // RLS limits deletion to the reply author, the announcement author, or admins.
    const { error } = await supabase.from("faculty_announcement_replies").delete().eq("id", replyId);
    if (error) return actionFailure(error, "Failed to delete reply");

    revalidateFacultyAnnouncementPaths();
    return { ok: true };
  } catch (error) {
    return actionFailure(error, "Failed to delete reply");
  }
}

export async function getFacultyAnnouncementAttachmentUrl(
  announcementId: string
): Promise<DataActionResult<{ url: string }>> {
  try {
    const profile = await getSessionProfile();
    if (!profile) return { ok: false, error: "Not signed in" };
    const supabase = await createClient();

    // Visibility check through RLS before minting a signed URL.
    const { data: announcement } = await supabase
      .from("faculty_announcements")
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
