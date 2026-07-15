export type CertificateFieldAlign = "left" | "center" | "right";

export interface CertificateFieldCover {
  width: number;
  height: number;
  color?: string;
}

export interface CertificateFieldConfig {
  x: number;
  y: number;
  fontSize: number;
  color?: string;
  align?: CertificateFieldAlign;
  fontFamily?: "DancingScript" | "Inter";
  fontWeight?: number;
  gradient?: boolean;
  format?: string;
  /** Hides baked-in template placeholder text before drawing dynamic values */
  cover?: CertificateFieldCover;
  maxWidthPercent?: number;
}

export interface CertificateTemplateFieldConfig {
  certificateNumber: CertificateFieldConfig;
  studentName: CertificateFieldConfig;
  courseName: CertificateFieldConfig;
  courseDescription: CertificateFieldConfig;
  issueDate: CertificateFieldConfig;
}

export const DEFAULT_CERTIFICATE_FIELD_CONFIG: CertificateTemplateFieldConfig = {
  certificateNumber: {
    x: 88,
    y: 3.8,
    fontSize: 12,
    color: "#FFFFFF",
    align: "right",
    fontFamily: "Inter",
    cover: { width: 28, height: 4.5, color: "#1B3A6B" },
  },
  studentName: {
    x: 50,
    y: 41,
    fontSize: 88,
    color: "#273461",
    align: "center",
    fontFamily: "DancingScript",
    gradient: true,
    cover: { width: 62, height: 12, color: "#FFFFFF" },
    maxWidthPercent: 60,
  },
  courseName: {
    x: 50,
    y: 57.8,
    fontSize: 42,
    color: "#273461",
    align: "center",
    fontFamily: "Inter",
    fontWeight: 700,
    cover: { width: 76, height: 9, color: "#FFFFFF" },
    maxWidthPercent: 60,
  },
  courseDescription: {
    x: 50,
    y: 64.5,
    fontSize: 30,
    color: "#555555",
    align: "center",
    fontFamily: "Inter",
    fontWeight: 400,
    cover: { width: 84, height: 14, color: "#FFFFFF" },
    maxWidthPercent: 60,
  },
  issueDate: {
    x: 68.4,
    y: 75,
    fontSize: 24,
    color: "#273461",
    align: "center",
    fontFamily: "Inter",
    fontWeight: 700,
    format: "DD.MM.YYYY",
    cover: { width: 20, height: 5.8, color: "#FFFFFF" },
  },
};

export const DEFAULT_CERTIFICATE_TEMPLATE_PATH = "/landing/ictf-certificate.webp";
export const DEFAULT_CERTIFICATE_ID_PREFIX = "FOC-CERT-2026";
export const DEFAULT_CERTIFICATE_ID_PADDING = 3;

function mergeField(
  defaults: CertificateFieldConfig,
  overrides?: Partial<CertificateFieldConfig>
): CertificateFieldConfig {
  if (!overrides) return defaults;
  return {
    ...defaults,
    ...overrides,
    cover: overrides.cover
      ? { ...defaults.cover, ...overrides.cover }
      : defaults.cover,
  };
}

export function parseFieldConfig(raw: unknown): CertificateTemplateFieldConfig {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return DEFAULT_CERTIFICATE_FIELD_CONFIG;
  }
  const obj = raw as Partial<CertificateTemplateFieldConfig>;

  return {
    certificateNumber: mergeField(
      DEFAULT_CERTIFICATE_FIELD_CONFIG.certificateNumber,
      obj.certificateNumber
    ),
    studentName: mergeField(DEFAULT_CERTIFICATE_FIELD_CONFIG.studentName, obj.studentName),
    courseName: mergeField(DEFAULT_CERTIFICATE_FIELD_CONFIG.courseName, obj.courseName),
    courseDescription: mergeField(
      DEFAULT_CERTIFICATE_FIELD_CONFIG.courseDescription,
      obj.courseDescription
    ),
    issueDate: mergeField(DEFAULT_CERTIFICATE_FIELD_CONFIG.issueDate, obj.issueDate),
  };
}

/** Renders using each template's own stored field positions, falling back to the defaults for any missing field. */
export function getRenderFieldConfig(raw?: unknown): CertificateTemplateFieldConfig {
  return parseFieldConfig(raw);
}

export function buildCourseDescriptionText(courseName: string): string {
  return `In recognition of dedication and contributions to the ${courseName} course, completed with excellence.`;
}
