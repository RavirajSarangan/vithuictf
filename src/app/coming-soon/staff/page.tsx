import { redirect } from "next/navigation";
import { ComingSoon } from "@/components/shared/coming-soon";
import { PORTAL_ACCESS } from "@/lib/portal-access";

export default function StaffComingSoonPage() {
  if (PORTAL_ACCESS.teacher) {
    redirect("/login");
  }

  return (
    <ComingSoon
      portalName="Staff — Coming Soon"
      description="Manage classes, upload resources, and track student performance from a dedicated staff dashboard."
      helperText="The student portal is live. Staff tools will open in a future release."
    />
  );
}
