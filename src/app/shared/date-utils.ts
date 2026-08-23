/** Formats a Date as a local (not UTC) yyyy-MM-dd string, matching the backend's `date` fields. */
export function toDateOnlyString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Orders items with `date` (yyyy-MM-dd) and `startTime` (HH:mm:ss) fields soonest-first. Both
 * formats sort correctly as plain strings, so no Date parsing is needed.
 */
export function compareBySoonest<T extends { date: string; startTime: string }>(a: T, b: T): number {
  return a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date);
}

/** Whether a `yyyy-MM-dd` date string is the current local calendar day (feature 010). */
export function isToday(dateStr: string): boolean {
  return dateStr === toDateOnlyString(new Date());
}

/**
 * Whether a `yyyy-MM-dd` date string falls within the next `days` local calendar days, counting
 * today as day 1 — e.g. `days=7` covers today through 6 days from now, inclusive (feature 010).
 * `yyyy-MM-dd` sorts correctly as a plain string, so no Date parsing of `dateStr` itself is needed.
 */
export function isWithinNextDays(dateStr: string, days: number): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = toDateOnlyString(today);

  const end = new Date(today);
  end.setDate(end.getDate() + days - 1);
  const endStr = toDateOnlyString(end);

  return dateStr >= todayStr && dateStr <= endStr;
}

/** Whether a `yyyy-MM-dd` date string is strictly before the current local calendar day (feature 012). */
export function isPastDue(dateStr: string): boolean {
  return dateStr < toDateOnlyString(new Date());
}
