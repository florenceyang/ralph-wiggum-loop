import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import HabitCell from '../HabitCell';

describe('HabitCell', () => {
  it('renders and toggles via mouse and keyboard', () => {
    const onToggle = vi.fn();
    render(<HabitCell date="2026-07-10" marked={false} icon="heart" color="#ff0000" onToggle={onToggle} />);

    const btn = screen.getByTestId('habit-cell-2026-07-10');
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('aria-pressed', 'false');

    // click
    fireEvent.click(btn);
    expect(onToggle).toHaveBeenCalledWith('2026-07-10');

    // keyboard: Enter
    fireEvent.keyDown(btn, { key: 'Enter' });
    expect(onToggle).toHaveBeenCalledWith('2026-07-10');

    // keyboard: Space
    fireEvent.keyDown(btn, { key: ' ' });
    expect(onToggle).toHaveBeenCalledWith('2026-07-10');
  });
});
