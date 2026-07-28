import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import HabitEditor from '../HabitEditor';

describe('HabitEditor', () => {
  let fetchSpy: any;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore && fetchSpy.mockRestore();
  });

  it('submits new habit and calls onCreate', async () => {
    const created = { id: 'h1', name: 'Meditation', icon: 'heart', color: '#ff0000' };
    fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => created });

    const onCreate = vi.fn();
    render(<HabitEditor onCreate={onCreate} />);

    const nameInput = screen.getByTestId('habit-editor-name') as HTMLInputElement;
    const iconSelect = screen.getByTestId('habit-editor-icon') as HTMLSelectElement;
    const colorInput = screen.getByTestId('habit-editor-color') as HTMLInputElement;
    const submit = screen.getByTestId('habit-editor-submit') as HTMLButtonElement;

    fireEvent.change(nameInput, { target: { value: 'Meditation' } });
    fireEvent.change(iconSelect, { target: { value: 'heart' } });
    fireEvent.change(colorInput, { target: { value: '#ff0000' } });

    fireEvent.click(submit);

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    expect(fetchSpy).toHaveBeenCalledWith('/api/habits', expect.objectContaining({ method: 'POST' }));
    await waitFor(() => expect(onCreate).toHaveBeenCalledWith(created));
  });

  it('shows validation error when name empty', async () => {
    render(<HabitEditor />);
    const submit = screen.getByTestId('habit-editor-submit');
    fireEvent.click(submit);
    const alert = await screen.findByTestId('habit-editor-error');
    expect(alert).toHaveTextContent('Name required');
  });
});
