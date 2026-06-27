import { redirect } from "next/navigation";

/** Legacy URL — staff portal renamed from teacher. */
export default function TeacherComingSoonRedirectPage() {
  redirect("/coming-soon/staff");
}
