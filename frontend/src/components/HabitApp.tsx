/**
 * HabitApp — top-level composition root for the Habit Tracker feature.
 *
 * Wires together the previously standalone (unit-tested but unmounted)
 * components — HabitEditor, HabitTable, CalendarView, Legend — with the
 * useHabits data hook so the real /habits page gets the full table+calendar
 * experience described in specs/habit-tracker-specifications.md, rather than
 * the minimal vanilla-JS CRUD list that templates/habits.html previously
 * shipped with. Mounted via the `habits` React Island
 * (frontend/src/islands/habits/) as a thin wrapper.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import HabitEditor from './HabitEditor';
import HabitTable, { type Habit } from './HabitTable';
import CalendarView from './CalendarView';
import Legend from './Legend';
import TodoBoard from './TodoBoard';
import useHabits from '../hooks/useHabits';

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map((s) => parseInt(s, 10));
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// A single (habitId, date) change captured with both its old and new `done`
// state, so it can be replayed forward (redo) or backward (undo).
type Change = { habitId: string; date: string; prevDone: boolean; nextDone: boolean };
// One user action (a single toggle, or a whole drag/Shift-range) undoes/redoes atomically.
type Action = Change[];

export const HabitApp: React.FC = () => {
  const { habits, entriesForMonth, ensureMonthLoaded, toggle, isDone, bulkSetEntries, addHabit, updateHabit, removeHabit } =
    useHabits();
  const [month, setMonth] = useState<string>(currentMonth());
  const [activeIds, setActiveIds] = useState<Set<string> | null>(null); // null = show all
  const [highlightDate, setHighlightDate] = useState<string | null>(null);
  // Habit currently open in the editor's edit mode (name/icon/color/order).
  // Double-click-to-rename still works as a quick shortcut, but this is the
  // full edit path — set via the row's "Edit" icon button.
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const undoStack = useRef<Action[]>([]);
  const redoStack = useRef<Action[]>([]);

  useEffect(() => {
    ensureMonthLoaded(month);
  }, [month, ensureMonthLoaded]);

  const entries = entriesForMonth(month);

  const visibleHabits = useMemo(
    () => (activeIds ? habits.filter((h) => activeIds.has(h.id)) : habits),
    [habits, activeIds],
  );

  const handleToggle = useCallback(
    (habitId: string, date: string) => {
      const prevDone = isDone(habitId, date);
      undoStack.current.push([{ habitId, date, prevDone, nextDone: !prevDone }]);
      redoStack.current = [];
      toggle(habitId, date);
    },
    [toggle, isDone],
  );

  // Drag or Shift+Click/Arrow range marking: records the whole range as one
  // undoable action and persists it in a single bulk request.
  const handleRangeToggle = useCallback(
    (habitId: string, dates: string[], done: boolean) => {
      const changes: Change[] = dates.map((date) => ({
        habitId,
        date,
        prevDone: isDone(habitId, date),
        nextDone: done,
      }));
      undoStack.current.push(changes);
      redoStack.current = [];
      bulkSetEntries(changes.map((c) => ({ habitId: c.habitId, date: c.date, done: c.nextDone }))).catch(() => {
        /* rollback handled inside useHabits */
      });
    },
    [bulkSetEntries, isDone],
  );

  const applyAction = useCallback(
    (action: Action, direction: 'prevDone' | 'nextDone') => {
      bulkSetEntries(action.map((c) => ({ habitId: c.habitId, date: c.date, done: c[direction] }))).catch(() => {
        /* rollback handled inside useHabits */
      });
    },
    [bulkSetEntries],
  );

  const handleUndo = useCallback(() => {
    const action = undoStack.current.pop();
    if (!action) return;
    redoStack.current.push(action);
    applyAction(action, 'prevDone');
  }, [applyAction]);

  const handleRedo = useCallback(() => {
    const action = redoStack.current.pop();
    if (!action) return;
    undoStack.current.push(action);
    applyAction(action, 'nextDone');
  }, [applyAction]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleUndo, handleRedo]);

  const handleLegendToggle = useCallback((habitId: string) => {
    setActiveIds((prev) => {
      // Starting from "all visible" (null), clicking one habit means "show
      // only this one"; clicking it again restores "show all".
      const base = prev ?? new Set(habits.map((h) => h.id));
      const next = new Set(base);
      if (next.has(habitId)) next.delete(habitId);
      else next.add(habitId);
      if (next.size === habits.length) return null;
      return next;
    });
  }, [habits]);

  const handleDayClick = useCallback((date: string) => {
    setHighlightDate((prev) => (prev === date ? null : date));
    const col = document.querySelector(`[data-testid="habit-table-col-${date}"]`);
    // jsdom (used in unit tests) doesn't implement scrollIntoView; guard for it.
    if (col && typeof (col as HTMLElement).scrollIntoView === 'function') {
      (col as HTMLElement).scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, []);

  // Clicking a habit marker inside a calendar day cell jumps back to that
  // habit's row in the table (and highlights the day column), instead of
  // the marker being a non-interactive glyph.
  const handleMarkerClick = useCallback((habitId: string, date: string) => {
    setHighlightDate(date);
    const row = document.querySelector(`[data-testid="habit-row-${habitId}"]`);
    if (row && typeof (row as HTMLElement).scrollIntoView === 'function') {
      (row as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    const cell = document.querySelector(`[data-testid="habit-cell-${date}"]`);
    if (cell && typeof (cell as HTMLElement).focus === 'function') {
      (cell as HTMLElement).focus();
    }
  }, []);

  const handleRename = useCallback(
    (habitId: string, name: string) => {
      updateHabit(habitId, { name }).catch(() => {
        /* rollback handled inside useHabits; surface nothing further here */
      });
    },
    [updateHabit],
  );

  const handleEditSave = useCallback(
    async (id: string, patch: { name: string; icon: string; color: string }) => {
      await updateHabit(id, patch).catch(() => {
        /* rollback handled inside useHabits */
      });
      setEditingHabit(null);
    },
    [updateHabit],
  );

  const handleDelete = useCallback(
    (habitId: string) => {
      if (!window.confirm('Delete this habit? This will remove associated entries.')) return;
      removeHabit(habitId).catch(() => {
        /* rollback handled inside useHabits */
      });
    },
    [removeHabit],
  );

  const monthLabel = useMemo(() => {
    const [y, m] = month.split('-').map((s) => parseInt(s, 10));
    return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }, [month]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-2" role="group" aria-label="Month navigation">
          <button
            type="button"
            onClick={() => setMonth((m) => shiftMonth(m, -1))}
            aria-label="Previous month"
            className="border rounded px-2 py-1"
          >
            ← Prev
          </button>
          <span aria-live="polite" className="font-semibold min-w-[10ch] text-center" data-testid="current-month-label">
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={() => setMonth((m) => shiftMonth(m, 1))}
            aria-label="Next month"
            className="border rounded px-2 py-1"
          >
            Next →
          </button>
          <button
            type="button"
            onClick={() => setMonth(currentMonth())}
            aria-label="Jump to current month"
            className="border rounded px-2 py-1 text-sm"
          >
            Today
          </button>
        </div>

        <HabitEditor
          habit={editingHabit}
          onCreate={(created: Habit) => addHabit(created)}
          onSave={handleEditSave}
          onCancel={() => setEditingHabit(null)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 overflow-auto border rounded bg-white" style={{ maxHeight: '70vh' }}>
          <HabitTable
            habits={visibleHabits}
            month={month}
            entries={entries}
            onToggle={handleToggle}
            onRangeToggle={handleRangeToggle}
            onRename={handleRename}
            onEdit={setEditingHabit}
            onDelete={handleDelete}
            highlightDate={highlightDate}
          />
        </div>

        <div className="flex flex-col gap-6">
          <CalendarView
            month={month}
            habits={habits}
            entries={entries}
            activeIds={activeIds}
            onDayClick={handleDayClick}
            onMarkerClick={handleMarkerClick}
          />
          <Legend habits={habits} activeIds={activeIds} onToggle={handleLegendToggle} />
        </div>
      </div>

      <TodoBoard />
    </div>
  );
};

export default HabitApp;
