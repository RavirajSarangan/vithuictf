import fs from "fs";
import path from "path";
import { createCanvas, GlobalFonts, type SKRSContext2D } from "@napi-rs/canvas";
import type { CertificateFieldConfig, CertificateTemplateFieldConfig } from "@/lib/certificates/field-config";
import { buildCourseDescriptionText } from "@/lib/certificates/field-config";
import { formatCertificateIssueDate } from "@/lib/certificates/parse-date";

export interface CertificateRenderData {
  certificateNumber: string;
  studentName: string;
  courseName: string;
  issueDate: Date;
}

const FONT_FILES = {
  DancingScript: "dancing-script-latin-400-normal.woff",
  InterBold: "inter-latin-700-normal.woff",
  InterRegular: "inter-latin-400-normal.woff",
} as const;

let fontsReady = false;

function resolveFontPath(fileName: string): string {
  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, "public", "fonts", "certificates", fileName),
    path.join(
      cwd,
      "node_modules",
      "@fontsource",
      fileName.includes("dancing") ? "dancing-script" : "inter",
      "files",
      fileName
    ),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(`Certificate font file missing: ${fileName}`);
}

function ensureFontsRegistered(): void {
  if (fontsReady) return;

  GlobalFonts.registerFromPath(resolveFontPath(FONT_FILES.DancingScript), "DancingScript");
  GlobalFonts.registerFromPath(resolveFontPath(FONT_FILES.InterBold), "InterBold");
  GlobalFonts.registerFromPath(resolveFontPath(FONT_FILES.InterRegular), "InterRegular");
  fontsReady = true;
}

function fontFamilyForField(field: CertificateFieldConfig): string {
  if (field.fontFamily === "DancingScript") return "DancingScript";
  return field.fontWeight === 400 ? "InterRegular" : "InterBold";
}

function drawCover(
  ctx: SKRSContext2D,
  field: CertificateFieldConfig,
  width: number,
  height: number
): void {
  if (!field.cover) return;

  const centerX = (field.x / 100) * width;
  const centerY = (field.y / 100) * height;
  const rectWidth = (field.cover.width / 100) * width;
  const rectHeight = (field.cover.height / 100) * height;

  ctx.fillStyle = field.cover.color ?? "#FFFFFF";
  ctx.fillRect(centerX - rectWidth / 2, centerY - rectHeight / 2, rectWidth, rectHeight);
}

function fitFontSize(
  ctx: SKRSContext2D,
  text: string,
  fontFamily: string,
  weight: number,
  startSize: number,
  maxWidth: number,
  minSize: number
): number {
  let size = startSize;
  while (size > minSize) {
    ctx.font = `${weight} ${size}px ${fontFamily}`;
    if (ctx.measureText(text).width <= maxWidth) return size;
    size -= 1;
  }
  return minSize;
}

function drawTextField(
  ctx: SKRSContext2D,
  text: string,
  field: CertificateFieldConfig,
  width: number,
  height: number,
  options?: { gradient?: boolean; maxWidthPercent?: number }
): void {
  if (!text.trim()) return;

  const family = fontFamilyForField(field);
  const weight = field.fontWeight ?? (family === "DancingScript" ? 400 : 700);
  const centerX = (field.x / 100) * width;
  const centerY = (field.y / 100) * height;
  const maxWidth = options?.maxWidthPercent
    ? (options.maxWidthPercent / 100) * width
    : field.cover
      ? (field.cover.width / 100) * width
      : width * 0.7;

  const fontSize = fitFontSize(
    ctx,
    text,
    family,
    weight,
    field.fontSize,
    maxWidth,
    Math.max(10, field.fontSize - 18)
  );
  ctx.font = `${weight} ${fontSize}px ${family}`;
  ctx.textBaseline = "middle";

  if (field.align === "left") ctx.textAlign = "left";
  else if (field.align === "right") ctx.textAlign = "right";
  else ctx.textAlign = "center";

  if (options?.gradient) {
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const xStart = field.align === "center" ? centerX - textWidth / 2 : field.align === "right" ? centerX - textWidth : centerX;
    const gradient = ctx.createLinearGradient(xStart, centerY, xStart + textWidth, centerY);
    gradient.addColorStop(0, "#273461");
    gradient.addColorStop(1, "#F5A623");
    ctx.fillStyle = gradient;
  } else {
    ctx.fillStyle = field.color ?? "#273461";
  }

  ctx.fillText(text, centerX, centerY);
}

function drawWrappedTextField(
  ctx: SKRSContext2D,
  text: string,
  field: CertificateFieldConfig,
  width: number,
  height: number,
  options?: { maxWidthPercent?: number }
): void {
  const family = fontFamilyForField(field);
  const weight = field.fontWeight ?? 400;
  const centerX = (field.x / 100) * width;
  const startY = (field.y / 100) * height;
  const maxWidth = options?.maxWidthPercent
    ? (options.maxWidthPercent / 100) * width
    : field.cover
      ? (field.cover.width / 100) * width
      : width * 0.75;

  const fontSize = fitFontSize(ctx, text, family, weight, field.fontSize, maxWidth, Math.max(9, field.fontSize - 4));
  ctx.font = `${weight} ${fontSize}px ${family}`;
  ctx.fillStyle = field.color ?? "#555555";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = words[0] ?? "";
  for (const word of words.slice(1)) {
    const candidate = `${current} ${word}`;
    if (ctx.measureText(candidate).width <= maxWidth) current = candidate;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);

  const lineHeight = fontSize * 1.35;
  const blockHeight = lineHeight * lines.length;
  let y = startY - blockHeight / 2 + lineHeight / 2;

  for (const line of lines) {
    ctx.fillText(line, centerX, y);
    y += lineHeight;
  }
}

export function renderCertificateOverlay(
  fieldConfig: CertificateTemplateFieldConfig,
  data: CertificateRenderData,
  width: number,
  height: number
): Buffer {
  ensureFontsRegistered();

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  drawCover(ctx, fieldConfig.certificateNumber, width, height);
  drawCover(ctx, fieldConfig.studentName, width, height);
  drawCover(ctx, fieldConfig.courseName, width, height);
  drawCover(ctx, fieldConfig.courseDescription, width, height);
  drawCover(ctx, fieldConfig.issueDate, width, height);

  drawTextField(ctx, data.certificateNumber, fieldConfig.certificateNumber, width, height);
  drawTextField(ctx, data.studentName, fieldConfig.studentName, width, height, {
    gradient: fieldConfig.studentName.gradient,
    maxWidthPercent: fieldConfig.studentName.maxWidthPercent,
  });
  drawTextField(ctx, data.courseName, fieldConfig.courseName, width, height, {
    maxWidthPercent: fieldConfig.courseName.maxWidthPercent,
  });
  drawWrappedTextField(
    ctx,
    buildCourseDescriptionText(data.courseName),
    fieldConfig.courseDescription,
    width,
    height,
    { maxWidthPercent: fieldConfig.courseDescription.maxWidthPercent }
  );
  drawTextField(
    ctx,
    formatCertificateIssueDate(data.issueDate, fieldConfig.issueDate.format),
    fieldConfig.issueDate,
    width,
    height
  );

  return canvas.toBuffer("image/png");
}
