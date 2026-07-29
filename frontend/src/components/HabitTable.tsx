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
  onRename?: (habitId: string, name: string) => void;
  onDelete?: (habitId: string) => void;
  highlightDate?: string | null;
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

export const HabitTable: React.FC<HabitTableProps> = ({
  habits,
  month,
  entries = [],
  onToggle,
  onRename,
  onDelete,
  highlightDate,
}) => {
  const days = daysInMonth(month);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draftName, setDraftName] = React.useState('');

  const startEditing = (h: Habit) => {
    if (!onRename) return;
    setEditingId(h.id);
    setDraftName(h.name);
  };

  const commitEditing = () => {
    if (editingId && onRename && draftName.trim()) {
      onRename(editingId, draftName.trim());
    }
    setEditingId(null);
  };

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
          {days.map((d) => {
            const dt = new Date(d);
            const label = dt.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
            const highlighted = highlightDate === d;
            return (
              <th
                key={d}
                scope="col"
                aria-label={d}
                title={label}
                data-testid={`habit-table-col-${d}`}
                style={highlighted ? { background: '#eff6ff' } : undefined}
              >
                {label}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {habits.map((h) => (
          <tr key={h.id}>
            <td>
              {editingId === h.id ? (
                <input
                  autoFocus
                  aria-label={`Rename ${h.name}`}
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onBlur={commitEditing}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitEditing();
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  data-testid={`habit-rename-input-${h.id}`}
                />
              ) : (
                <span onDoubleClick={() => startEditing(h)} data-testid={`habit-name-${h.id}`}>
                  {h.name}
                </span>
              )}
              {onDelete && (
                <button
                  type="button"
                  aria-label={`Delete ${h.name}`}
                  onClick={() => onDelete(h.id)}
                  data-testid={`habit-delete-${h.id}`}
                  style={{ marginLeft: 6, fontSize: 11 }}
                >
                  ✕
                </button>
              )}
            </td>
            {days.map((d) => {
              const marked = entriesSet.has(`${h.id}|${d}`);
              const highlighted = highlightDate === d;
              return (
                <td key={d} style={{ padding: 4, background: highlighted ? '#eff6ff' : undefined }}>
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
