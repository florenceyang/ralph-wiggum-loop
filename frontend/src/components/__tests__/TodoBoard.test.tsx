import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import TodoBoard, { buildTodoReorderPayload, getTodoGroupDropId } from '../TodoBoard';
import type { TodoGroup } from '../../types/todo';
import useTodos from '../../hooks/useTodos';

vi.mock('../../hooks/useTodos', () => ({
  __esModule: true,
  default: vi.fn(),
}));

const mockUseTodos = vi.mocked(useTodos);

const baseGroups: TodoGroup[] = [
  {
    id: 'g1',
    name: 'Today',
    color: '#3b82f6',
    order: 0,
    items: [{ id: 'i1', group_id: 'g1', text: 'Buy milk', completed: false, order: 0 }],
  },
  {
    id: 'g2',
    name: 'Later',
    color: '#10b981',
    order: 1,
    items: [{ id: 'i2', group_id: 'g2', text: 'Read book', completed: true, order: 0 }],
  },
];

describe('TodoBoard', () => {
  const createGroup = vi.fn();
  const updateGroup = vi.fn();
  const deleteGroup = vi.fn();
  const createItem = vi.fn();
  const updateItem = vi.fn();
  const deleteItem = vi.fn();
  const reorderItems = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTodos.mockReturnValue({
      groups: baseGroups,
      loadTodos: vi.fn(),
      createGroup,
      updateGroup,
      deleteGroup,
      createItem,
      updateItem,
      deleteItem,
      reorderItems,
    });
  });

  it('renders groups and items', () => {
    render(<TodoBoard />);

    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Later')).toBeInTheDocument();
    expect(screen.getByText('Buy milk')).toBeInTheDocument();
    expect(screen.getByText('Read book')).toBeInTheDocument();
  });

  it('creates a group from the inline form', () => {
    render(<TodoBoard />);

    fireEvent.change(screen.getByLabelText('New group name'), { target: { value: 'Weekend' } });
    fireEvent.change(screen.getByLabelText('New group color'), { target: { value: '#f59e0b' } });
    fireEvent.submit(screen.getByRole('form', { name: 'todo-group-form' }));

    expect(createGroup).toHaveBeenCalledWith('Weekend', '#f59e0b');
  });

  it('adds items, toggles completion, and deletes items', () => {
    render(<TodoBoard />);

    fireEvent.change(screen.getByLabelText('Add item to Today'), { target: { value: 'Call mom' } });
    fireEvent.click(screen.getAllByText('Add')[0]);
    expect(createItem).toHaveBeenCalledWith('g1', 'Call mom');

    fireEvent.click(screen.getByLabelText('Toggle Buy milk'));
    expect(updateItem).toHaveBeenCalledWith('i1', { completed: true });

    fireEvent.click(screen.getByLabelText('Delete Buy milk'));
    expect(deleteItem).toHaveBeenCalledWith('i1');
  });

  it('builds reorder payloads for within-group moves', () => {
    const groups: TodoGroup[] = [
      {
        id: 'g1',
        name: 'Today',
        color: '#3b82f6',
        order: 0,
        items: [
          { id: 'i1', group_id: 'g1', text: 'One', completed: false, order: 0 },
          { id: 'i2', group_id: 'g1', text: 'Two', completed: false, order: 1 },
        ],
      },
    ];

    expect(buildTodoReorderPayload(groups, 'i1', 'i2')).toEqual([
      { id: 'i2', order: 0, group_id: 'g1' },
      { id: 'i1', order: 1, group_id: 'g1' },
    ]);
  });

  it('builds reorder payloads for cross-group moves', () => {
    expect(buildTodoReorderPayload(baseGroups, 'i1', getTodoGroupDropId('g2'))).toEqual([
      { id: 'i1', order: 1, group_id: 'g2' },
    ]);
  });
});
