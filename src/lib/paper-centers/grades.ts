export const PAPER_CENTER_GRADES = ["10", "11", "12", "13"] as const;

export type PaperCenterGrade = (typeof PAPER_CENTER_GRADES)[number];

export type PaperCenterStaffRole = "in_charge" | "staff";

export function isPaperCenterGrade(value: string): value is PaperCenterGrade {
  return (PAPER_CENTER_GRADES as readonly string[]).includes(value);
}

export function formatPaperCenterGradeLabel(grade: PaperCenterGrade): string {
  return `G${grade}`;
}

export function normalizePaperCenterGrades(grades: string[]): PaperCenterGrade[] {
  const unique = new Set<PaperCenterGrade>();
  for (const grade of grades) {
    if (isPaperCenterGrade(grade)) unique.add(grade);
  }
  return PAPER_CENTER_GRADES.filter((grade) => unique.has(grade));
}

export function validatePaperCenterGrades(grades: string[]): string | null {
  const normalized = normalizePaperCenterGrades(grades);
  if (normalized.length === 0) return "Select at least one grade";
  return null;
}

export function validateStaffGradesForCenter(
  staffGrades: string[],
  centerGrades: string[]
): string | null {
  const normalizedStaff = normalizePaperCenterGrades(staffGrades);
  const normalizedCenter = normalizePaperCenterGrades(centerGrades);
  if (normalizedStaff.length === 0) return "Select at least one grade";
  const centerSet = new Set(normalizedCenter);
  const invalid = normalizedStaff.filter((grade) => !centerSet.has(grade));
  if (invalid.length > 0) {
    return `Grades not offered by this center: ${invalid.map(formatPaperCenterGradeLabel).join(", ")}`;
  }
  return null;
}
