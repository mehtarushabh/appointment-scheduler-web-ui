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
