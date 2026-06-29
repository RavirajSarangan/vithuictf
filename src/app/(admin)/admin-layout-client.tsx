"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PortalAuthGate } from "@/components/auth/portal-auth-gate";
import { PortalShell } from "@/components/layout/portal-shell";
import { StudentPageLoading } from "@/components/student/portal/student-portal-states";
import { adminNav } from "@/lib/navigation";
import {
  filterAdminNavForRole,
  getAdminPortalTitle,
  isAdminOnlyRoute,
  isSuperAdminOnlyRoute,
} from "@/lib/admin-access";
import { useAuth } from "@/providers/auth-provider";

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const blocked =
    (!loading && user?.role === "teacher" && isAdminOnlyRoute(pathname)) ||
    (!loading && user?.role !== "super_admin" && isSuperAdminOnlyRoute(pathname));

  useEffect(() => {
    if (loading || !user) return;
    if (user.role === "teacher" && isAdminOnlyRoute(pathname)) {
      router.replace("/academics/dashboard");
      return;
    }
    if (user.role !== "super_admin" && isSuperAdminOnlyRoute(pathname)) {
      router.replace("/admin/dashboard");
    }
  }, [user, loading, pathname, router]);

  if (blocked) {
    return <StudentPageLoading rows={2} />;
  }

  return <>{children}</>;
}

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const navItems = useMemo(
    () => filterAdminNavForRole(adminNav, user?.role),
    [user?.role]
  );

  return (
    <PortalShell navItems={navItems} variant="admin" title={getAdminPortalTitle(user?.role)}>
      <PortalAuthGate allowedRoles={["admin", "super_admin", "teacher"]} loginHref="/login/admin">
        <AdminLayoutInner>{children}</AdminLayoutInner>
      </PortalAuthGate>
    </PortalShell>
  );
}
