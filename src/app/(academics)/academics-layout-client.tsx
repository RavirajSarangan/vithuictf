"use client";

import { useMemo } from "react";
import { PortalAuthGate } from "@/components/auth/portal-auth-gate";
import { PortalShell } from "@/components/layout/portal-shell";
import { useMyFeaturePermissions } from "@/hooks/use-my-feature-permissions";
import { ACADEMICS_FEATURE_ROUTES } from "@/lib/staff-feature-routes";
import { academicsNav } from "@/lib/navigation";

export function AcademicsLayoutClient({ children }: { children: React.ReactNode }) {
  const permissions = useMyFeaturePermissions();

  const visibleNav = useMemo(() => {
    if (!permissions) return academicsNav;
    return academicsNav.filter((item) => {
      const route = ACADEMICS_FEATURE_ROUTES.find((r) => item.href.startsWith(r.prefix));
      return !route || permissions[route.featureKey] !== false;
    });
  }, [permissions]);

  return (
    <PortalShell navItems={visibleNav} variant="admin" title="Academics Portal" homeHref="/academics/dashboard">
      <PortalAuthGate
        allowedRoles={["super_admin", "admin", "teacher"]}
        loginHref="/login/staff"
      >
        {children}
      </PortalAuthGate>
    </PortalShell>
  );
}
