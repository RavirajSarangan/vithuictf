import { headers } from "next/headers";

/** Best-effort client key for rate limiting (IP + optional suffix such as email). */
export async function getRequestClientKey(suffix?: string): Promise<string> {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = headerStore.get("x-real-ip")?.trim();
  const ip = forwarded || realIp || "unknown";
  if (!suffix) return ip;
  return `${ip}:${suffix.trim().toLowerCase()}`;
}
