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
  /** Drag or Shift+Click/Arrow range marking: applies `done` to every date in `dates` for one habit in a single action. */
  onRangeToggle?: (habitId: string, dates: string[], done: boolean) => void;
  onRename?: (habitId: string, name: string) => void;
  onDelete?: (habitId: string) => void;
  highlightDate?: string | null;
};

type DragState = { row: number; startCol: number; currentCol: number; targetDone: boolean };
type ShiftAnchor = { row: number; col: number; targetDone: boolean };

export const HabitTable: React.FC<HabitTableProps> = ({
  habits,
  month,
  entries = [],
  onToggle,
  onRangeToggle,
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

  // Pointer-drag range marking: mousedown on a cell anchors a drag; dragging
  // across cells in the same row previews the range; mouseup (anywhere)
  // commits it as a single bulk action.
  const [dragState, setDragState] = React.useState<DragState | null>(null);
  // Keeps dragState readable synchronously outside React's render cycle (the
  // window 'mouseup' listener needs the latest value without triggering a
  // "setState during another component's render" warning from committing the
  // range inside setDragState's functional updater).
  const dragStateRef = React.useRef<DragState | null>(null);
  const updateDragState = (next: DragState | null) => {
    dragStateRef.current = next;
    setDragState(next);
  };
  // Shift+Click/Shift+Arrow range marking: remembers the anchor cell and the
  // target done-state for the current range-selection "session" so repeated
  // Shift+Arrow presses extend the same range instead of restarting it.
  const shiftAnchor = React.useRef<ShiftAnchor | null>(null);

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

  // Build a quick lookup for marked entries (only those with done=true)
  const entriesSet = React.useMemo(() => {
    const s = new Set<string>();
    for (const e of entries) {
      if (e && e.done) s.add(`${e.habit_id}|${e.date}`);
    }
    return s;
  }, [entries]);

  const isMarked = (row: number, col: number) => {
    const habit = habits[row];
    if (!habit) return false;
    return entriesSet.has(`${habit.id}|${days[col]}`);
  };

  const commitRange = (row: number, lo: number, hi: number, targetDone: boolean) => {
    const habit = habits[row];
    if (!habit || !onRangeToggle) return;
    onRangeToggle(habit.id, days.slice(lo, hi + 1), targetDone);
  };

  // Finalize a pointer-drag on mouseup anywhere in the document (the
  // pointer may be released outside the cell it started on).
  React.useEffect(() => {
    const handleMouseUp = () => {
      const prev = dragStateRef.current;
      if (prev && prev.currentCol !== prev.startCol) {
        const lo = Math.min(prev.startCol, prev.currentCol);
        const hi = Math.max(prev.startCol, prev.currentCol);
        commitRange(prev.row, lo, hi, prev.targetDone);
      }
      updateDragState(null);
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habits, days, onRangeToggle]);

  const handleCellMouseDown = (row: number, col: number) => {
    shiftAnchor.current = null;
    updateDragState({ row, startCol: col, currentCol: col, targetDone: !isMarked(row, col) });
  };

  const handleCellMouseEnter = (row: number, col: number) => {
    if (dragStateRef.current && dragStateRef.current.row === row) {
      updateDragState({ ...dragStateRef.current, currentCol: col });
    }
  };

  const handleShiftClick = (row: number, col: number) => {
    const anchorCol =
      shiftAnchor.current && shiftAnchor.current.row === row
        ? shiftAnchor.current.col
        : activeCell.row === row
          ? activeCell.col
          : col;
    const targetDone = !isMarked(row, col);
    const lo = Math.min(anchorCol, col);
    const hi = Math.max(anchorCol, col);
    commitRange(row, lo, hi, targetDone);
    shiftAnchor.current = { row, col: anchorCol, targetDone };
    focusCell(row, col);
  };

  const handleShiftArrow = (row: number, col: number, key: 'ArrowLeft' | 'ArrowRight') => {
    const delta = key === 'ArrowRight' ? 1 : -1;
    const newCol = Math.max(0, Math.min(days.length - 1, col + delta));
    const anchor: ShiftAnchor =
      shiftAnchor.current && shiftAnchor.current.row === row
        ? shiftAnchor.current
        : { row, col, targetDone: !isMarked(row, col) };
    const lo = Math.min(anchor.col, newCol);
    const hi = Math.max(anchor.col, newCol);
    commitRange(row, lo, hi, anchor.targetDone);
    shiftAnchor.current = anchor;
    focusCell(row, newCol);
  };

  const handleArrow = (row: number, col: number, key: ArrowKey) => {
    shiftAnchor.current = null;
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
              const inDragRange =
                dragState &&
                dragState.row === hIdx &&
                dIdx >= Math.min(dragState.startCol, dragState.currentCol) &&
                dIdx <= Math.max(dragState.startCol, dragState.currentCol);
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
                    previewDone={inDragRange ? dragState!.targetDone : undefined}
                    onToggle={(date) => {
                      shiftAnchor.current = null;
                      onToggle && onToggle(h.id, date);
                    }}
                    onShiftToggle={() => handleShiftClick(hIdx, dIdx)}
                    onArrow={(_date, key) => handleArrow(hIdx, dIdx, key)}
                    onShiftArrow={(_date, key) => handleShiftArrow(hIdx, dIdx, key)}
                    onCellMouseDown={() => handleCellMouseDown(hIdx, dIdx)}
                    onCellMouseEnter={() => handleCellMouseEnter(hIdx, dIdx)}
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
