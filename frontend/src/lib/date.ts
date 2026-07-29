/**
 * Shared local-date helpers.
 *
 * `Date#toISOString()` always converts to UTC, so building a `YYYY-MM-DD` key
 * via `new Date(y, m - 1, d).toISOString().slice(0, 10)` silently shifts the
 * date by a day for any timezone with a non-zero UTC offset (e.g. a local
 * midnight becomes the previous day in UTC+ zones, and vice versa). Habit
 * entries are keyed by the user's local calendar day, so all day-key
 * generation must stay in local time and never round-trip through UTC.
 */

/** Formats a local Date as a `YYYY-MM-DD` string using its local fields. */
export function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Returns every `YYYY-MM-DD` day key in a given `YYYY-MM` month, in local time. */
export function daysInMonth(monthStr: string): string[] {
  const [y, m] = monthStr.split('-').map((s) => parseInt(s, 10));
  const numDays = new Date(y, m, 0).getDate();
  const arr: string[] = [];
  for (let d = 1; d <= numDays; d++) {
    arr.push(formatLocalDate(new Date(y, m - 1, d)));
  }
  return arr;
}
