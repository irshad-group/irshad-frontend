/**
 * The structured working-hours schedule on `directorates.working_hours`.
 *
 * Stored as JSON: an array of `{ day, from, to, note? }`, one entry per day,
 * `from`/`to` as `HH:MM`, and `null` times meaning closed that day. Day names
 * are stored as codes and translated by the UI — the whole point of the
 * structure is that the value itself carries no language.
 *
 * The value is staff-entered JSON, so nothing about its shape can be trusted:
 * parsing is defensive and anything malformed is dropped rather than rendered.
 */

export const DAY_CODES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;
export type DayCode = (typeof DAY_CODES)[number];

export type WorkingDay = {
  day: DayCode;
  /** `HH:MM`, or null when the office is closed that day. */
  from: string | null;
  to: string | null;
  note: string | null;
};

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

function asTime(value: unknown): string | null {
  return typeof value === 'string' && TIME.test(value) ? value : null;
}

/**
 * Validate a raw `working_hours` value into an ordered week.
 *
 * Entries with an unknown day are dropped, duplicate days keep the first
 * entry, and a day missing both times is closed. Returns `null` when nothing
 * usable remains, so callers can fall back to showing nothing at all.
 */
export function parseWorkingHours(value: unknown): WorkingDay[] | null {
  if (!Array.isArray(value)) return null;

  const byDay = new Map<DayCode, WorkingDay>();
  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null) continue;
    const raw = entry as Record<string, unknown>;
    const day =
      typeof raw.day === 'string' ? (raw.day.toUpperCase() as DayCode) : undefined;
    if (!day || !DAY_CODES.includes(day) || byDay.has(day)) continue;

    const from = asTime(raw.from);
    const to = asTime(raw.to);
    byDay.set(day, {
      day,
      // A range needs both ends; half a range is treated as closed rather
      // than guessed at.
      from: from && to ? from : null,
      to: from && to ? to : null,
      note: typeof raw.note === 'string' && raw.note.trim() ? raw.note.trim() : null,
    });
  }

  if (byDay.size === 0) return null;
  return DAY_CODES.filter((day) => byDay.has(day)).map((day) => byDay.get(day)!);
}

export type ScheduleGroup = {
  days: DayCode[];
  from: string | null;
  to: string | null;
  note: string | null;
};

/**
 * Collapse consecutive days with identical hours into ranges, so a standard
 * week renders as "Sun–Thu 08:00–14:00 · Fri–Sat closed" instead of seven
 * rows. Grouping follows the order `parseWorkingHours` returns.
 */
export function groupSchedule(days: WorkingDay[]): ScheduleGroup[] {
  const groups: ScheduleGroup[] = [];
  for (const day of days) {
    const last = groups[groups.length - 1];
    if (last && last.from === day.from && last.to === day.to && last.note === day.note) {
      last.days.push(day.day);
    } else {
      groups.push({ days: [day.day], from: day.from, to: day.to, note: day.note });
    }
  }
  return groups;
}
