import type { NavItem } from "@/components/layout/portal-shell";
import type { UserRole } from "@/types";

/** Routes restricted to admin/super_admin (teachers are redirected). */
export const ADMIN_ONLY_ROUTES = [
  "/admin/people",
  "/admin/staff",
  "/admin/notifications",
  "/admin/home",
  "/admin/blog",
  "/admin/social-tracking",
  "/admin/content-team",
  "/admin/finance",
] as const;

/** Routes restricted to super_admin only. */
export const SUPER_ADMIN_ONLY_ROUTES = [
  "/admin/pass-papers",
  "/admin/exam-papers",
  "/admin/paper-centers",
] as const;

const adminOnlyHrefs = new Set<string>(ADMIN_ONLY_ROUTES);
const superAdminOnlyHrefs = new Set<string>(SUPER_ADMIN_ONLY_ROUTES);

export function isAdminOnlyRoute(pathname: string): boolean {
  return ADMIN_ONLY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export function isSuperAdminOnlyRoute(pathname: string): boolean {
  return SUPER_ADMIN_ONLY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export function isRestrictedAdminRoute(pathname: string): boolean {
  return isAdminOnlyRoute(pathname) || isSuperAdminOnlyRoute(pathname);
}

export function filterAdminNavForRole(navItems: NavItem[], role: UserRole | undefined): NavItem[] {
  let items = navItems;
  if (role === "teacher") {
    items = items.filter((item) => !adminOnlyHrefs.has(item.href));
  }
  if (role !== "super_admin") {
    items = items.filter((item) => !superAdminOnlyHrefs.has(item.href));
  }
  return items;
}

export function getAdminPortalTitle(role: UserRole | undefined): string {
  if (role === "super_admin") return "Super Admin Portal";
  if (role === "admin") return "Admin Portal";
  if (role === "teacher") return "Staff Portal";
  return "Staff Portal";
}

/** @deprecated Use getAdminPortalTitle */
export function getStaffPortalTitle(role: UserRole | undefined): string {
  return getAdminPortalTitle(role);
}

export function canManageAdmins(role: UserRole | undefined): boolean {
  return role === "super_admin";
}

export function canCreateAdmins(role: UserRole | undefined): boolean {
  return role === "admin" || role === "super_admin";
}
