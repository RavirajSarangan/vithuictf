export const ADMIN_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const ADMIN_IMAGE_MAX_BYTES = 10 * 1024 * 1024;

export const BLOG_COVER_WIDTH = 1920;
export const BLOG_COVER_HEIGHT = 1080;
export const BLOG_CONTENT_MAX_WIDTH = 1200;

export type BlogImageVariant = "cover" | "content";

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export function resolveImageContentType(file: File): string {
  if (file.type && ADMIN_IMAGE_MIME_TYPES.has(file.type)) {
    return file.type;
  }
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXT_TO_MIME[ext] ?? "";
}

export function assertAdminImageFile(file: File, contentType: string): void {
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("No image file provided");
  }
  if (!contentType) {
    throw new Error("Upload a JPEG, PNG, WebP, or GIF image");
  }
  if (!ADMIN_IMAGE_MIME_TYPES.has(contentType)) {
    throw new Error("Upload a JPEG, PNG, WebP, or GIF image");
  }
  if (file.size > ADMIN_IMAGE_MAX_BYTES) {
    throw new Error("Image must be 10 MB or smaller");
  }
}
