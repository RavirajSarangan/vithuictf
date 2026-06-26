"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PortalShell } from "@/components/layout/portal-shell";
import { adminNav } from "@/lib/navigation";
import { filterAdminNavForRole, getAdminPortalTitle, isAdminOnlyRoute } from "@/lib/admin-access";
import { useAuth } from "@/providers/auth-provider";
import { AuthLayoutProvider } from "@/providers/auth-layout-provider";

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, loading, refreshUser } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const navItems = useMemo(
    () => filterAdminNavForRole(adminNav, user?.role),
    [user?.role]
  );

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (loading || !user) return;
    if (user.role === "teacher" && isAdminOnlyRoute(pathname)) {
      router.replace("/admin/dashboard");
    }
  }, [user, loading, pathname, router]);

  if (!loading && user?.role === "teacher" && isAdminOnlyRoute(pathname)) {
    return null;
  }

  return (
    <PortalShell navItems={navItems} variant="admin" title={getAdminPortalTitle(user?.role)}>
      {children}
    </PortalShell>
  );
}

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <AuthLayoutProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AuthLayoutProvider>
  );
}
