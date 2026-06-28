import {
  ADMIN_IMAGE_MAX_BYTES,
  ADMIN_IMAGE_MIME_TYPES,
  resolveImageContentType,
} from "@/lib/images/admin-image-constants";

export async function validateRasterImageFile(file: File): Promise<void> {
  const contentType = resolveImageContentType(file);

  if (!contentType || !ADMIN_IMAGE_MIME_TYPES.has(contentType)) {
    throw new Error("Choose a JPEG, PNG, WebP, or GIF image");
  }

  if (file.size > ADMIN_IMAGE_MAX_BYTES) {
    throw new Error("Image must be 10 MB or smaller");
  }

  if (contentType === "image/gif") return;

  const objectUrl = URL.createObjectURL(file);
  try {
    await new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Could not read image — try JPG or PNG"));
      img.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
