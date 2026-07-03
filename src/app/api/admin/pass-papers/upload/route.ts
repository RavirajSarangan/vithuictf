import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/actions/auth";
import { isGoogleDriveConfigured } from "@/lib/pass-papers/drive-sync-types";
import { ALLOWED_UPLOAD_MIME, uploadFileToDrive } from "@/lib/google-drive";
import { buildDriveFileUrl } from "@/lib/pass-papers/drive-id";
import { createPassPaperItem } from "@/lib/actions/pass-papers";
import type { PassPaperExamType, PassPaperMedium } from "@/types";

export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB
const EXAM_TYPES: PassPaperExamType[] = ["al", "ol", "scholarship", "other"];
const MEDIUMS: PassPaperMedium[] = ["english", "sinhala", "tamil"];

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

export async function POST(request: Request) {
  try {
    await requireSuperAdmin();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Unauthorized: super admin access required" },
      { status: 403 }
    );
  }

  if (!isGoogleDriveConfigured()) {
    return badRequest(
      "Google Drive is not configured on the server. Add the GOOGLE_DRIVE_SERVICE_ACCOUNT_* env vars, then redeploy."
    );
  }

  const uploadFolderId = process.env.GOOGLE_DRIVE_PASS_PAPERS_UPLOAD_FOLDER_ID?.trim();
  if (!uploadFolderId) {
    return badRequest(
      "Upload folder is not configured. Set GOOGLE_DRIVE_PASS_PAPERS_UPLOAD_FOLDER_ID to a Shared Drive folder ID."
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return badRequest("Invalid upload payload");
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return badRequest("Select a file to upload");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return badRequest("File is too large (max 25 MB)");
  }
  const mimeType = file.type || "application/octet-stream";
  if (!ALLOWED_UPLOAD_MIME.has(mimeType)) {
    return badRequest("Only PDF, JPG, or PNG files are allowed");
  }

  const folderId = String(form.get("folderId") ?? "").trim();
  if (!folderId) {
    return badRequest("Select a folder for this pass paper");
  }
  const title = String(form.get("title") ?? "").trim();
  if (!title) {
    return badRequest("Title is required");
  }

  const yearRaw = String(form.get("year") ?? "").trim();
  const yearNum = yearRaw ? Number(yearRaw) : undefined;
  const year = yearNum && Number.isFinite(yearNum) ? yearNum : undefined;

  const mediumRaw = String(form.get("medium") ?? "").trim();
  const medium = MEDIUMS.includes(mediumRaw as PassPaperMedium)
    ? (mediumRaw as PassPaperMedium)
    : undefined;

  const examTypeRaw = String(form.get("examType") ?? "").trim();
  const examType = EXAM_TYPES.includes(examTypeRaw as PassPaperExamType)
    ? (examTypeRaw as PassPaperExamType)
    : "other";

  const published = String(form.get("published") ?? "") === "true";

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { fileId } = await uploadFileToDrive({
      name: title,
      mimeType,
      buffer,
      parentFolderId: uploadFolderId,
    });

    const result = await createPassPaperItem({
      folderId,
      title,
      driveUrl: buildDriveFileUrl(fileId),
      year,
      medium,
      examType,
      published,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true, item: { id: result.data.id } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
