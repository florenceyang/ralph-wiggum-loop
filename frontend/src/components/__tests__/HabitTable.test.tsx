import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
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
});
