import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import HabitTable from '../HabitTable';

describe('HabitTable', () => {
  it('renders marked cells from entries prop', () => {
    const habits = [
      { id: 'h1', name: 'Meditation', icon: 'heart', color: '#ff0000' },
    ];

    const entries = [
      { id: 'e1', habit_id: 'h1', date: '2026-07-10', done: true },
    ];

    render(<HabitTable habits={habits} month="2026-07" entries={entries} />);

    const btn = screen.getByTestId('habit-cell-2026-07-10');
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('aria-pressed', 'true');
  });

  it('uses the habit name (not the raw icon id) in each cell aria-label', () => {
    const habits = [
      { id: 'h1', name: 'Meditation', icon: 'heart', color: '#ff0000' },
    ];

    render(<HabitTable habits={habits} month="2026-07" entries={[]} />);

    const btn = screen.getByTestId('habit-cell-2026-07-01');
    expect(btn).toHaveAttribute(
      'aria-label',
      'Habit: Meditation — 2026-07-01 — unmarked',
    );
  });

  it('only exposes one tab-stop per grid via roving tabindex', () => {
    const habits = [
      { id: 'h1', name: 'Meditation', icon: 'heart', color: '#ff0000' },
      { id: 'h2', name: 'Reading', icon: 'star', color: '#00ff00' },
    ];

    render(<HabitTable habits={habits} month="2026-07" entries={[]} />);

    const first = screen.getAllByTestId('habit-cell-2026-07-01')[0];
    expect(first.closest('table')).not.toBeNull();
    const tabbable = screen
      .getAllByRole('button')
      .filter((b) => b.getAttribute('tabindex') === '0');
    expect(tabbable).toHaveLength(1);
    expect(tabbable[0]).toBe(first);
  });

  it('moves focus with arrow keys across days and habit rows', () => {
    const habits = [
      { id: 'h1', name: 'Meditation', icon: 'heart', color: '#ff0000' },
      { id: 'h2', name: 'Reading', icon: 'star', color: '#00ff00' },
    ];

    render(<HabitTable habits={habits} month="2026-07" entries={[]} />);

    const day1 = screen.getAllByTestId('habit-cell-2026-07-01')[0];
    const day2 = screen.getAllByTestId('habit-cell-2026-07-02')[0];
    act(() => {
      day1.focus();
    });
    expect(day1).toHaveFocus();

    fireEvent.keyDown(day1, { key: 'ArrowRight' });
    expect(day2).toHaveFocus();
    expect(day2).toHaveAttribute('tabindex', '0');
    expect(day1).toHaveAttribute('tabindex', '-1');

    fireEvent.keyDown(day2, { key: 'ArrowLeft' });
    expect(day1).toHaveFocus();

    // Down moves to the same day in the next habit row.
    fireEvent.keyDown(day1, { key: 'ArrowDown' });
    const row2day1 = screen
      .getAllByTestId('habit-cell-2026-07-01')
      .find((el) => el !== day1);
    expect(row2day1).toHaveFocus();

    fireEvent.keyDown(row2day1 as HTMLElement, { key: 'ArrowUp' });
    expect(day1).toHaveFocus();

    fireEvent.keyDown(day1, { key: 'End' });
    const lastDay = screen.getAllByTestId('habit-cell-2026-07-31')[0];
    expect(lastDay).toHaveFocus();

    fireEvent.keyDown(lastDay, { key: 'Home' });
    expect(day1).toHaveFocus();
  });

  it('marks a range of cells for one habit when dragging (mousedown -> mouseenter -> mouseup)', () => {
    const habits = [{ id: 'h1', name: 'Meditation', icon: 'heart', color: '#ff0000' }];
    const onRangeToggle = vi.fn();

    render(<HabitTable habits={habits} month="2026-07" entries={[]} onRangeToggle={onRangeToggle} />);

    const day1 = screen.getByTestId('habit-cell-2026-07-01');
    const day3 = screen.getByTestId('habit-cell-2026-07-03');

    fireEvent.mouseDown(day1);
    fireEvent.mouseEnter(day3);
    fireEvent.mouseUp(window);

    expect(onRangeToggle).toHaveBeenCalledWith('h1', ['2026-07-01', '2026-07-02', '2026-07-03'], true);
  });

  it('does not fire onRangeToggle for a mousedown/mouseup on the same cell (plain click)', () => {
    const habits = [{ id: 'h1', name: 'Meditation', icon: 'heart', color: '#ff0000' }];
    const onRangeToggle = vi.fn();

    render(<HabitTable habits={habits} month="2026-07" entries={[]} onRangeToggle={onRangeToggle} />);

    const day1 = screen.getByTestId('habit-cell-2026-07-01');
    fireEvent.mouseDown(day1);
    fireEvent.mouseUp(window);

    expect(onRangeToggle).not.toHaveBeenCalled();
  });

  it('marks a range between the active cell and a Shift+Click target', () => {
    const habits = [{ id: 'h1', name: 'Meditation', icon: 'heart', color: '#ff0000' }];
    const onRangeToggle = vi.fn();

    render(<HabitTable habits={habits} month="2026-07" entries={[]} onRangeToggle={onRangeToggle} />);

    const day1 = screen.getByTestId('habit-cell-2026-07-01');
    const day4 = screen.getByTestId('habit-cell-2026-07-04');

    act(() => {
      day1.focus();
    });
    fireEvent.click(day4, { shiftKey: true });

    expect(onRangeToggle).toHaveBeenCalledWith(
      'h1',
      ['2026-07-01', '2026-07-02', '2026-07-03', '2026-07-04'],
      true,
    );
  });

  it('extends the range session with repeated Shift+ArrowRight presses', () => {
    const habits = [{ id: 'h1', name: 'Meditation', icon: 'heart', color: '#ff0000' }];
    const onRangeToggle = vi.fn();

    render(<HabitTable habits={habits} month="2026-07" entries={[]} onRangeToggle={onRangeToggle} />);

    const day1 = screen.getByTestId('habit-cell-2026-07-01');
    act(() => {
      day1.focus();
    });

    fireEvent.keyDown(day1, { key: 'ArrowRight', shiftKey: true });
    const day2 = screen.getByTestId('habit-cell-2026-07-02');
    expect(day2).toHaveFocus();
    expect(onRangeToggle).toHaveBeenLastCalledWith('h1', ['2026-07-01', '2026-07-02'], true);

    fireEvent.keyDown(day2, { key: 'ArrowRight', shiftKey: true });
    expect(onRangeToggle).toHaveBeenLastCalledWith(
      'h1',
      ['2026-07-01', '2026-07-02', '2026-07-03'],
      true,
    );
  });
});

describe('HabitTable — edit/delete affordances', () => {
  it('invokes onEdit with the full habit when the edit icon button is clicked', () => {
    const habits = [{ id: 'h1', name: 'Meditation', icon: 'heart', color: '#ff0000' }];
    const onEdit = vi.fn();
    render(<HabitTable habits={habits} month="2026-07" entries={[]} onEdit={onEdit} />);

    fireEvent.click(screen.getByTestId('habit-edit-h1'));
    expect(onEdit).toHaveBeenCalledWith(habits[0]);
  });

  it('tags each row with a stable data-testid for external row-jumping', () => {
    const habits = [{ id: 'h1', name: 'Meditation', icon: 'heart', color: '#ff0000' }];
    render(<HabitTable habits={habits} month="2026-07" entries={[]} />);
    expect(screen.getByTestId('habit-row-h1')).toBeInTheDocument();
  });
});
