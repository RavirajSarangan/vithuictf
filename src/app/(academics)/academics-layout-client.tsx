"use client";

import { PortalAuthGate } from "@/components/auth/portal-auth-gate";
import { PortalShell } from "@/components/layout/portal-shell";
import { academicsNav } from "@/lib/navigation";

export function AcademicsLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <PortalAuthGate
      allowedRoles={["super_admin", "admin", "teacher"]}
      loginHref="/login/staff"
    >
      <PortalShell navItems={academicsNav} variant="admin" title="Academics Portal" homeHref="/academics/dashboard">
        {children}
      </PortalShell>
    </PortalAuthGate>
  );
}
