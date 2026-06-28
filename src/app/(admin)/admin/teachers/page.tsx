import { redirect } from "next/navigation";

export default function AdminTeachersRedirectPage() {
  redirect("/admin/people?tab=staff");
}
