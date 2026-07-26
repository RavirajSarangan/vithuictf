import type { StaffFeatureKey } from "@/lib/actions/auth";

/** Shared by src/proxy.ts (route redirect) and the faculty nav (client-side hiding). */
export const FACULTY_FEATURE_ROUTES: { prefix: string; featureKey: StaffFeatureKey }[] = [
  { prefix: "/faculty/quizzes", featureKey: "quizzes_exams" },
  { prefix: "/faculty/exams", featureKey: "quizzes_exams" },
  { prefix: "/faculty/assignments", featureKey: "assignments" },
  { prefix: "/faculty/attendance", featureKey: "attendance_students" },
  { prefix: "/faculty/announcements", featureKey: "announcements_report_cards" },
  { prefix: "/faculty/report-cards", featureKey: "announcements_report_cards" },
];
