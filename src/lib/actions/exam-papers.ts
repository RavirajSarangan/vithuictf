"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { requirePaperCenterStaff, requireSuperAdmin } from "@/lib/actions/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { PassPaperExamType, PassPaperMedium } from "@/types";

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MAX_FILE_BYTES = 20 * 1024 * 1024;

type PaperMeta = {
  studentName: string;
  studentIndex?: string;
};

function parsePaperMeta(raw: string): PaperMeta[] {
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) throw new Error("Invalid paper metadata");
  return parsed.map((item) => {
    if (!item || typeof item !== "object") throw new Error("Invalid paper metadata");
    const studentName = "studentName" in item ? String(item.studentName).trim() : "";
    if (!studentName) throw new Error("Each paper requires a student name");
    const studentIndex =
      "studentIndex" in item && item.studentIndex != null ? String(item.studentIndex).trim() : "";
    return { studentName, studentIndex };
  });
}

export async function uploadExamPaperBatch(formData: FormData): Promise<{ ok: true; batchId: string }> {
  const profile = await requirePaperCenterStaff();
  const supabase = await createClient();

  const { data: staff, error: staffError } = await supabase
    .from("paper_center_staff")
    .select("id, display_name, paper_center_id, active, paper_centers(name, district, address)")
    .eq("user_id", profile.id)
    .maybeSingle();

  if (staffError || !staff) throw new Error("Paper center staff profile not found");
  if (!staff.active) throw new Error("Your account is deactivated. Contact an administrator.");

  const centerRow = staff.paper_centers;
  const center = Array.isArray(centerRow) ? centerRow[0] : centerRow;
  if (!center) throw new Error("Linked paper center not found");

  const examYearRaw = String(formData.get("examYear") ?? "").trim();
  const examYear = examYearRaw ? Number(examYearRaw) : null;
  if (examYearRaw && (!Number.isInteger(examYear) || examYear! < 1990 || examYear! > 2100)) {
    throw new Error("Enter a valid exam year");
  }

  const medium = String(formData.get("medium") ?? "").trim() as PassPaperMedium | "";
  const examType = (String(formData.get("examType") ?? "other").trim() || "other") as PassPaperExamType;
  const notes = String(formData.get("notes") ?? "").trim();
  const papers = parsePaperMeta(String(formData.get("papers") ?? "[]"));

  const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (files.length === 0) throw new Error("Add at least one exam paper file");
  if (files.length !== papers.length) {
    throw new Error("Each uploaded file needs a matching student name");
  }

  for (const file of files) {
    if (!ALLOWED_MIME.has(file.type)) {
      throw new Error("Only PDF and image files are allowed");
    }
    if (file.size > MAX_FILE_BYTES) {
      throw new Error(`Each file must be under ${MAX_FILE_BYTES / (1024 * 1024)}MB`);
    }
  }

  const place = [center.district, center.address].filter(Boolean).join(" · ");

  const { data: batch, error: batchError } = await supabase
    .from("exam_paper_batches")
    .insert({
      staff_id: staff.id,
      paper_center_id: staff.paper_center_id,
      staff_name: staff.display_name,
      center_name: center.name,
      place,
      exam_year: examYear,
      medium: medium || null,
      exam_type: examType,
      notes,
      paper_count: files.length,
    })
    .select("id")
    .single();

  if (batchError || !batch) throw new Error(batchError?.message ?? "Failed to create upload batch");

  const uploadedPaths: string[] = [];

  try {
    for (let i = 0; i < files.length; i += 1) {
      const file = files[i]!;
      const meta = papers[i]!;
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "pdf";
      const storagePath = `${profile.id}/${batch.id}/${crypto.randomUUID()}.${ext}`;

      const buffer = Buffer.from(await file.arrayBuffer());
      const { error: uploadError } = await supabase.storage.from("exam-papers").upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

      if (uploadError) throw new Error(uploadError.message);
      uploadedPaths.push(storagePath);

      const { error: submissionError } = await supabase.from("exam_paper_submissions").insert({
        batch_id: batch.id,
        student_name: meta.studentName,
        student_index: meta.studentIndex ?? "",
        storage_path: storagePath,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
      });

      if (submissionError) throw new Error(submissionError.message);
    }
  } catch (error) {
    const admin = createAdminClient();
    if (uploadedPaths.length > 0) {
      await admin.storage.from("exam-papers").remove(uploadedPaths);
    }
    await supabase.from("exam_paper_batches").delete().eq("id", batch.id);
    throw error instanceof Error ? error : new Error("Upload failed");
  }

  revalidatePath("/paper-center/history");
  revalidatePath("/admin/exam-papers");
  return { ok: true, batchId: batch.id };
}

export async function deleteExamPaperBatch(batchId: string) {
  await requireSuperAdmin();
  const admin = createAdminClient();
  const supabase = await createClient();

  const { data: submissions } = await supabase
    .from("exam_paper_submissions")
    .select("storage_path")
    .eq("batch_id", batchId);

  const paths = (submissions ?? []).map((row) => row.storage_path).filter(Boolean);
  if (paths.length > 0) {
    await admin.storage.from("exam-papers").remove(paths);
  }

  const { error } = await supabase.from("exam_paper_batches").delete().eq("id", batchId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/exam-papers");
}
