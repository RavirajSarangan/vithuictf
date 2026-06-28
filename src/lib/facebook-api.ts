import { BRAND } from "@/lib/constants";

function parseFacebookPageId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const idFromQuery = parsed.searchParams.get("id");
    if (idFromQuery) return idFromQuery;

    const path = parsed.pathname.replace(/\/$/, "");
    const profileMatch = path.match(/\/profile\.php$/i);
    if (profileMatch) return null;

    const segment = path.split("/").filter(Boolean).at(-1);
    if (segment && segment !== "profile.php") return segment;

    return null;
  } catch {
    return null;
  }
}

export function getFacebookPageId(): string {
  const fromEnv = process.env.FACEBOOK_PAGE_ID?.trim();
  if (fromEnv) return fromEnv;

  const fromUrl = parseFacebookPageId(BRAND.contact.social.facebook);
  if (fromUrl && /^\d+$/.test(fromUrl)) return fromUrl;

  return "100069520722645";
}

interface FacebookPageResponse {
  followers_count?: number;
  fan_count?: number;
  error?: { message?: string; type?: string; code?: number };
}

export async function fetchFacebookPageFollowerCount(): Promise<number> {
  const pageAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN?.trim();
  if (!pageAccessToken) {
    throw new Error(
      "Facebook Page token is not configured. Add FACEBOOK_PAGE_ACCESS_TOKEN to .env.local (Meta Developer → Page access token)."
    );
  }

  const pageId = getFacebookPageId();
  const params = new URLSearchParams({
    fields: "followers_count,fan_count",
    access_token: pageAccessToken,
  });

  const response = await fetch(
    `https://graph.facebook.com/v21.0/${pageId}?${params.toString()}`,
    { cache: "no-store" }
  );

  const data = (await response.json()) as FacebookPageResponse;

  if (!response.ok) {
    throw new Error(data.error?.message ?? `Facebook API error (${response.status})`);
  }

  const count = data.followers_count ?? data.fan_count;
  if (count === undefined || !Number.isFinite(count) || count < 0) {
    throw new Error(
      "Facebook did not return a follower count. Check page permissions (pages_read_engagement)."
    );
  }

  return count;
}

export function isFacebookLiveSyncConfigured(): boolean {
  return Boolean(process.env.FACEBOOK_PAGE_ACCESS_TOKEN?.trim());
}
