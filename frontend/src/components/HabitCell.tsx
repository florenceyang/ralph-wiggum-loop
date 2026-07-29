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
  /** Non-persisted preview of a pending drag/range action (true = will mark, false = will unmark). */
  previewDone?: boolean;
  onToggle?: (date: string) => void;
  onArrow?: (date: string, key: ArrowKey) => void;
  onFocusCell?: (date: string) => void;
  /** Shift+Click: bulk-toggle the range between the last anchor and this cell. */
  onShiftToggle?: (date: string) => void;
  /** Shift+ArrowLeft/Right: extend/apply the bulk range one day at a time. */
  onShiftArrow?: (date: string, key: 'ArrowLeft' | 'ArrowRight') => void;
  /** Pointer-drag range marking: mousedown starts a drag anchored at this cell. */
  onCellMouseDown?: (date: string) => void;
  /** Pointer-drag range marking: mouseenter extends the drag to this cell. */
  onCellMouseEnter?: (date: string) => void;
};

export const HabitCell = React.forwardRef<HTMLButtonElement, HabitCellProps>(function HabitCell(
  {
    date,
    marked,
    icon,
    color,
    size = 36,
    name,
    tabIndex,
    previewDone,
    onToggle,
    onArrow,
    onFocusCell,
    onShiftToggle,
    onShiftArrow,
    onCellMouseDown,
    onCellMouseEnter,
  },
  ref,
) {
  const handleClick = (e: React.MouseEvent) => {
    if (e.shiftKey && onShiftToggle) {
      onShiftToggle(date);
      return;
    }
    onToggle && onToggle(date);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent native text-selection while dragging across cells.
    if (onCellMouseDown) e.preventDefault();
    onCellMouseDown && onCellMouseDown(date);
  };

  const handleMouseEnter = () => {
    onCellMouseEnter && onCellMouseEnter(date);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Activate on Enter or Space for keyboard accessibility
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (e.shiftKey && onShiftToggle) {
        onShiftToggle(date);
        return;
      }
      onToggle && onToggle(date);
      return;
    }
    if (
      e.shiftKey &&
      onShiftArrow &&
      (e.key === 'ArrowLeft' || e.key === 'ArrowRight')
    ) {
      e.preventDefault();
      onShiftArrow(date, e.key);
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
    border: previewDone === undefined ? '1px solid #e5e7eb' : `2px dashed ${previewDone ? color : '#9ca3af'}`,
    background: marked ? color : previewDone ? `${color}33` : 'transparent',
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
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
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
