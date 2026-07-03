const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

export type BatchScheduleInput = {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  classDays: string[];
  totalClasses?: number;
};

export type PlannedSession = {
  sessionNumber: number;
  scheduledDate: string;
  startTime: string;
  endTime: string;
};

function parseDateOnly(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDateOnly(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function countClassDaysInRange(input: {
  startDate: string;
  endDate: string;
  classDays: string[];
}): number {
  const classDays = new Set(input.classDays.map((d) => d.toLowerCase()));
  let count = 0;
  const cursor = parseDateOnly(input.startDate);
  const end = parseDateOnly(input.endDate);

  while (cursor <= end) {
    const dayKey = WEEKDAY_KEYS[cursor.getDay()];
    if (classDays.has(dayKey)) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }

  return count;
}

export function buildSessionSchedule(input: BatchScheduleInput): PlannedSession[] {
  const classDays = new Set(input.classDays.map((d) => d.toLowerCase()));
  const sessions: PlannedSession[] = [];
  const cap = input.totalClasses ?? Number.MAX_SAFE_INTEGER;

  let sessionNumber = 1;
  const cursor = parseDateOnly(input.startDate);
  const end = parseDateOnly(input.endDate);

  while (cursor <= end && sessionNumber <= cap) {
    const dayKey = WEEKDAY_KEYS[cursor.getDay()];
    if (classDays.has(dayKey)) {
      sessions.push({
        sessionNumber,
        scheduledDate: formatDateOnly(cursor),
        startTime: input.startTime,
        endTime: input.endTime,
      });
      sessionNumber += 1;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return sessions;
}

/**
 * Walk forward from `startDate` over the selected `classDays` and return the
 * date (YYYY-MM-DD) of the Nth class. This is the inverse of the range-based
 * scheduler: callers supply a start date + class count and we derive the end
 * date so the rest of the engine (which is range-based) keeps working unchanged.
 *
 * Returns null when no class days are selected or the count is non-positive.
 */
export function deriveEndDateFromCount(input: {
  startDate: string;
  classDays: string[];
  totalClasses: number;
}): string | null {
  const classDays = new Set(input.classDays.map((d) => d.toLowerCase()));
  if (classDays.size === 0 || input.totalClasses <= 0) return null;

  const cursor = parseDateOnly(input.startDate);
  // Safety cap so an unreachable schedule can never loop forever.
  const hardStop = parseDateOnly(input.startDate);
  hardStop.setFullYear(hardStop.getFullYear() + 2);

  let matched = 0;
  while (cursor <= hardStop) {
    const dayKey = WEEKDAY_KEYS[cursor.getDay()];
    if (classDays.has(dayKey)) {
      matched += 1;
      if (matched >= input.totalClasses) return formatDateOnly(cursor);
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return null;
}

export function computeTotalClasses(input: BatchScheduleInput): number {
  const inRange = countClassDaysInRange(input);
  if (inRange === 0) return 0;
  return input.totalClasses !== undefined ? Math.min(input.totalClasses, inRange) : inRange;
}

export function scheduleSummary(input: BatchScheduleInput): {
  totalClasses: number;
  firstDate: string | null;
  lastDate: string | null;
} {
  const totalClasses = computeTotalClasses(input);
  const sessions = buildSessionSchedule({ ...input, totalClasses });
  return {
    totalClasses: sessions.length,
    firstDate: sessions[0]?.scheduledDate ?? null,
    lastDate: sessions[sessions.length - 1]?.scheduledDate ?? null,
  };
}

/** DB row shape used by server sync */
export function buildSessionScheduleFromRow(batch: {
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  class_days: string[];
  total_classes: number;
}): Array<{
  session_number: number;
  scheduled_date: string;
  start_time: string;
  end_time: string;
}> {
  return buildSessionSchedule({
    startDate: batch.start_date,
    endDate: batch.end_date,
    startTime: batch.start_time,
    endTime: batch.end_time,
    classDays: batch.class_days,
    totalClasses: batch.total_classes,
  }).map((s) => ({
    session_number: s.sessionNumber,
    scheduled_date: s.scheduledDate,
    start_time: s.startTime,
    end_time: s.endTime,
  }));
}
