import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import useTodos from '../useTodos';
import type { TodoGroup, TodoItem, TodoReorderUpdate } from '../../types/todo';

function TestHarness() {
  const { groups, createGroup, updateGroup, deleteGroup, createItem, updateItem, deleteItem, reorderItems } = useTodos();

  const firstGroupId = groups[0]?.id;
  const firstItemId = groups[0]?.items[0]?.id;
  const secondGroupId = groups[1]?.id;

  return (
    <div>
      <div data-testid="group-count">{groups.length}</div>
      <div data-testid="group-names">{groups.map((group) => group.name).join('|')}</div>
      <div data-testid="item-order">{groups.flatMap((group) => group.items.map((item) => `${group.name}:${item.text}`)).join('|')}</div>
      <div data-testid="completed-state">{groups.flatMap((group) => group.items.map((item) => `${item.id}:${String(item.completed)}`)).join('|')}</div>

      <button type="button" data-testid="create-group" onClick={() => void createGroup('Errands', '#f59e0b')}>
        create group
      </button>
      <button type="button" data-testid="rename-group" onClick={() => firstGroupId && void updateGroup(firstGroupId, { name: 'Today' })}>
        rename group
      </button>
      <button type="button" data-testid="delete-group" onClick={() => secondGroupId && void deleteGroup(secondGroupId)}>
        delete group
      </button>
      <button type="button" data-testid="create-item" onClick={() => firstGroupId && void createItem(firstGroupId, 'Review PR')}>
        create item
      </button>
      <button type="button" data-testid="toggle-item" onClick={() => firstItemId && void updateItem(firstItemId, { completed: true })}>
        toggle item
      </button>
      <button type="button" data-testid="delete-item" onClick={() => firstItemId && void deleteItem(firstItemId)}>
        delete item
      </button>
      <button
        type="button"
        data-testid="reorder-items"
        onClick={() =>
          void reorderItems([
            { id: 'i2', order: 0, group_id: 'g2' },
            { id: 'i3', order: 1, group_id: 'g2' },
          ])
        }
      >
        reorder
      </button>
    </div>
  );
}

const INITIAL_GROUPS: TodoGroup[] = [
  {
    id: 'g1',
    name: 'Inbox',
    color: '#3b82f6',
    order: 0,
    items: [{ id: 'i1', group_id: 'g1', text: 'Buy milk', completed: false, order: 0 }],
  },
  {
    id: 'g2',
    name: 'Later',
    color: '#10b981',
    order: 1,
    items: [{ id: 'i2', group_id: 'g2', text: 'Read book', completed: false, order: 0 }],
  },
];

function cloneGroups(groups: TodoGroup[]): TodoGroup[] {
  return groups.map((group) => ({ ...group, items: group.items.map((item) => ({ ...item })) }));
}

function applyReorder(groups: TodoGroup[], updates: TodoReorderUpdate[]): TodoGroup[] {
  const updateMap = new Map(updates.map((update) => [update.id, update]));
  const items = groups.flatMap((group) =>
    group.items.map((item) => {
      const update = updateMap.get(item.id);
      return update ? { ...item, order: update.order, group_id: update.group_id ?? item.group_id } : item;
    }),
  );

  return groups.map((group) => ({
    ...group,
    items: items.filter((item) => item.group_id === group.id).sort((a, b) => a.order - b.order),
  }));
}

