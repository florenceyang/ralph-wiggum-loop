import React from 'react';

import type { Habit as HabitType, Entry as EntryType } from './HabitTable';
import { daysInMonth } from '../lib/date';
import HabitIcon from './HabitIcon';

export type CalendarViewProps = {
  month: string; // YYYY-MM
  habits: HabitType[];
  entries?: EntryType[];
  activeIds?: Set<string> | null; // null/undefined = all active
  onDayClick?: (date: string) => void;
  /** Clicking an individual habit marker inside a day cell — jumps back to that habit's row/day. */
  onMarkerClick?: (habitId: string, date: string) => void;
};

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const CalendarView: React.FC<CalendarViewProps> = ({
  month,
  habits,
  entries = [],
  activeIds,
  onDayClick,
  onMarkerClick,
}) => {
  const days = daysInMonth(month);
  // Local weekday of day 1 (0=Sun..6=Sat) so the grid aligns real dates
  // under the correct weekday column instead of just flowing 7-per-row.
  const leadingBlanks = days.length ? new Date(days[0]).getDay() : 0;

  const byDate = React.useMemo(() => {
    const m: Record<string, { habitIds: string[]; entries: EntryType[] }> = {};
    for (const d of days) m[d] = { habitIds: [], entries: [] };
    for (const e of entries) {
      if (!e || !e.date) continue;
      if (activeIds && !activeIds.has(e.habit_id)) continue;
      if (!m[e.date]) m[e.date] = { habitIds: [], entries: [] };
      if (e.done) m[e.date].habitIds.push(e.habit_id);
      m[e.date].entries.push(e);
    }
    return m;
  }, [entries, days, activeIds]);

  const habitById = React.useMemo(() => {
    const map: Record<string, HabitType> = {};
    for (const h of habits) map[h.id] = h;
    return map;
  }, [habits]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="grid grid-cols-7 gap-1 pb-1 text-center text-xs font-medium text-slate-500" role="row">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>
      <div role="grid" aria-label={`Calendar for ${month}`} className="grid grid-cols-7 gap-1">
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <div key={`blank-${i}`} aria-hidden="true" />
        ))}
        {days.map((d) => {
          const data = byDate[d] || { habitIds: [], entries: [] };
          const unique = Array.from(new Set(data.habitIds));
          const visible = unique.slice(0, 4);
          const overflow = Math.max(0, unique.length - visible.length);

          return (
            <div
              key={d}
              role="gridcell"
              tabIndex={0}
              aria-label={`Day ${d} — ${unique.length} habits marked`}
              onClick={() => onDayClick && onDayClick(d)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onDayClick && onDayClick(d);
                }
              }}
              className="flex min-h-[64px] flex-col items-start justify-start rounded-lg border border-slate-200 bg-white p-2 text-left transition-colors cursor-pointer hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              data-testid={`calendar-day-${d}`}
            >
              <div className="text-xs text-slate-600">{new Date(d).getDate()}</div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {visible.map((hid) => {
                  const h = habitById[hid];
                  if (!h) return null;
                  return (
                    <button
                      key={hid}
                      type="button"
                      title={h.name}
                      aria-label={`Jump to ${h.name} on ${d}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkerClick && onMarkerClick(hid, d);
                      }}
                      className="inline-flex h-5 w-5 items-center justify-center rounded shadow-[0_0_0_1px_rgba(0,0,0,0.04)_inset] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                      style={{ background: h.color }}
                      data-testid={`calendar-icon-${d}-${hid}`}
                    >
                      <HabitIcon icon={h.icon} color="#fff" size={12} />
                    </button>
                  );
                })}

                {overflow > 0 && (
                  <span className="text-xs text-slate-500" data-testid={`calendar-overflow-${d}`}>
                    +{overflow}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;
