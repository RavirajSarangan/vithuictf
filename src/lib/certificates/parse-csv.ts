import Papa from "papaparse";

export type CsvColumnKey = "studentName" | "courseName" | "email" | "phone";

export interface CsvColumnMapping {
  studentName: string;
  courseName: string;
  email?: string;
  phone?: string;
}

export interface ParsedCertificateRow {
  rowIndex: number;
  studentName: string;
  courseName: string;
  email?: string;
  phone?: string;
  errors: string[];
}

const HEADER_ALIASES: Record<CsvColumnKey, string[]> = {
  studentName: ["student name", "name", "student", "full name", "recipient name"],
  courseName: ["course name", "course", "program", "program name", "class"],
  email: ["email", "e-mail", "student email", "recipient email"],
  phone: ["phone", "whatsapp", "mobile", "phone number", "whatsapp number", "contact"],
};

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function detectColumnMapping(headers: string[]): Partial<CsvColumnMapping> {
  const mapping: Partial<CsvColumnMapping> = {};
  const normalized = headers.map((h) => ({ original: h, key: normalizeHeader(h) }));

  for (const [field, aliases] of Object.entries(HEADER_ALIASES) as [CsvColumnKey, string[]][]) {
    const match = normalized.find((h) => aliases.includes(h.key));
    if (match) {
      mapping[field as keyof CsvColumnMapping] = match.original;
    }
  }

  return mapping;
}

export function parseCertificateCsv(
  csvText: string,
  mapping: CsvColumnMapping
): { rows: ParsedCertificateRow[]; headers: string[] } {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const headers = parsed.meta.fields ?? [];
  const rows: ParsedCertificateRow[] = [];

  parsed.data.forEach((record, index) => {
    const studentName = (record[mapping.studentName] ?? "").trim();
    const courseName = (record[mapping.courseName] ?? "").trim();
    const email = mapping.email ? (record[mapping.email] ?? "").trim() : "";
    const phone = mapping.phone ? (record[mapping.phone] ?? "").trim() : "";
    const errors: string[] = [];

    if (!studentName) errors.push("Student name is required");
    if (!courseName) errors.push("Course name is required");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push("Invalid email format");
    }

    rows.push({
      rowIndex: index + 2,
      studentName,
      courseName,
      email: email || undefined,
      phone: phone || undefined,
      errors,
    });
  });

  return { rows, headers };
}

export function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function normalizePhone(value: string): string {
  return value.replace(/\D/g, "");
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const digits = normalizePhone(phone);
  const normalized = digits.startsWith("94") ? digits : digits.startsWith("0") ? `94${digits.slice(1)}` : `94${digits}`;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
