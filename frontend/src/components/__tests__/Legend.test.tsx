import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Legend from '../Legend';

const habits = [
  { id: 'h1', name: 'Meditate', icon: 'Heart', color: '#ef4444' },
  { id: 'h2', name: 'Run', icon: 'Star', color: '#f59e0b' },
];

describe('Legend', () => {
  it('renders habits and invokes toggle', () => {
    const onToggle = vi.fn();
    render(<Legend habits={habits as any} onToggle={onToggle} />);

    expect(screen.getByText('Meditate')).toBeTruthy();
    const btn = screen.getByTestId('legend-toggle-h1');
    fireEvent.click(btn);
    expect(onToggle).toHaveBeenCalledWith('h1');
  });
});
