"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PortalAuthGate } from "@/components/auth/portal-auth-gate";
import { PortalShell } from "@/components/layout/portal-shell";
import { PortalShellLoading } from "@/components/layout/portal-shell-loading";
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

  const navItems = useMemo(
    () => filterAdminNavForRole(adminNav, user?.role),
    [user?.role]
  );

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

  const blocked =
    (!loading && user?.role === "teacher" && isAdminOnlyRoute(pathname)) ||
    (!loading && user?.role !== "super_admin" && isSuperAdminOnlyRoute(pathname));

  if (blocked) {
    return <PortalShellLoading rows={2} />;
  }

  return (
    <PortalShell navItems={navItems} variant="admin" title={getAdminPortalTitle(user?.role)}>
      {children}
    </PortalShell>
  );
}

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <PortalAuthGate allowedRoles={["admin", "super_admin", "teacher"]} loginHref="/login/admin">
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </PortalAuthGate>
  );
}
