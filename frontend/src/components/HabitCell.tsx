import React from 'react';

export type ArrowKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight' | 'Home' | 'End';

export type HabitCellProps = {
  date: string; // YYYY-MM-DD
  marked: boolean;
  icon: string;
  color: string;
  size?: number;
  name?: string;
  tabIndex?: number;
  onToggle?: (date: string) => void;
  onArrow?: (date: string, key: ArrowKey) => void;
  onFocusCell?: (date: string) => void;
};

export const HabitCell = React.forwardRef<HTMLButtonElement, HabitCellProps>(function HabitCell(
  { date, marked, icon, color, size = 36, name, tabIndex, onToggle, onArrow, onFocusCell },
  ref,
) {
  const handleClick = () => onToggle && onToggle(date);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Activate on Enter or Space for keyboard accessibility
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
      return;
    }
    if (
      onArrow &&
      (e.key === 'ArrowUp' ||
        e.key === 'ArrowDown' ||
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight' ||
        e.key === 'Home' ||
        e.key === 'End')
    ) {
      e.preventDefault();
      onArrow(date, e.key);
    }
  };

  const style: React.CSSProperties = {
    width: size,
    height: size,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    border: '1px solid #e5e7eb',
    background: marked ? color : 'transparent',
    color: marked ? '#fff' : '#374151',
    cursor: 'pointer',
  };

  return (
    <button
      ref={ref}
      type="button"
      aria-pressed={marked}
      aria-label={`Habit: ${name ?? icon} — ${date} — ${marked ? 'marked' : 'unmarked'}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onFocus={() => onFocusCell && onFocusCell(date)}
      tabIndex={tabIndex}
      style={style}
      data-testid={`habit-cell-${date}`}
    >
      {/* simple glyph fallback to first char of icon */}
      {icon ? icon.charAt(0).toUpperCase() : '●'}
    </button>
  );
});

export default HabitCell;
