export const BLOG_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugifyBlogTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function validateBlogSlug(slug: string): void {
  if (!slug.trim()) {
    throw new Error("Slug is required");
  }
  if (!BLOG_SLUG_REGEX.test(slug)) {
    throw new Error("Slug may only contain lowercase letters, numbers, and hyphens");
  }
}
