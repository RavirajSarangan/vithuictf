import type { ComponentType } from "react";
import {
  RiFacebookFill,
  RiInstagramFill,
  RiLinkedinFill,
  RiWhatsappFill,
  RiYoutubeFill,
} from "@remixicon/react";
import { TikTokIcon } from "@/components/social-tracking/platform-icons";
import { BRAND } from "@/lib/constants";

export type SocialBrandIcon = ComponentType<{ className?: string }>;

export interface PlatformMeta {
  slug: string;
  label: string;
  icon: SocialBrandIcon;
  color: string;
  url?: string;
}

export interface ContentTypeMeta {
  slug: string;
  label: string;
  icon: SocialBrandIcon;
  color: string;
  platformSlug: string;
}

export const PLATFORM_META: Record<string, PlatformMeta> = {
  youtube: {
    slug: "youtube",
    label: "YouTube",
    icon: RiYoutubeFill,
    color: "#FF0000",
    url: BRAND.contact.social.youtube,
  },
  facebook: {
    slug: "facebook",
    label: "Facebook",
    icon: RiFacebookFill,
    color: "#1877F2",
    url: BRAND.contact.social.facebook,
  },
  instagram: {
    slug: "instagram",
    label: "Instagram",
    icon: RiInstagramFill,
    color: "#E4405F",
    url: BRAND.contact.social.instagram,
  },
  tiktok: {
    slug: "tiktok",
    label: "TikTok",
    icon: TikTokIcon,
    color: "#010101",
  },
  whatsapp: {
    slug: "whatsapp",
    label: "WhatsApp",
    icon: RiWhatsappFill,
    color: "#25D366",
    url: BRAND.contact.social.whatsappChannel,
  },
  linkedin: {
    slug: "linkedin",
    label: "LinkedIn",
    icon: RiLinkedinFill,
    color: "#0A66C2",
    url: BRAND.contact.social.linkedin,
  },
};

export const CONTENT_TYPE_META: Record<string, ContentTypeMeta> = {
  youtube_video: {
    slug: "youtube_video",
    label: "YouTube Video",
    icon: RiYoutubeFill,
    color: "#FF0000",
    platformSlug: "youtube",
  },
  youtube_shorts: {
    slug: "youtube_shorts",
    label: "YouTube Shorts",
    icon: RiYoutubeFill,
    color: "#FF0000",
    platformSlug: "youtube",
  },
  tiktok_video: {
    slug: "tiktok_video",
    label: "TikTok Video",
    icon: TikTokIcon,
    color: "#010101",
    platformSlug: "tiktok",
  },
  insta_reel: {
    slug: "insta_reel",
    label: "Insta Reel",
    icon: RiInstagramFill,
    color: "#E4405F",
    platformSlug: "instagram",
  },
};

export function getPlatformMeta(slug: string | undefined): PlatformMeta | null {
  if (!slug) return null;
  return PLATFORM_META[slug] ?? null;
}

export function getContentTypeMeta(slug: string | undefined): ContentTypeMeta | null {
  if (!slug) return null;
  return CONTENT_TYPE_META[slug] ?? null;
}

/** @deprecated Use LIVE_SYNC_INTERVAL_MS from social-live-sync.ts */
export const YOUTUBE_AUTO_SYNC_MS = 5 * 60 * 1000;
