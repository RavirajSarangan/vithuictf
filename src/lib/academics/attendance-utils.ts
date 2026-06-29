import type { ClassSession } from "@/types";

/** Prefer today's class, then next upcoming, then most recent. */
export function pickDefaultAttendanceSession(sessions: ClassSession[]): string | null {
  if (!sessions.length) return null;

  const today = new Date().toISOString().slice(0, 10);
  const active = sessions.filter((s) => s.status !== "cancelled");

  const todaySession = active.find((s) => s.scheduledDate === today);
  if (todaySession) return todaySession.id;

  const upcoming = [...active]
    .filter((s) => s.scheduledDate >= today)
    .sort(
      (a, b) =>
        a.scheduledDate.localeCompare(b.scheduledDate) || a.sessionNumber - b.sessionNumber
    );
  if (upcoming[0]) return upcoming[0].id;

  const recent = [...active].sort(
    (a, b) =>
      b.scheduledDate.localeCompare(a.scheduledDate) || b.sessionNumber - a.sessionNumber
  );
  return recent[0]?.id ?? sessions[0]?.id ?? null;
}
