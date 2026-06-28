import { getSupabaseUrl } from "@/lib/supabase/env";

/** Build a stable public URL for files in the admin storage bucket. */
export function buildAdminPublicUrl(objectPath: string): string {
  const base = getSupabaseUrl().replace(/\/$/, "");
  const cleanPath = objectPath.replace(/^\/+/, "");
  return `${base}/storage/v1/object/public/admin/${cleanPath}`;
}

/** Normalize pasted or returned asset URLs for preview and persistence. */
export function normalizeStorageUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return "";
    }
    return parsed.toString();
  } catch {
    return "";
  }
}

export function isStorageUrl(url: string): boolean {
  const normalized = normalizeStorageUrl(url);
  if (!normalized) return false;
  return normalized.includes("/storage/v1/object/public/");
}
