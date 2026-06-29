import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";

const memoryBuckets = new Map<string, { windowStart: number; count: number }>();

function checkMemoryRateLimit(key: string, max: number, windowSeconds: number): boolean {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const bucketKey = `${key}:${windowStart}`;
  const existing = memoryBuckets.get(bucketKey);

  if (!existing || existing.windowStart !== windowStart) {
    memoryBuckets.set(bucketKey, { windowStart, count: 1 });
    return true;
  }

  existing.count += 1;
  return existing.count <= max;
}

/**
 * Returns true when the request is within the limit, false when rate limited.
 * Uses Supabase RPC when service role is configured; falls back to in-memory per instance.
 */
export async function checkRateLimit(
  key: string,
  max: number,
  windowSeconds: number
): Promise<boolean> {
  const normalizedKey = key.trim();
  if (!normalizedKey || max < 1 || windowSeconds < 1) return false;

  if (!isAdminClientConfigured()) {
    return checkMemoryRateLimit(normalizedKey, max, windowSeconds);
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("check_rate_limit", {
      p_key: normalizedKey,
      p_max: max,
      p_window_seconds: windowSeconds,
    });

    if (error) {
      console.warn("[rate-limit] RPC failed, using memory fallback:", error.message);
      return checkMemoryRateLimit(normalizedKey, max, windowSeconds);
    }

    return data === true;
  } catch (err) {
    console.warn("[rate-limit] unexpected error, using memory fallback:", err);
    return checkMemoryRateLimit(normalizedKey, max, windowSeconds);
  }
}

export async function assertRateLimit(
  key: string,
  max: number,
  windowSeconds: number,
  message = "Too many requests. Please try again later."
): Promise<void> {
  const allowed = await checkRateLimit(key, max, windowSeconds);
  if (!allowed) throw new Error(message);
}
