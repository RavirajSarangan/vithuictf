import { redirect } from "next/navigation";
import { ComingSoon } from "@/components/shared/coming-soon";
import { PORTAL_ACCESS } from "@/lib/portal-access";
import { BRAND } from "@/lib/constants";

export default function AdminComingSoonPage() {
  if (PORTAL_ACCESS.admin) {
    redirect("/login");
  }

  return (
    <ComingSoon
      portalName="Admin Dashboard — Coming Soon"
      description={`Manage students, courses, home content, and academy operations from the ${BRAND.name} admin panel.`}
    />
  );
}
