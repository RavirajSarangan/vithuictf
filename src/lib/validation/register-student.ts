import { BRAND } from "@/lib/constants";

export type StudyTrack = "al" | "grade";
export type IctGrade = "grade_10" | "grade_11";

export const EXAM_YEARS = ["2026", "2027", "2028", "2029"] as const;
export type ExamYear = (typeof EXAM_YEARS)[number];

export interface RegisterStudentInput {
  displayName: string;
  username: string;
  nicNumber: string;
  indexNumber?: string;
  phone?: string;
  studyTrack: StudyTrack;
  examYear?: string;
  ictGrade?: IctGrade;
  courseId: string;
  courseName: string;
  email: string;
  password: string;
}

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function normalizeIndexNumber(indexNumber: string): string {
  return indexNumber.trim().toUpperCase();
}

export function normalizePhone(phone: string): string {
  return phone.trim().replace(/\s+/g, "");
}

/** Sri Lankan NIC: legacy 9 digits + V/X, or new 12-digit format. */
export function normalizeNic(nic: string): string {
  return nic.trim().replace(/[\s-]/g, "").toUpperCase();
}

/** Auto-format NIC while the user types (strip spaces/dashes, uppercase suffix). */
export function formatNicInput(value: string): string {
  const cleaned = value.replace(/[\s-]/g, "").toUpperCase();

  if (/^\d{0,9}[VX]?$/.test(cleaned)) {
    return cleaned;
  }

  const digitsOnly = cleaned.replace(/[VX]/g, "").replace(/\D/g, "");
  if (digitsOnly.length <= 12) {
    return digitsOnly;
  }

  return digitsOnly.slice(0, 12);
}

export function isValidNic(nic: string): boolean {
  const normalized = normalizeNic(nic);
  return /^\d{9}[VX]$/.test(normalized) || /^\d{12}$/.test(normalized);
}

export function buildGeneratedIndexNumber(examYear?: string, ictGrade?: IctGrade): string {
  const yearPart = examYear?.trim() || new Date().getFullYear().toString();
  const gradePart = ictGrade === "grade_10" ? "G10" : ictGrade === "grade_11" ? "G11" : "AL";
  const randomPart = Math.floor(100000 + Math.random() * 900000).toString();
  return `${BRAND.studentIdPrefix}-${yearPart}-${gradePart}-${randomPart}`;
}

export function validateRegisterStudent(input: RegisterStudentInput): string | null {
  const displayName = input.displayName.trim();
  if (displayName.length < 2) {
    return "Enter your full name";
  }

  const username = normalizeUsername(input.username);
  if (!USERNAME_PATTERN.test(username)) {
    return "Username needs 3–20 letters, numbers, or underscores";
  }

  const nicNumber = normalizeNic(input.nicNumber);
  if (!isValidNic(nicNumber)) {
    return "Enter a valid NIC number (e.g. 123456789V or 200012345678)";
  }

  if (input.indexNumber?.trim()) {
    const indexNumber = normalizeIndexNumber(input.indexNumber);
    if (indexNumber.length < 4) {
      return "Enter a valid index number";
    }
  }

  if (input.phone?.trim()) {
    const phone = normalizePhone(input.phone);
    if (phone.length < 9) {
      return "Enter a valid phone number";
    }
  }

  if (input.studyTrack === "al") {
    if (!input.examYear?.trim()) {
      return "Select your A/L exam year";
    }
    if (!EXAM_YEARS.includes(input.examYear as ExamYear)) {
      return "Select a valid A/L exam year";
    }
  } else if (input.studyTrack === "grade") {
    if (!input.ictGrade) {
      return "Select Grade 10 or Grade 11 ICT";
    }
  } else {
    return "Select A/L ICT or Grade 10/11 ICT";
  }

  if (!input.courseId.trim()) {
    return "Select a course";
  }

  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Enter a valid email address";
  }

  if (input.password.length < 8) {
    return "Use at least 8 characters";
  }

  return null;
}
