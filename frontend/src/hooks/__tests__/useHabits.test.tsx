import { useEffect } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';
import useHabits from '../useHabits';

// Simple test harness component to exercise the hook
function TestHarness() {
  const { habits, ensureMonthLoaded, entriesForMonth, toggle } = useHabits();

  useEffect(() => {
    ensureMonthLoaded('2026-07');
  }, [ensureMonthLoaded]);

  const entries = entriesForMonth('2026-07');

  return (
    <div>
      <div data-testid="habits-count">{habits.length}</div>
      <div data-testid="entries-count">{entries.length}</div>
      <button data-testid="toggle" onClick={() => toggle('h1', '2026-07-10')}>toggle</button>
    </div>
  );
}

describe('useHabits hook', () => {
  let globalFetch: any;

  beforeEach(() => {
    globalFetch = global.fetch;
    (global as any).fetch = vi.fn((input: any, init?: any) => {
      const url = typeof input === 'string' ? input : input.url;
      // /api/habits
      if (url.endsWith('/api/habits')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([{ id: 'h1', name: 'Test', icon: 'heart', color: '#ff0000' }]) });
      }
      if (url.includes('/api/entries?month=2026-07')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      if (url.endsWith('/api/entries') && init && init.method === 'POST') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 'e1', habit_id: 'h1', date: '2026-07-10', done: true }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });
  });

  afterEach(() => {
    (global as any).fetch = globalFetch;
    vi.resetAllMocks();
  });

  it('loads month and toggles an entry optimistically', async () => {
    render(<TestHarness />);

    // wait for entries to be loaded
    await waitFor(() => expect((global as any).fetch).toHaveBeenCalledWith('/api/entries?month=2026-07'));

    // initially entries-count should be 0
    expect(screen.getByTestId('entries-count').textContent).toBe('0');

    // click toggle, should call POST /api/entries
    fireEvent.click(screen.getByTestId('toggle'));

    await waitFor(() => expect((global as any).fetch).toHaveBeenCalledWith('/api/entries', expect.any(Object)));

    // afterwards entries count should be 1 (optimistic + replacement)
    await waitFor(() => expect(screen.getByTestId('entries-count').textContent).toBe('1'));
  });
});
