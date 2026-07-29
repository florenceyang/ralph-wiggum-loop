import React, { useEffect, useState } from 'react';
import { HABIT_ICONS } from './HabitIcon';

export type Habit = {
  id: string;
  name: string;
  icon: string;
  color: string;
  order?: number;
};

export type HabitEditorProps = {
  onCreate?: (habit: Habit) => void;
  defaultIcon?: string;
  defaultColor?: string;
  /** When set, the editor becomes an edit form for this existing habit instead of a create form. */
  habit?: Habit | null;
  onSave?: (id: string, patch: { name: string; icon: string; color: string }) => void | Promise<void>;
  onCancel?: () => void;
};

export const HabitEditor: React.FC<HabitEditorProps> = ({
  onCreate,
  defaultIcon = 'circle',
  defaultColor = '#0ea5a4',
  habit = null,
  onSave,
  onCancel,
}) => {
  const isEditMode = !!habit;
  const [name, setName] = useState(habit?.name ?? '');
  const [icon, setIcon] = useState(habit?.icon ?? defaultIcon);
  const [color, setColor] = useState(habit?.color ?? defaultColor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset local draft state whenever the target habit changes (e.g. the
  // user opens the edit form for a different habit).
  useEffect(() => {
    setName(habit?.name ?? '');
    setIcon(habit?.icon ?? defaultIcon);
    setColor(habit?.color ?? defaultColor);
    setError(null);
  }, [habit, defaultIcon, defaultColor]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) {
      setError('Name required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (isEditMode && habit) {
        await onSave?.(habit.id, { name: name.trim(), icon, color });
      } else {
        const res = await fetch('/api/habits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), icon, color }),
        });
        if (!res.ok) throw new Error(`create failed: ${res.status}`);
        const created = await res.json();
        setName('');
        setIcon(defaultIcon);
        setColor(defaultColor);
        onCreate && onCreate(created);
      }
    } catch (err: any) {
      console.error('HabitEditor: save error', err);
      setError(err?.message || (isEditMode ? 'Save failed' : 'Create failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} aria-label="habit-editor" className="flex flex-wrap items-center gap-2">
      <input
        aria-label="Habit name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="New habit name"
        data-testid="habit-editor-name"
        className="rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
      />

      <select
        aria-label="Icon"
        value={icon}
        onChange={(e) => setIcon(e.target.value)}
        data-testid="habit-editor-icon"
        className="rounded border border-slate-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
      >
        {HABIT_ICONS.map((ic) => (
          <option key={ic} value={ic}>
            {ic}
          </option>
        ))}
      </select>

      <input
        aria-label="Color"
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        data-testid="habit-editor-color"
        className="h-10 w-10 cursor-pointer rounded border border-slate-300 bg-white p-1"
      />

      <button
        type="submit"
        disabled={loading}
        data-testid="habit-editor-submit"
        className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (isEditMode ? 'Saving...' : 'Adding...') : isEditMode ? 'Save' : 'Add'}
      </button>

      {isEditMode && onCancel && (
        <button
          type="button"
          onClick={onCancel}
          data-testid="habit-editor-cancel"
          className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
        >
          Cancel
        </button>
      )}

      {error && (
        <div role="alert" data-testid="habit-editor-error" className="text-sm text-red-600">
          {error}
        </div>
      )}
    </form>
  );
};

export default HabitEditor;
