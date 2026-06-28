export type ActionResult<T extends object | undefined = undefined> =
  | (T extends undefined ? { ok: true } : { ok: true } & T)
  | { ok: false; error: string };

export function actionFailure(error: unknown, fallback: string): { ok: false; error: string } {
  return { ok: false, error: error instanceof Error ? error.message : fallback };
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
