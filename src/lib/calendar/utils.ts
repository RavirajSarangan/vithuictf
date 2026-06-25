import type { CalendarSession, SubjectCategory } from "@/types";

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function computeDurationMinutes(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return 0;
  return Math.max(0, eh * 60 + em - (sh * 60 + sm));
}

export function formatMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatTime12(time: string): string {
  const [h, m] = time.slice(0, 5).split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function sessionsForDay(sessions: CalendarSession[], day: number): CalendarSession[] {
  return sessions
    .filter((s) => s.sessionType === "recurring" && s.dayOfWeek === day)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export function sessionsForToday(sessions: CalendarSession[]): CalendarSession[] {
  const today = new Date();
  const dow = today.getDay();
  const dateStr = today.toISOString().slice(0, 10);
  return sessions
    .filter(
      (s) =>
        (s.sessionType === "recurring" && s.dayOfWeek === dow) ||
        (s.sessionType === "one_off" && s.sessionDate === dateStr)
    )
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export function oneOffSessionsForMonth(sessions: CalendarSession[], year: number, month: number): CalendarSession[] {
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  return sessions.filter((s) => s.sessionType === "one_off" && s.sessionDate?.startsWith(prefix));
}

export function dateKey(year: number, month: number, day: number): string {
  return `${year}-${month}-${day}`;
}

export function sessionsForDate(sessions: CalendarSession[], date: Date): CalendarSession[] {
  const dow = date.getDay();
  const dateStr = date.toISOString().slice(0, 10);
  return sessions
    .filter(
      (s) =>
        (s.sessionType === "recurring" && s.dayOfWeek === dow) ||
        (s.sessionType === "one_off" && s.sessionDate === dateStr)
    )
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export interface MinutesByCategory {
  categoryId: string;
  categoryName: string;
  color: string;
  minutes: number;
}

export function summarizeWeeklyMinutes(
  sessions: CalendarSession[],
  categories: SubjectCategory[],
  categoryFilter?: string
): { total: number; byCategory: MinutesByCategory[] } {
  const recurring = sessions.filter((s) => s.sessionType === "recurring");
  const filtered = categoryFilter && categoryFilter !== "all"
    ? recurring.filter((s) => s.categoryId === categoryFilter)
    : recurring;

  const byId = new Map<string, number>();
  for (const s of filtered) {
    byId.set(s.categoryId, (byId.get(s.categoryId) ?? 0) + s.durationMinutes);
  }

  const byCategory: MinutesByCategory[] = categories
    .filter((c) => c.active && byId.has(c.id))
    .map((c) => ({
      categoryId: c.id,
      categoryName: c.name,
      color: c.color,
      minutes: byId.get(c.id) ?? 0,
    }))
    .sort((a, b) => b.minutes - a.minutes);

  const total = byCategory.reduce((sum, row) => sum + row.minutes, 0);
  return { total, byCategory };
}
