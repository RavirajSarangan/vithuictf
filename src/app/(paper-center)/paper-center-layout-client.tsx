"use client";

import { PortalAuthGate } from "@/components/auth/portal-auth-gate";
import { PortalShell } from "@/components/layout/portal-shell";
import { paperCenterNav } from "@/lib/navigation";
import { usePaperCenterStaffProfile } from "@/hooks/use-exam-papers";

export function PaperCenterLayoutClient({ children }: { children: React.ReactNode }) {
  const { staff } = usePaperCenterStaffProfile();
  const portalTitle = staff?.paperCenterName ? `${staff.paperCenterName}` : "Paper Center";

  return (
    <PortalAuthGate allowedRoles={["paper_center_staff"]} loginHref="/login/paper-center">
      <PortalShell
        navItems={paperCenterNav}
        variant="admin"
        title={portalTitle}
        homeHref="/paper-center/dashboard"
      >
        {children}
      </PortalShell>
    </PortalAuthGate>
  );
}
