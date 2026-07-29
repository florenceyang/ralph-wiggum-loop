import React from 'react';
import type { Habit as HabitType } from './HabitTable';
import HabitIcon from './HabitIcon';

export type LegendProps = {
  habits: HabitType[];
  activeIds?: Set<string> | null; // null/undefined = all active
  onToggle?: (habitId: string) => void;
};

export const Legend: React.FC<LegendProps> = ({ habits, activeIds, onToggle }) => {
  return (
    <aside aria-label="Habit legend" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">Legend</h3>
      <ul className="flex list-none flex-col gap-2 p-0 m-0">
        {habits.map((h) => {
          const active = !activeIds || activeIds.has(h.id);
          return (
            <li key={h.id} className={`flex items-center gap-2 transition-opacity ${active ? 'opacity-100' : 'opacity-40'}`}>
              <button
                type="button"
                onClick={() => onToggle && onToggle(h.id)}
                aria-pressed={active}
                aria-label={`Toggle ${h.name} visibility — currently ${active ? 'shown' : 'hidden'}`}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-black/5 bg-slate-50 cursor-pointer transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                data-testid={`legend-toggle-${h.id}`}
              >
                <HabitIcon icon={h.icon} color={h.color} size={18} />
              </button>
              <span className="text-sm text-slate-700">{h.name}</span>
            </li>
          );
        })}
      </ul>
    </aside>
  );
};

export default Legend;
