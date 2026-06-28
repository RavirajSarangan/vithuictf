import { BRAND } from "@/lib/constants";

function parseYouTubeHandle(url: string): string | null {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/\/$/, "");
    const handleMatch = path.match(/\/@([^/]+)/);
    if (handleMatch?.[1]) return handleMatch[1];
    const channelMatch = path.match(/\/channel\/([^/]+)/);
    if (channelMatch?.[1]) return channelMatch[1];
    return null;
  } catch {
    return null;
  }
}

export function getYouTubeChannelHandle(): string {
  const fromEnv = process.env.YOUTUBE_CHANNEL_HANDLE?.trim();
  if (fromEnv) return fromEnv.replace(/^@/, "");

  const fromUrl = parseYouTubeHandle(BRAND.contact.social.youtube);
  if (fromUrl && !fromUrl.startsWith("UC")) return fromUrl;

  return "ictfinstitute";
}

export function getYouTubeChannelId(): string | null {
  const id = process.env.YOUTUBE_CHANNEL_ID?.trim();
  return id || null;
}

/** Website-restricted API keys require a Referer header even on server-side calls. */
function getYouTubeApiReferer(): string {
  const fromEnv = process.env.YOUTUBE_API_REFERER?.trim();
  if (fromEnv) return fromEnv.endsWith("/") ? fromEnv : `${fromEnv}/`;
  return "https://ictf.lk/";
}

interface YouTubeChannelsResponse {
  items?: Array<{
    statistics?: {
      subscriberCount?: string;
      hiddenSubscriberCount?: boolean;
    };
  }>;
  error?: { message?: string };
}

export async function fetchYouTubeSubscriberCount(): Promise<number> {
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "YouTube API key is not configured. Add YOUTUBE_API_KEY to .env.local (Google Cloud Console → YouTube Data API v3)."
    );
  }

  const channelId = getYouTubeChannelId();
  const handle = getYouTubeChannelHandle();

  const params = new URLSearchParams({
    part: "statistics",
    key: apiKey,
  });

  if (channelId) {
    params.set("id", channelId);
  } else {
    params.set("forHandle", handle);
  }

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?${params.toString()}`,
    {
      headers: { Referer: getYouTubeApiReferer() },
      cache: "no-store",
    }
  );

  const data = (await response.json()) as YouTubeChannelsResponse;

  if (!response.ok) {
    throw new Error(data.error?.message ?? `YouTube API error (${response.status})`);
  }

  const stats = data.items?.[0]?.statistics;
  if (!stats) {
    throw new Error("YouTube channel not found. Check YOUTUBE_CHANNEL_HANDLE or YOUTUBE_CHANNEL_ID.");
  }

  if (stats.hiddenSubscriberCount) {
    throw new Error("This YouTube channel hides subscriber count. Use manual entry instead.");
  }

  const count = parseInt(stats.subscriberCount ?? "0", 10);
  if (!Number.isFinite(count) || count < 0) {
    throw new Error("Invalid subscriber count returned from YouTube.");
  }

  return count;
}

export function isYouTubeLiveSyncConfigured(): boolean {
  return Boolean(process.env.YOUTUBE_API_KEY?.trim());
}
