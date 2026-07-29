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

// Undo stack entry: the (habitId, date) pair to re-toggle to reverse an action.
type UndoEntry = { habitId: string; date: string };

export const HabitApp: React.FC = () => {
  const { habits, entriesForMonth, ensureMonthLoaded, toggle, addHabit, updateHabit, removeHabit } = useHabits();
  const [month, setMonth] = useState<string>(currentMonth());
  const [activeIds, setActiveIds] = useState<Set<string> | null>(null); // null = show all
  const [highlightDate, setHighlightDate] = useState<string | null>(null);
  const undoStack = useRef<UndoEntry[]>([]);

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
      undoStack.current.push({ habitId, date });
      toggle(habitId, date);
    },
    [toggle],
  );

  const handleUndo = useCallback(() => {
    const last = undoStack.current.pop();
    if (last) toggle(last.habitId, last.date);
  }, [toggle]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleUndo]);

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

  const handleRename = useCallback(
    (habitId: string, name: string) => {
      updateHabit(habitId, { name }).catch(() => {
        /* rollback handled inside useHabits; surface nothing further here */
      });
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

        <HabitEditor onCreate={(created: Habit) => addHabit(created)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 overflow-auto border rounded bg-white" style={{ maxHeight: '70vh' }}>
          <HabitTable
            habits={visibleHabits}
            month={month}
            entries={entries}
            onToggle={handleToggle}
            onRename={handleRename}
            onDelete={handleDelete}
            highlightDate={highlightDate}
          />
        </div>

        <div className="flex flex-col gap-6">
          <CalendarView month={month} habits={habits} entries={entries} activeIds={activeIds} onDayClick={handleDayClick} />
          <Legend habits={habits} activeIds={activeIds} onToggle={handleLegendToggle} />
        </div>
      </div>
    </div>
  );
};

export default HabitApp;
