import type { NavItem } from "@/components/layout/portal-shell";
import type { UserRole } from "@/types";

/** Routes restricted to admin role (teachers are redirected). */
export const ADMIN_ONLY_ROUTES = [
  "/admin/teachers",
  "/admin/notifications",
  "/admin/home",
  "/admin/blog",
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

export function getAdminPortalTitle(role: UserRole | undefined): string {
  if (role === "admin") return "Admin Portal";
  if (role === "teacher") return "Teacher Portal";
  return "Staff Portal";
}

/** @deprecated Use getAdminPortalTitle */
export function getStaffPortalTitle(role: UserRole | undefined): string {
  return getAdminPortalTitle(role);
}
