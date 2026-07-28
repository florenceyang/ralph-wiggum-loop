import React, { useState } from 'react';

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
};

const ICONS = ['heart', 'diamond', 'circle', 'square', 'star', 'triangle'];

export const HabitEditor: React.FC<HabitEditorProps> = ({ onCreate, defaultIcon = 'circle', defaultColor = '#0ea5a4' }) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(defaultIcon);
  const [color, setColor] = useState(defaultColor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) {
      setError('Name required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
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
    } catch (err: any) {
      console.error('HabitEditor: create error', err);
      setError(err?.message || 'Create failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} aria-label="habit-editor">
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          aria-label="Habit name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New habit name"
          data-testid="habit-editor-name"
        />

        <select aria-label="Icon" value={icon} onChange={(e) => setIcon(e.target.value)} data-testid="habit-editor-icon">
          {ICONS.map((ic) => (
            <option key={ic} value={ic}>
              {ic}
            </option>
          ))}
        </select>

        <input aria-label="Color" type="color" value={color} onChange={(e) => setColor(e.target.value)} data-testid="habit-editor-color" />

        <button type="submit" disabled={loading} data-testid="habit-editor-submit">
          {loading ? 'Adding...' : 'Add'}
        </button>
      </div>
      {error && <div role="alert" data-testid="habit-editor-error">{error}</div>}
    </form>
  );
};

export default HabitEditor;
