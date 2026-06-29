import sharp from "sharp";
import {
  assertAdminImageFile,
  BLOG_CONTENT_MAX_WIDTH,
  BLOG_COVER_HEIGHT,
  BLOG_COVER_WIDTH,
  resolveImageContentType,
} from "@/lib/images/admin-image-constants";
import { assertValidImageBuffer } from "@/lib/storage/upload-admin-object";

export type RasterUploadVariant =
  | "cover"
  | "content"
  | "general"
  | "square"
  | "avatar"
  | "template";

const GENERAL_MAX_WIDTH = 2000;
const SQUARE_SIZE = 1024;
const AVATAR_SIZE = 512;
const TEMPLATE_MAX_WIDTH = 2400;

export type ProcessedRasterImage = {
  buffer: Buffer;
  contentType: string;
  ext: string;
};

function passthrough(buffer: Buffer, contentType: string, ext: string): ProcessedRasterImage {
  return { buffer, contentType, ext };
}

async function toWebpBuffer(
  input: Buffer,
  quality: number,
  options?: {
    width?: number;
    height?: number;
    fit?: "cover" | "inside";
  }
): Promise<ProcessedRasterImage> {
  let pipeline = sharp(input, { failOn: "error" }).rotate();

  if (options?.width || options?.height) {
    pipeline = pipeline.resize(options.width, options.height, {
      fit: options.fit ?? "inside",
      withoutEnlargement: true,
      position: "centre",
    });
  }

  const buffer = await pipeline.webp({ quality, effort: 4 }).toBuffer();
  await assertValidImageBuffer(buffer, "Image");
  return { buffer, contentType: "image/webp", ext: "webp" };
}

async function processBuffer(
  input: Buffer,
  contentType: string,
  variant: RasterUploadVariant
): Promise<ProcessedRasterImage> {
  if (contentType === "image/gif") {
    return passthrough(input, contentType, "gif");
  }

  if (contentType === "image/svg+xml") {
    return passthrough(input, contentType, "svg");
  }

  switch (variant) {
    case "cover":
      return toWebpBuffer(input, 85, {
        width: BLOG_COVER_WIDTH,
        height: BLOG_COVER_HEIGHT,
        fit: "cover",
      });
    case "content": {
      const meta = await sharp(input).metadata();
      const width = meta.width ?? 0;
      if (width > BLOG_CONTENT_MAX_WIDTH) {
        return toWebpBuffer(input, 82, { width: BLOG_CONTENT_MAX_WIDTH });
      }
      return toWebpBuffer(input, 82);
    }
    case "square":
      return toWebpBuffer(input, 85, {
        width: SQUARE_SIZE,
        height: SQUARE_SIZE,
        fit: "cover",
      });
    case "avatar":
      return toWebpBuffer(input, 85, {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        fit: "cover",
      });
    case "template":
      return toWebpBuffer(input, 90, { width: TEMPLATE_MAX_WIDTH });
    case "general":
    default:
      return toWebpBuffer(input, 85, { width: GENERAL_MAX_WIDTH });
  }
}

export async function prepareRasterImageUpload(
  file: File,
  variant: RasterUploadVariant
): Promise<ProcessedRasterImage> {
  const contentType = resolveImageContentType(file);
  assertAdminImageFile(file, contentType);
  const input = Buffer.from(await file.arrayBuffer());
  return processBuffer(input, contentType, variant);
}

export async function prepareRasterBufferUpload(
  input: Buffer,
  contentType: string,
  variant: RasterUploadVariant
): Promise<ProcessedRasterImage> {
  if (!contentType) {
    throw new Error("Upload a JPEG, PNG, WebP, or GIF image");
  }
  return processBuffer(input, contentType, variant);
}

/** @deprecated Use prepareRasterImageUpload */
export async function prepareBlogImageUpload(
  file: File,
  variant: "cover" | "content"
): Promise<ProcessedRasterImage> {
  return prepareRasterImageUpload(file, variant);
}
