import React from 'react';

import type { Habit as HabitType, Entry as EntryType } from './HabitTable';

export type CalendarViewProps = {
  month: string; // YYYY-MM
  habits: HabitType[];
  entries?: EntryType[];
  onDayClick?: (date: string) => void;
};

function daysInMonth(monthStr: string): string[] {
  const [y, m] = monthStr.split('-').map((s) => parseInt(s, 10));
  const days = new Date(y, m, 0).getDate();
  const arr: string[] = [];
  for (let d = 1; d <= days; d++) {
    const iso = new Date(y, m - 1, d).toISOString().slice(0, 10);
    arr.push(iso);
  }
  return arr;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ month, habits, entries = [], onDayClick }) => {
  const days = daysInMonth(month);

  const byDate = React.useMemo(() => {
    const m: Record<string, { habitIds: string[]; entries: EntryType[] }> = {};
    for (const d of days) m[d] = { habitIds: [], entries: [] };
    for (const e of entries) {
      if (!e || !e.date) continue;
      if (!m[e.date]) m[e.date] = { habitIds: [], entries: [] };
      if (e.done) m[e.date].habitIds.push(e.habit_id);
      m[e.date].entries.push(e);
    }
    return m;
  }, [entries, days]);

  const habitById = React.useMemo(() => {
    const map: Record<string, HabitType> = {};
    for (const h of habits) map[h.id] = h;
    return map;
  }, [habits]);

  return (
    <div role="grid" aria-label={`Calendar for ${month}`} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
      {days.map((d) => {
        const data = byDate[d] || { habitIds: [], entries: [] };
        const unique = Array.from(new Set(data.habitIds));
        const visible = unique.slice(0, 4);
        const overflow = Math.max(0, unique.length - visible.length);

        return (
          <button
            key={d}
            type="button"
            role="gridcell"
            aria-label={`Day ${d} — ${unique.length} habits marked`}
            onClick={() => onDayClick && onDayClick(d)}
            style={{
              minHeight: 64,
              padding: 8,
              border: '1px solid #e5e7eb',
              background: '#fff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
              cursor: 'pointer',
            }}
            data-testid={`calendar-day-${d}`}
          >
            <div style={{ fontSize: 12, color: '#374151' }}>{new Date(d).getDate()}</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
              {visible.map((hid) => {
                const h = habitById[hid];
                if (!h) return null;
                const glyph = h.icon ? h.icon.charAt(0).toUpperCase() : '●';
                return (
                  <span
                    key={hid}
                    title={h.name}
                    aria-hidden={false}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      background: h.color,
                      color: '#fff',
                      fontSize: 12,
                      boxShadow: '0 0 0 1px rgba(0,0,0,0.04) inset',
                    }}
                    data-testid={`calendar-icon-${d}-${hid}`}
                  >
                    {glyph}
                  </span>
                );
              })}

              {overflow > 0 && (
                <span style={{ fontSize: 12, color: '#6b7280' }} data-testid={`calendar-overflow-${d}`}>
                  +{overflow}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default CalendarView;
