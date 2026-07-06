// Sri Lankan national grading scale. Kept as a constant for now; move to
// platform_settings if institutes ever need to customise it.
export const GRADE_BANDS: { grade: string; minPercent: number }[] = [
  { grade: "A", minPercent: 75 },
  { grade: "B", minPercent: 65 },
  { grade: "C", minPercent: 55 },
  { grade: "S", minPercent: 35 },
  { grade: "F", minPercent: 0 },
];

export function gradeForPercent(percent: number): string {
  const band = GRADE_BANDS.find((b) => percent >= b.minPercent);
  return band?.grade ?? "F";
}

export function gradeForMarks(marks: number, totalMarks: number): string {
  if (totalMarks <= 0) return "F";
  return gradeForPercent((marks / totalMarks) * 100);
}
