import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([
  "pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt",
  "png", "jpg", "jpeg", "webp", "zip",
]);

export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);
}

export function validateUpload(file: File): string | null {
  if (file.size <= 0) return "The selected file is empty";
  if (file.size > MAX_FILE_BYTES) return "File must be 20 MB or smaller";
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.has(ext)) return `File type .${ext || "?"} is not supported`;
  return null;
}

export async function uploadToBucket(bucket: string, path: string, file: File): Promise<string> {
  if (!isAdminClientConfigured()) throw new Error("File storage is not configured");
  const admin = createAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage.from(bucket).upload(path, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return path;
}
