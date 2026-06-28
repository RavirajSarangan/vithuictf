"use client";

import { PortalAuthGate } from "@/components/auth/portal-auth-gate";
import { PortalShell } from "@/components/layout/portal-shell";
import { staffNav } from "@/lib/navigation";

export function StaffLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <PortalAuthGate allowedRoles={["content_manager"]} loginHref="/login/social-tracking">
      <PortalShell navItems={staffNav} variant="admin" title="Content Team" homeHref="/staff/tracking">
        {children}
      </PortalShell>
    </PortalAuthGate>
  );
}
