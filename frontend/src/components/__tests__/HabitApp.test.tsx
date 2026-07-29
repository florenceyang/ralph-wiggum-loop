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
});
