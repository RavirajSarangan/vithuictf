"use client";

import { PortalAuthGate } from "@/components/auth/portal-auth-gate";
import { PortalShell } from "@/components/layout/portal-shell";
import { parentNav } from "@/lib/navigation";

export function ParentLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell navItems={parentNav} variant="parent">
      <PortalAuthGate allowedRoles={["parent"]} loginHref="/login">
        {children}
      </PortalAuthGate>
    </PortalShell>
  );
}
