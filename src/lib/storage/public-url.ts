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

export type StorageUrlStatus = "idle" | "checking" | "ok" | "missing" | "invalid";

/** Client-side check that a remote image URL responds before previewing. */
export async function checkStorageUrl(url: string): Promise<Exclude<StorageUrlStatus, "idle" | "checking">> {
  const normalized = normalizeStorageUrl(url);
  if (!normalized) return "invalid";

  try {
    const response = await fetch(normalized, { method: "HEAD" });
    return response.ok ? "ok" : "missing";
  } catch {
    // If HEAD is blocked (network/ad blocker), still try rendering the image.
    return "ok";
  }
}
