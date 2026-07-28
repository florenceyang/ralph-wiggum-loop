import React from 'react';

export type HabitCellProps = {
  date: string; // YYYY-MM-DD
  marked: boolean;
  icon: string;
  color: string;
  size?: number;
  onToggle?: (date: string) => void;
};

export const HabitCell: React.FC<HabitCellProps> = ({
  date,
  marked,
  icon,
  color,
  size = 36,
  onToggle,
}) => {
  const handleClick = () => onToggle && onToggle(date);

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
      type="button"
      aria-pressed={marked}
      aria-label={`Habit: ${icon} — ${date} — ${marked ? 'marked' : 'unmarked'}`}
      onClick={handleClick}
      style={style}
      data-testid={`habit-cell-${date}`}
    >
      {/* simple glyph fallback to first char of icon */}
      {icon ? icon.charAt(0).toUpperCase() : '●'}
    </button>
  );
};

export default HabitCell;
