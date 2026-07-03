import { getActionErrorMessage } from "@/lib/action-error";

export type ActionResult<T extends object | undefined = undefined> =
  | (T extends undefined ? { ok: true } : { ok: true } & T)
  | { ok: false; error: string };

export type DataActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function getActionFailureMessage(error: unknown, fallback: string): string {
  return getActionErrorMessage(error, fallback);
}

export function actionFailure(error: unknown, fallback: string): { ok: false; error: string } {
  return { ok: false, error: getActionFailureMessage(error, fallback) };
}

export async function runDataAction<T>(
  fn: () => Promise<T>,
  fallback: string
): Promise<DataActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    return { ok: false, error: getActionFailureMessage(error, fallback) };
  }
}

export function actionSuccess(): { ok: true } {
  return { ok: true };
}

export function formatAccountRole(role: string): string {
  switch (role) {
    case "super_admin":
      return "super administrator";
    case "admin":
      return "administrator";
    case "teacher":
      return "staff member";
    case "content_manager":
      return "content team member";
    case "paper_center_staff":
      return "paper center staff";
    case "student":
      return "student";
    case "parent":
      return "parent";
    default:
      return role.replace(/_/g, " ");
  }
}
