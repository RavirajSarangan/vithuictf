"use client";

import { PortalAuthGate } from "@/components/auth/portal-auth-gate";
import { PortalShell } from "@/components/layout/portal-shell";
import { academicsNav } from "@/lib/navigation";

export function AcademicsLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell navItems={academicsNav} variant="admin" title="Academics Portal" homeHref="/academics/dashboard">
      <PortalAuthGate
        allowedRoles={["super_admin", "admin", "teacher"]}
        loginHref="/login/staff"
      >
        {children}
      </PortalAuthGate>
    </PortalShell>
  );
}
