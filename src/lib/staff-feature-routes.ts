import type { StaffFeatureKey } from "@/lib/actions/auth";

/** Shared by src/proxy.ts (route redirect) and the academics nav (client-side hiding). */
export const ACADEMICS_FEATURE_ROUTES: { prefix: string; featureKey: StaffFeatureKey }[] = [
  { prefix: "/academics/quizzes", featureKey: "quizzes_exams" },
  { prefix: "/academics/exams", featureKey: "quizzes_exams" },
  { prefix: "/academics/assignments", featureKey: "assignments" },
  { prefix: "/academics/attendance", featureKey: "attendance_students" },
  { prefix: "/academics/students", featureKey: "attendance_students" },
  { prefix: "/academics/announcements", featureKey: "announcements_report_cards" },
  { prefix: "/academics/report-cards", featureKey: "announcements_report_cards" },
  { prefix: "/academics/blog", featureKey: "blog" },
];
