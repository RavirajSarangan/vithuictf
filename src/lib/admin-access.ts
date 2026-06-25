import type { NavItem } from "@/components/layout/portal-shell";
import type { UserRole } from "@/types";

/** Routes restricted to admin role (teachers are redirected). */
export const ADMIN_ONLY_ROUTES = [
  "/admin/teachers",
  "/admin/notifications",
  "/admin/home",
] as const;

const adminOnlyHrefs = new Set<string>(ADMIN_ONLY_ROUTES);

export function isAdminOnlyRoute(pathname: string): boolean {
  return ADMIN_ONLY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export function filterAdminNavForRole(navItems: NavItem[], role: UserRole | undefined): NavItem[] {
  if (role === "admin") return navItems;
  return navItems.filter((item) => !adminOnlyHrefs.has(item.href));
}

export function getStaffPortalTitle(role: UserRole | undefined): string {
  return role === "admin" ? "Admin Portal" : "Staff Portal";
}
