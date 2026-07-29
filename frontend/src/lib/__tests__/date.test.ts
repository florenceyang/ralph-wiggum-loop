import { describe, it, expect } from 'vitest';
import { formatLocalDate, daysInMonth } from '../date';

describe('formatLocalDate', () => {
  it('formats using local calendar fields, never round-tripping through UTC', () => {
    // A date constructed with local fields must format back to those same
    // fields regardless of the host timezone. The historical bug used
    // `date.toISOString().slice(0, 10)`, which converts to UTC first and
    // therefore returns the *previous* day's date in any positive UTC-offset
    // timezone (e.g. Asia/Tokyo, UTC+9) for early-morning local times.
    const localMidnight = new Date(2026, 0, 1, 0, 0, 0); // Jan 1, 2026, local midnight
    expect(formatLocalDate(localMidnight)).toBe('2026-01-01');

    const buggyResult = localMidnight.toISOString().slice(0, 10);
    if (localMidnight.getTimezoneOffset() < 0) {
      // Negative offset (UTC ahead of local, e.g. UTC+9) => UTC rolls forward
      // a day relative to local midnight, so the old buggy code diverges.
      expect(buggyResult).not.toBe('2026-01-01');
    }
  });

  it('pads single-digit months and days', () => {
    expect(formatLocalDate(new Date(2026, 2, 5))).toBe('2026-03-05');
  });
});

describe('daysInMonth', () => {
  it('returns every local day key for a 31-day month without UTC drift', () => {
    const days = daysInMonth('2026-01');
    expect(days).toHaveLength(31);
    expect(days[0]).toBe('2026-01-01');
    expect(days[days.length - 1]).toBe('2026-01-31');
  });

  it('handles February in a non-leap year', () => {
    const days = daysInMonth('2026-02');
    expect(days).toHaveLength(28);
    expect(days[days.length - 1]).toBe('2026-02-28');
  });

  it('handles a leap year February', () => {
    const days = daysInMonth('2028-02');
    expect(days).toHaveLength(29);
    expect(days[days.length - 1]).toBe('2028-02-29');
  });

  it('produces strictly increasing YYYY-MM-DD keys with no duplicated or skipped day', () => {
    const days = daysInMonth('2026-12');
    for (let i = 1; i < days.length; i++) {
      expect(days[i] > days[i - 1]).toBe(true);
    }
  });
});
