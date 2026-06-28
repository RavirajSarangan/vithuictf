import sharp from "sharp";
import {
  assertAdminImageFile,
  BLOG_CONTENT_MAX_WIDTH,
  BLOG_COVER_HEIGHT,
  BLOG_COVER_WIDTH,
  resolveImageContentType,
  type BlogImageVariant,
} from "@/lib/images/admin-image-constants";

export async function processBlogCoverImage(
  input: Buffer
): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  const buffer = await sharp(input)
    .rotate()
    .resize(BLOG_COVER_WIDTH, BLOG_COVER_HEIGHT, { fit: "cover", position: "centre" })
    .webp({ quality: 85 })
    .toBuffer();

  return { buffer, contentType: "image/webp", ext: "webp" };
}

export async function processBlogContentImage(
  input: Buffer
): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  const image = sharp(input).rotate();
  const meta = await image.metadata();
  const width = meta.width ?? 0;

  let pipeline = image;
  if (width > BLOG_CONTENT_MAX_WIDTH) {
    pipeline = pipeline.resize(BLOG_CONTENT_MAX_WIDTH, undefined, { withoutEnlargement: true });
  }

  const buffer = await pipeline.webp({ quality: 82 }).toBuffer();
  return { buffer, contentType: "image/webp", ext: "webp" };
}

export async function prepareBlogImageUpload(
  file: File,
  variant: BlogImageVariant
): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  const contentType = resolveImageContentType(file);
  assertAdminImageFile(file, contentType);

  const input = Buffer.from(await file.arrayBuffer());

  if (contentType === "image/gif") {
    const ext = file.name.split(".").pop()?.toLowerCase() || "gif";
    return { buffer: input, contentType, ext };
  }

  return variant === "cover"
    ? processBlogCoverImage(input)
    : processBlogContentImage(input);
}
