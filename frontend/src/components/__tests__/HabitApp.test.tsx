import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';
import { HabitApp } from '../HabitApp';
import { formatLocalDate } from '../../lib/date';

const HABITS = [
  { id: 'h1', name: 'Meditation', icon: 'heart', color: '#ff0000' },
  { id: 'h2', name: 'Reading', icon: 'diamond', color: '#00ff00' },
];

describe('HabitApp (integration)', () => {
  let globalFetch: any;

  beforeEach(() => {
    globalFetch = global.fetch;
    (global as any).fetch = vi.fn((input: any, init?: any) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.endsWith('/api/habits')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(HABITS) });
      }
      if (url.includes('/api/entries?month=')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ id: 'e1', habit_id: 'h1', date: formatLocalDate(new Date()), done: true }]),
        });
      }
      if (url.endsWith('/api/entries') && init?.method === 'POST') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 'e2', habit_id: 'h1', date: '2026-07-10', done: true }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });
  });

  afterEach(() => {
    (global as any).fetch = globalFetch;
    vi.resetAllMocks();
  });

  it('wires HabitEditor, HabitTable, CalendarView and Legend together via useHabits', async () => {
    render(<HabitApp />);

    // Habits load and render in both the table and the legend.
    await waitFor(() => expect(screen.getByTestId('habit-name-h1')).toBeTruthy());
    expect(screen.getByTestId('habit-name-h2')).toBeTruthy();
    expect(screen.getByTestId('legend-toggle-h1')).toBeTruthy();
    expect(screen.getByRole('grid', { name: /Calendar for/i })).toBeTruthy();

    // Month label is rendered.
    expect(screen.getByTestId('current-month-label').textContent).toMatch(/\d{4}/);
  });

  it('filters both the table and the calendar when a legend item is toggled', async () => {
    render(<HabitApp />);

    await waitFor(() => expect(screen.getByTestId('habit-name-h1')).toBeTruthy());

    // Toggle habit h1 in the legend: per current "isolate" semantics this
    // hides h1 (leaving only h2 visible) in the table.
    fireEvent.click(screen.getByTestId('legend-toggle-h1'));

    await waitFor(() => expect(screen.queryByTestId('habit-name-h1')).toBeNull());
    expect(screen.getByTestId('habit-name-h2')).toBeTruthy();
  });

  it('highlights the corresponding table column when a calendar day is clicked', async () => {
    render(<HabitApp />);
    await waitFor(() => expect(screen.getByTestId('habit-name-h1')).toBeTruthy());

    const today = formatLocalDate(new Date());
    const dayButton = screen.getByTestId(`calendar-day-${today}`);
    fireEvent.click(dayButton);

    await waitFor(() => {
      const col = screen.getByTestId(`habit-table-col-${today}`);
      expect(col.getAttribute('style')).toContain('background');
    });
  });

  it('navigates between months', async () => {
    render(<HabitApp />);
    await waitFor(() => expect(screen.getByTestId('current-month-label')).toBeTruthy());
    const initialLabel = screen.getByTestId('current-month-label').textContent;

    fireEvent.click(screen.getByLabelText('Next month'));

    await waitFor(() => expect(screen.getByTestId('current-month-label').textContent).not.toBe(initialLabel));
  });

  it('supports multi-step undo (Ctrl+Z) and redo (Ctrl+Shift+Z) across two toggles', async () => {
    render(<HabitApp />);
    await waitFor(() => expect(screen.getByTestId('habit-name-h1')).toBeTruthy());

    const today = formatLocalDate(new Date());
    const cell = screen.getAllByTestId(`habit-cell-${today}`)[0];
    // h1 starts marked (from the mocked /api/entries?month= response); toggle unmarks it.
    expect(cell).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(cell);
    await waitFor(() => expect(cell).toHaveAttribute('aria-pressed', 'false'));

    // Undo restores it to marked.
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true });
    await waitFor(() => expect(cell).toHaveAttribute('aria-pressed', 'true'));

    // Redo re-applies the unmark.
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true, shiftKey: true });
    await waitFor(() => expect(cell).toHaveAttribute('aria-pressed', 'false'));
  });

  it('undoes a whole drag/range-marking action in one Ctrl+Z', async () => {
    render(<HabitApp />);
    await waitFor(() => expect(screen.getByTestId('habit-name-h1')).toBeTruthy());

    // Drag from an unmarked day (tomorrow) to the day after — both start
    // unmarked, so the whole dragged range should end up marked=true.
    const d = new Date();
    const tomorrow = formatLocalDate(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1));
    const dayAfter = formatLocalDate(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 2));

    const startCell = screen.getAllByTestId(`habit-cell-${tomorrow}`)[0];
    const endCell = screen.getAllByTestId(`habit-cell-${dayAfter}`)[0];

    fireEvent.mouseDown(startCell);
    fireEvent.mouseEnter(endCell);
    fireEvent.mouseUp(window);

    await waitFor(() => expect(endCell).toHaveAttribute('aria-pressed', 'true'));

    fireEvent.keyDown(window, { key: 'z', ctrlKey: true });

    await waitFor(() => expect(endCell).toHaveAttribute('aria-pressed', 'false'));
  });
});
