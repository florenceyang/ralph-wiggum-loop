import React from 'react';
import HabitCell from './HabitCell';

export type Habit = {
  id: string;
  name: string;
  icon: string;
  color: string;
  order?: number;
};

export type Entry = {
  id?: string;
  habit_id: string;
  date: string; // YYYY-MM-DD
  done: boolean;
};

export type HabitTableProps = {
  habits: Habit[];
  month: string; // YYYY-MM
  entries?: Entry[];
  onToggle?: (habitId: string, date: string) => void;
};

function daysInMonth(monthStr: string): string[] {
  const [y, m] = monthStr.split('-').map((s) => parseInt(s, 10));
  const date = new Date(y, m - 1, 1);
  const days = new Date(y, m, 0).getDate();
  const arr: string[] = [];
  for (let d = 1; d <= days; d++) {
    const iso = new Date(y, m - 1, d).toISOString().slice(0, 10);
    arr.push(iso);
  }
  return arr;
}

export const HabitTable: React.FC<HabitTableProps> = ({ habits, month, entries = [], onToggle }) => {
  const days = daysInMonth(month);

  // Build a quick lookup for marked entries (only those with done=true)
  const entriesSet = React.useMemo(() => {
    const s = new Set<string>();
    for (const e of entries) {
      if (e && e.done) s.add(`${e.habit_id}|${e.date}`);
    }
    return s;
  }, [entries]);

  return (
    <table role="table" aria-label="Habit table">
      <thead>
        <tr>
          <th>Habit</th>
          {days.map((d) => (
            <th key={d}>{new Date(d).getDate()}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {habits.map((h) => (
          <tr key={h.id}>
            <td>{h.name}</td>
            {days.map((d) => {
              const marked = entriesSet.has(`${h.id}|${d}`);
              return (
                <td key={d} style={{ padding: 4 }}>
                  <HabitCell
                    date={d}
                    marked={marked}
                    icon={h.icon}
                    color={h.color}
                    onToggle={(date) => onToggle && onToggle(h.id, date)}
                  />
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default HabitTable;
