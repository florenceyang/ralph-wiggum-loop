import React from 'react';
import HabitCell from './HabitCell';

export type Habit = {
  id: string;
  name: string;
  icon: string;
  color: string;
  order?: number;
};

export type HabitTableProps = {
  habits: Habit[];
  month: string; // YYYY-MM
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

export const HabitTable: React.FC<HabitTableProps> = ({ habits, month, onToggle }) => {
  const days = daysInMonth(month);

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
            {days.map((d) => (
              <td key={d} style={{ padding: 4 }}>
                <HabitCell
                  date={d}
                  marked={false}
                  icon={h.icon}
                  color={h.color}
                  onToggle={(date) => onToggle && onToggle(h.id, date)}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default HabitTable;
