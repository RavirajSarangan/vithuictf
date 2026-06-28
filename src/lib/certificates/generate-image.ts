import fs from "fs";
import path from "path";
import type { CertificateTemplateFieldConfig } from "@/lib/certificates/field-config";
import { renderCertificateOverlay, type CertificateRenderData } from "@/lib/certificates/render-overlay";

export type { CertificateRenderData };

async function loadTemplateBuffer(imageUrl: string): Promise<Buffer> {
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch template image (${response.status})`);
    }
    return Buffer.from(await response.arrayBuffer());
  }

  const normalized = imageUrl.replace(/^\//, "");
  const candidates = [
    path.join(process.cwd(), "public", normalized),
    path.join(process.cwd(), "public", normalized.replace(/\.png$/i, ".webp")),
    path.join(process.cwd(), "public", "landing", "ictf-certificate.webp"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return fs.readFileSync(candidate);
    }
  }

  throw new Error(`Certificate template image not found: ${imageUrl}`);
}

export async function generateCertificateImage(
  templateImageUrl: string,
  fieldConfig: CertificateTemplateFieldConfig,
  data: CertificateRenderData
): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  const templateBuffer = await loadTemplateBuffer(templateImageUrl);
  const metadata = await sharp(templateBuffer).metadata();
  const width = metadata.width ?? 2000;
  const height = metadata.height ?? 1414;

  const overlay = renderCertificateOverlay(fieldConfig, data, width, height);

  return sharp(templateBuffer)
    .composite([{ input: overlay, top: 0, left: 0 }])
    .png()
    .toBuffer();
}
