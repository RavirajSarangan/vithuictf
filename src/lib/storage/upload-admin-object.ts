import { createAdminClient } from "@/lib/supabase/admin";
import { buildAdminPublicUrl } from "@/lib/storage/public-url";

/** Upload binary image data without UTF-8 corruption in the Supabase client. */
export async function uploadAdminStorageObject(
  path: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const admin = createAdminClient();
  const body = Uint8Array.from(buffer);

  const { error } = await admin.storage.from("admin").upload(path, body, {
    contentType,
    upsert: false,
  });

  if (error) throw new Error(error.message);
  return buildAdminPublicUrl(path);
}

export async function assertValidImageBuffer(buffer: Buffer, label = "Image"): Promise<void> {
  const sharp = (await import("sharp")).default;
  try {
    const meta = await sharp(buffer).metadata();
    if (!meta.width || !meta.height) {
      throw new Error(`${label} processing failed`);
    }
  } catch {
    throw new Error(`${label} processing failed — try JPG or PNG`);
  }
}
