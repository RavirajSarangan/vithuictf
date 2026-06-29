import { absoluteUrl } from "@/lib/seo/site";

export type BlogShareInput = {
  title: string;
  slug: string;
  excerpt: string;
  tags: string[];
};

const EXCERPT_MAX = 180;

export function buildBlogPostUrl(slug: string): string {
  return absoluteUrl(`/blog/${slug}`);
}

function tagToHashtag(tag: string): string {
  const cleaned = tag
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "");
  if (!cleaned) return "";
  return `#${cleaned}`;
}

export function buildBlogShareHashtags(post: Pick<BlogShareInput, "tags">): string {
  const base = "#ICTF #vithoo";
  const tagHashtags = post.tags
    .map(tagToHashtag)
    .filter((tag, index, list) => tag && list.indexOf(tag) === index)
    .join(" ");
  return tagHashtags ? `${base} ${tagHashtags}` : base;
}

function trimExcerpt(excerpt: string): string {
  const trimmed = excerpt.trim();
  if (trimmed.length <= EXCERPT_MAX) return trimmed;
  return `${trimmed.slice(0, EXCERPT_MAX - 1).trimEnd()}…`;
}

export function buildBlogShareCaption(post: BlogShareInput): string {
  const url = buildBlogPostUrl(post.slug);
  const hashtags = buildBlogShareHashtags(post);
  const excerpt = trimExcerpt(post.excerpt || post.title);

  return `${post.title.trim()}\n\n${excerpt}\n\nRead on ICTF: ${url}\n\n${hashtags}`;
}

export type BlogSharePlatform =
  | "facebook"
  | "whatsapp"
  | "linkedin"
  | "x"
  | "telegram"
  | "instagram"
  | "tiktok";

export type BlogPlatformShareUrls = Record<
  Exclude<BlogSharePlatform, "instagram" | "tiktok">,
  string
>;

export function buildBlogPlatformShareUrls(post: BlogShareInput): BlogPlatformShareUrls {
  const url = buildBlogPostUrl(post.slug);
  const caption = buildBlogShareCaption(post);
  const tweetText = `${post.title.trim()}\n\nRead on ICTF:\n${url}\n\n${buildBlogShareHashtags(post)}`;

  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(caption)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(caption)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(caption)}`,
  };
}

export const BLOG_COPY_ONLY_PLATFORMS: BlogSharePlatform[] = ["instagram", "tiktok"];

export const BLOG_SHARE_PLATFORMS: BlogSharePlatform[] = [
  "facebook",
  "whatsapp",
  "linkedin",
  "x",
  "telegram",
  "instagram",
  "tiktok",
];
