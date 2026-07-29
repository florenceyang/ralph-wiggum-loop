import React from 'react';
import HabitCell, { ArrowKey } from './HabitCell';
import { daysInMonth } from '../lib/date';

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

  // Roving tabindex: only one grid cell is tab-stoppable at a time; arrow
  // keys move both focus and the active cell between habit rows/day columns.
  const [activeCell, setActiveCell] = React.useState({ row: 0, col: 0 });
  const cellRefs = React.useRef<(HTMLButtonElement | null)[][]>([]);

  const focusCell = (row: number, col: number) => {
    const clampedRow = Math.max(0, Math.min(habits.length - 1, row));
    const clampedCol = Math.max(0, Math.min(days.length - 1, col));
    // Focusing the target cell triggers its onFocus handler, which updates
    // activeCell — avoid a redundant setState here.
    cellRefs.current[clampedRow]?.[clampedCol]?.focus();
  };

  // Keep the active cell within bounds if habits/days shrink (e.g. a habit
  // is deleted or the month changes), so a tab stop always exists.
  React.useEffect(() => {
    setActiveCell((prev) => ({
      row: Math.min(prev.row, Math.max(0, habits.length - 1)),
      col: Math.min(prev.col, Math.max(0, days.length - 1)),
    }));
  }, [habits.length, days.length]);

  const handleArrow = (row: number, col: number, key: ArrowKey) => {
    switch (key) {
      case 'ArrowUp':
        focusCell(row - 1, col);
        break;
      case 'ArrowDown':
        focusCell(row + 1, col);
        break;
      case 'ArrowLeft':
        focusCell(row, col - 1);
        break;
      case 'ArrowRight':
        focusCell(row, col + 1);
        break;
      case 'Home':
        focusCell(row, 0);
        break;
      case 'End':
        focusCell(row, days.length - 1);
        break;
      default:
        break;
    }
  };

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
        {habits.map((h, hIdx) => (
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
            {days.map((d, dIdx) => {
              const marked = entriesSet.has(`${h.id}|${d}`);
              const highlighted = highlightDate === d;
              const isActive = activeCell.row === hIdx && activeCell.col === dIdx;
              return (
                <td key={d} style={{ padding: 4, background: highlighted ? '#eff6ff' : undefined }}>
                  <HabitCell
                    ref={(el) => {
                      if (!cellRefs.current[hIdx]) cellRefs.current[hIdx] = [];
                      cellRefs.current[hIdx][dIdx] = el;
                    }}
                    date={d}
                    marked={marked}
                    icon={h.icon}
                    color={h.color}
                    name={h.name}
                    tabIndex={isActive ? 0 : -1}
                    onToggle={(date) => onToggle && onToggle(h.id, date)}
                    onArrow={(_date, key) => handleArrow(hIdx, dIdx, key)}
                    onFocusCell={() => setActiveCell({ row: hIdx, col: dIdx })}
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
