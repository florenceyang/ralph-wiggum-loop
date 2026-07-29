import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import HabitIcon from '../HabitIcon';

describe('HabitIcon', () => {
  it('renders a distinct svg shape per canonical icon name', () => {
    const { container: heart } = render(<HabitIcon icon="heart" color="#ef4444" />);
    const { container: star } = render(<HabitIcon icon="Star" color="#f59e0b" />);
    expect(heart.querySelector('path')).toBeTruthy();
    expect(star.querySelector('polygon')).toBeTruthy();
  });

  it('falls back to a filled circle for unrecognized icon names', () => {
    const { container } = render(<HabitIcon icon="Book" color="#10b981" />);
    const circle = container.querySelector('circle');
    expect(circle).toBeTruthy();
    expect(container.querySelector('svg')).toHaveAttribute('fill', '#10b981');
  });
});
