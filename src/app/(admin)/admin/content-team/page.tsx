import { redirect } from "next/navigation";

export default function AdminContentTeamRedirectPage() {
  redirect("/admin/people?tab=content");
}
