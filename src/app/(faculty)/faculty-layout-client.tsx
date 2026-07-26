"use client";

import { useMemo } from "react";
import { PortalAuthGate } from "@/components/auth/portal-auth-gate";
import { PortalShell } from "@/components/layout/portal-shell";
import { useMyFeaturePermissions } from "@/hooks/use-my-feature-permissions";
import { FACULTY_FEATURE_ROUTES } from "@/lib/faculty-feature-routes";
import { facultyNav } from "@/lib/navigation";

export function FacultyLayoutClient({ children }: { children: React.ReactNode }) {
  const permissions = useMyFeaturePermissions();

  const visibleNav = useMemo(() => {
    if (!permissions) return facultyNav;
    return facultyNav.filter((item) => {
      const route = FACULTY_FEATURE_ROUTES.find((r) => item.href.startsWith(r.prefix));
      return !route || permissions[route.featureKey] !== false;
    });
  }, [permissions]);

  return (
    <PortalShell navItems={visibleNav} variant="admin" title="Faculty Portal" homeHref="/faculty/dashboard">
      <PortalAuthGate
        allowedRoles={["super_admin", "admin", "faculty_staff"]}
        loginHref="/login/faculty"
      >
        {children}
      </PortalAuthGate>
    </PortalShell>
  );
}
