import { redirect } from "next/navigation";
import { ComingSoon } from "@/components/shared/coming-soon";
import { PORTAL_ACCESS } from "@/lib/portal-access";

export default function TeacherComingSoonPage() {
  if (PORTAL_ACCESS.teacher) {
    redirect("/login");
  }

  return (
    <ComingSoon
      portalName="Teacher Portal — Coming Soon"
      description="Manage classes, upload resources, and track student performance from a dedicated teacher dashboard."
    />
  );
}