describe('useTodos hook', () => {
  let globalFetch: typeof global.fetch;
  let store: TodoGroup[];

  beforeEach(() => {
    globalFetch = global.fetch;
    store = cloneGroups(INITIAL_GROUPS);
    (global as typeof globalThis & { fetch: typeof fetch }).fetch = vi.fn(async (input: any, init?: any) => {
      const url = typeof input === 'string' ? input : input.toString();
      const method = init?.method ?? 'GET';

      if (url.endsWith('/api/todos') && method === 'GET') {
        return { ok: true, json: async () => cloneGroups(store) } as Response;
      }

      if (url.endsWith('/api/todos/groups') && method === 'POST') {
        const body = JSON.parse(init?.body as string) as { name: string; color?: string };
        const created: TodoGroup = {
          id: 'g3',
          name: body.name,
          color: body.color ?? '#94a3b8',
          order: store.length,
          items: [],
        };
        store = [...store, created];
        return { ok: true, json: async () => created } as Response;
      }

      if (url.endsWith('/api/todos/groups/g1') && method === 'PUT') {
        const patch = JSON.parse(init?.body as string) as Partial<TodoGroup>;
        store = store.map((group) => (group.id === 'g1' ? { ...group, ...patch } : group));
        return { ok: true, json: async () => store.find((group) => group.id === 'g1') } as Response;
      }

      if (url.endsWith('/api/todos/groups/g2') && method === 'DELETE') {
        store = store.filter((group) => group.id !== 'g2');
        return { ok: true, json: async () => ({ deleted: true }) } as Response;
      }

      if (url.endsWith('/api/todos/items') && method === 'POST') {
        const body = JSON.parse(init?.body as string) as { group_id: string; text: string };
        const created: TodoItem = {
          id: 'i3',
          group_id: body.group_id,
          text: body.text,
          completed: false,
          order: store.find((group) => group.id === body.group_id)?.items.length ?? 0,
        };
        store = store.map((group) => (group.id === body.group_id ? { ...group, items: [...group.items, created] } : group));
        return { ok: true, json: async () => created } as Response;
      }

      if (url.endsWith('/api/todos/items/i1') && method === 'PUT') {
        const patch = JSON.parse(init?.body as string) as Partial<TodoItem>;
        let updatedItem: TodoItem | undefined;
        store = store.map((group) => ({
          ...group,
          items: group.items.map((item) => {
            if (item.id !== 'i1') return item;
            updatedItem = { ...item, ...patch, group_id: patch.group_id ?? item.group_id };
            return updatedItem;
          }),
        }));
        return { ok: true, json: async () => updatedItem } as Response;
      }

      if (url.endsWith('/api/todos/items/i1') && method === 'DELETE') {
        store = store.map((group) => ({ ...group, items: group.items.filter((item) => item.id !== 'i1') }));
        return { ok: true, json: async () => ({ deleted: true }) } as Response;
      }

      if (url.endsWith('/api/todos/reorder') && method === 'PUT') {
        const body = JSON.parse(init?.body as string) as { items: TodoReorderUpdate[] };
        store = applyReorder(store, body.items);
        return { ok: true, json: async () => ({ updated: body.items }) } as Response;
      }

      throw new Error(`Unhandled fetch: ${method} ${url}`);
    });
  });

  afterEach(() => {
    (global as typeof globalThis & { fetch: typeof fetch }).fetch = globalFetch;
    vi.resetAllMocks();
  });

  it('loads todo groups on mount', async () => {
    render(<TestHarness />);

    await waitFor(() => expect(screen.getByTestId('group-count')).toHaveTextContent('2'));
    expect(screen.getByTestId('group-names')).toHaveTextContent('Inbox|Later');
  });

  it('creates, updates, and deletes groups', async () => {
    render(<TestHarness />);
    await waitFor(() => expect(screen.getByTestId('group-count')).toHaveTextContent('2'));

    fireEvent.click(screen.getByTestId('create-group'));
    await waitFor(() => expect(screen.getByTestId('group-count')).toHaveTextContent('3'));
    expect(screen.getByTestId('group-names')).toHaveTextContent('Errands');

    fireEvent.click(screen.getByTestId('rename-group'));
    await waitFor(() => expect(screen.getByTestId('group-names')).toHaveTextContent('Today|Later|Errands'));

    fireEvent.click(screen.getByTestId('delete-group'));
    await waitFor(() => expect(screen.getByTestId('group-count')).toHaveTextContent('2'));
    expect(screen.getByTestId('group-names')).toHaveTextContent('Today|Errands');
  });

  it('creates, updates, deletes, and reorders items', async () => {
    render(<TestHarness />);
    await waitFor(() => expect(screen.getByTestId('item-order')).toHaveTextContent('Inbox:Buy milk|Later:Read book'));

    fireEvent.click(screen.getByTestId('create-item'));
    await waitFor(() => expect(screen.getByTestId('item-order')).toHaveTextContent('Inbox:Buy milk|Inbox:Review PR|Later:Read book'));

    fireEvent.click(screen.getByTestId('toggle-item'));
    await waitFor(() => expect(screen.getByTestId('completed-state')).toHaveTextContent('i1:true'));

    fireEvent.click(screen.getByTestId('reorder-items'));
    await waitFor(() => expect(screen.getByTestId('item-order')).toHaveTextContent('Inbox:Buy milk|Later:Read book|Later:Review PR'));

    fireEvent.click(screen.getByTestId('delete-item'));
    await waitFor(() => expect(screen.getByTestId('item-order')).not.toHaveTextContent('Buy milk'));
  });
});
