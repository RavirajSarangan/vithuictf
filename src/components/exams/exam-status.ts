import type { ExamStatus } from "@/types";

export const EXAM_TERMS = ["Term 1", "Term 2", "Term 3"];

export function examStatusLabel(status: ExamStatus): string {
  switch (status) {
    case "scheduled":
      return "Scheduled";
    case "grading":
      return "Grading";
    case "published":
      return "Published";
  }
}

export function examStatusVariant(status: ExamStatus): "default" | "secondary" | "outline" {
  switch (status) {
    case "scheduled":
      return "outline";
    case "grading":
      return "secondary";
    case "published":
      return "default";
  }
}
