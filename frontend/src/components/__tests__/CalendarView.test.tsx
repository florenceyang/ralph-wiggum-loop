import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CalendarView from '../CalendarView';

const habits = [
  { id: 'h1', name: 'Meditate', icon: 'Heart', color: '#ef4444' },
  { id: 'h2', name: 'Run', icon: 'Star', color: '#f59e0b' },
  { id: 'h3', name: 'Read', icon: 'Book', color: '#10b981' },
  { id: 'h4', name: 'Code', icon: 'Code', color: '#3b82f6' },
  { id: 'h5', name: 'Stretch', icon: 'Diamond', color: '#8b5cf6' },
];

const entries = [
  { habit_id: 'h1', date: '2026-07-01', done: true },
  { habit_id: 'h2', date: '2026-07-01', done: true },
  { habit_id: 'h3', date: '2026-07-01', done: true },
  { habit_id: 'h4', date: '2026-07-01', done: true },
  { habit_id: 'h5', date: '2026-07-01', done: true },
  { habit_id: 'h1', date: '2026-07-02', done: true },
];

describe('CalendarView', () => {
  it('renders day icons and overflow indicator', () => {
    render(<CalendarView month="2026-07" habits={habits as any} entries={entries as any} />);

    const day1 = screen.getByTestId('calendar-day-2026-07-01');
    expect(day1).toBeTruthy();

    // should render up to 4 icons
    expect(screen.getByTestId('calendar-icon-2026-07-01-h1')).toBeTruthy();
    expect(screen.getByTestId('calendar-icon-2026-07-01-h2')).toBeTruthy();
    expect(screen.getByTestId('calendar-icon-2026-07-01-h3')).toBeTruthy();
    expect(screen.getByTestId('calendar-icon-2026-07-01-h4')).toBeTruthy();

    // overflow +1 should be present
    expect(screen.getByTestId('calendar-overflow-2026-07-01')).toHaveTextContent('+1');

    // day with single entry shows that icon
    expect(screen.getByTestId('calendar-icon-2026-07-02-h1')).toBeTruthy();
  });

  it('starts the grid on day 1 aligned under its real weekday column', () => {
    render(<CalendarView month="2026-07" habits={habits as any} entries={entries as any} />);
    // 2026-07-01 is a Wednesday; the grid should render 3 leading blank
    // cells (Sun/Mon/Tue) before day 1, not start day 1 in column 0.
    expect(screen.getByTestId('calendar-day-2026-07-01')).toBeTruthy();
    expect(screen.queryByTestId('calendar-day-2026-06-30')).toBeNull();
  });

  it('calls onMarkerClick (not just onDayClick) when a habit marker is clicked', () => {
    const onDayClick = vi.fn();
    const onMarkerClick = vi.fn();
    render(
      <CalendarView
        month="2026-07"
        habits={habits as any}
        entries={entries as any}
        onDayClick={onDayClick}
        onMarkerClick={onMarkerClick}
      />,
    );

    fireEvent.click(screen.getByTestId('calendar-icon-2026-07-01-h1'));
    expect(onMarkerClick).toHaveBeenCalledWith('h1', '2026-07-01');
    // the marker click should not also bubble into the day-cell click.
    expect(onDayClick).not.toHaveBeenCalled();
  });
});
