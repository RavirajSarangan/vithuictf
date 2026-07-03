import { redirect } from "next/navigation";

// Batches have been folded into courses. Each course now owns its schedule,
// classes, students, and attendance from the courses catalog.
export default function AcademicsBatchesRedirect() {
  redirect("/admin/courses");
}
