import type { SitePublicMode, UserRole } from "@/types";

const SITE_GATE_WEBHOOK_PATHS = ["/api/stripe/webhook"] as const;
const SITE_MODE_CACHE_TTL_MS = 60_000;

let siteModeCache: { value: SitePublicMode; expiresAt: number } | null = null;

export function isSiteGateWebhookPath(pathname: string): boolean {
  return SITE_GATE_WEBHOOK_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export function isSitePublicModeGated(mode: SitePublicMode): boolean {
  return mode !== "live";
}

export function getSiteGateRedirectPath(mode: SitePublicMode): string {
  if (mode === "maintenance") return "/maintenance";
  if (mode === "coming_soon") return "/coming-soon";
  return "/";
}

export function parseSitePublicMode(value: string | null | undefined): SitePublicMode {
  if (value === "coming_soon" || value === "maintenance") return value;
  return "live";
}

export function shouldBypassSiteGate(role: UserRole | null | undefined): boolean {
  return role === "admin";
}

/** Paths reachable by the public while the site is gated (admin bypasses the gate entirely). */
export function isSiteGatePublicExemptPath(pathname: string, mode: SitePublicMode): boolean {
  if (pathname === "/login") return true;
  if (mode === "coming_soon" && pathname === "/coming-soon") return true;
  if (mode === "maintenance" && pathname === "/maintenance") return true;
  return false;
}

function readEnvSiteMode(): SitePublicMode | null {
  const raw = process.env.SITE_PUBLIC_MODE;
  if (raw === "coming_soon" || raw === "maintenance" || raw === "live") return raw;
  return null;
}

async function fetchSitePublicModeFromApi(): Promise<SitePublicMode> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) return "live";

  try {
    const response = await fetch(
      `${url}/rest/v1/platform_settings?id=eq.1&select=site_public_mode`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) return "live";

    const rows = (await response.json()) as { site_public_mode?: string }[];
    return parseSitePublicMode(rows[0]?.site_public_mode);
  } catch {
    return "live";
  }
}

export async function fetchSitePublicMode(): Promise<SitePublicMode> {
  const envMode = readEnvSiteMode();
  if (envMode) return envMode;

  const now = Date.now();
  if (siteModeCache && siteModeCache.expiresAt > now) {
    return siteModeCache.value;
  }

  const mode = await fetchSitePublicModeFromApi();
  siteModeCache = { value: mode, expiresAt: now + SITE_MODE_CACHE_TTL_MS };
  return mode;
}

export function clearSitePublicModeCache(): void {
  siteModeCache = null;
}
