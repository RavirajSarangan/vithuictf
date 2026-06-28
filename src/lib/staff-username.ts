import { normalizeUsername, USERNAME_PATTERN } from "@/lib/validation/register-student";

export function normalizeStaffUsername(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
}

export function deriveStaffUsername(email: string, displayName: string, provided?: string): string {
  const fromProvided = provided?.trim().toLowerCase().replace(/[^a-z0-9_]/g, "") ?? "";
  if (fromProvided && USERNAME_PATTERN.test(fromProvided)) return fromProvided;

  const fromEmail = email.split("@")[0]?.toLowerCase().replace(/[^a-z0-9_]/g, "") ?? "";
  if (fromEmail.length >= 3 && USERNAME_PATTERN.test(fromEmail)) return fromEmail;

  const fromName = normalizeUsername(displayName);
  if (USERNAME_PATTERN.test(fromName)) return fromName;

  throw new Error("Could not generate a valid staff username. Enter one manually.");
}
