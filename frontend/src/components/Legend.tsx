import React from 'react';
import type { Habit as HabitType } from './HabitTable';

export type LegendProps = {
  habits: HabitType[];
  onToggle?: (habitId: string) => void;
};

export const Legend: React.FC<LegendProps> = ({ habits, onToggle }) => {
  return (
    <aside aria-label="Habit legend">
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {habits.map((h) => (
          <li key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <button
              type="button"
              onClick={() => onToggle && onToggle(h.id)}
              aria-label={`Toggle ${h.name}`}
              style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                background: h.color,
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(0,0,0,0.06)',
                cursor: 'pointer',
              }}
              data-testid={`legend-toggle-${h.id}`}
            >
              {h.icon ? h.icon.charAt(0).toUpperCase() : '●'}
            </button>
            <span style={{ fontSize: 14 }}>{h.name}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default Legend;
