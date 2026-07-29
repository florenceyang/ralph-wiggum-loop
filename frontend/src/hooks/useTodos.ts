import { useCallback, useEffect, useState } from 'react';

import type { TodoGroup, TodoGroupPatch, TodoItem, TodoItemPatch, TodoReorderUpdate } from '../types/todo';

function sortItems(items: TodoItem[]): TodoItem[] {
  return [...items].sort((a, b) => a.order - b.order);
}

function normalizeGroups(groups: TodoGroup[]): TodoGroup[] {
  return [...groups]
    .sort((a, b) => a.order - b.order)
    .map((group) => ({ ...group, items: sortItems(group.items || []) }));
}

function applyGroupPatch(groups: TodoGroup[], id: string, patch: TodoGroupPatch): TodoGroup[] {
  return normalizeGroups(groups.map((group) => (group.id === id ? { ...group, ...patch } : group)));
}

function insertItem(groups: TodoGroup[], item: TodoItem): TodoGroup[] {
  return normalizeGroups(
    groups.map((group) => (group.id === item.group_id ? { ...group, items: [...group.items, item] } : group)),
  );
}

function applyItemPatch(groups: TodoGroup[], id: string, patch: TodoItemPatch): TodoGroup[] {
  let existingItem: TodoItem | undefined;
  let existingGroupId: string | undefined;

  for (const group of groups) {
    const found = group.items.find((item) => item.id === id);
    if (found) {
      existingItem = found;
      existingGroupId = group.id;
      break;
    }
  }

  if (!existingItem || !existingGroupId) return groups;

  const nextItem = { ...existingItem, ...patch, group_id: patch.group_id ?? existingItem.group_id };
  if (nextItem.group_id === existingGroupId) {
    return normalizeGroups(
      groups.map((group) => ({
        ...group,
        items: group.items.map((item) => (item.id === id ? nextItem : item)),
      })),
    );
  }

  return normalizeGroups(
    groups.map((group) => {
      if (group.id === existingGroupId) {
        return { ...group, items: group.items.filter((item) => item.id !== id) };
      }
      if (group.id === nextItem.group_id) {
        return { ...group, items: [...group.items, nextItem] };
      }
      return group;
    }),
  );
}

function removeItem(groups: TodoGroup[], id: string): TodoGroup[] {
  return normalizeGroups(groups.map((group) => ({ ...group, items: group.items.filter((item) => item.id !== id) })));
}

export function applyReorderUpdates(groups: TodoGroup[], updates: TodoReorderUpdate[]): TodoGroup[] {
  const updatesById = new Map(updates.map((update) => [update.id, update]));
  const allItems = groups.flatMap((group) =>
    group.items.map((item) => {
      const update = updatesById.get(item.id);
      return update
        ? { ...item, order: update.order, group_id: update.group_id ?? item.group_id }
        : item;
    }),
  );

  return normalizeGroups(
    groups.map((group) => ({
      ...group,
      items: allItems.filter((item) => item.group_id === group.id),
    })),
  );
}

export function useTodos() {
  const [groups, setGroups] = useState<TodoGroup[]>([]);

  const loadTodos = useCallback(async () => {
    try {
      const res = await fetch('/api/todos');
      if (!res.ok) throw new Error(`failed to load todos: ${res.status}`);
      const json: TodoGroup[] = await res.json();
      setGroups(normalizeGroups(json || []));
    } catch (err) {
      console.error('useTodos: loadTodos error', err);
    }
  }, []);

  useEffect(() => {
    void loadTodos();
  }, [loadTodos]);

  const createGroup = useCallback(async (name: string, color?: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) throw new Error('Group name required');

    const tempId = `tmp-group-${Math.random().toString(36).slice(2)}`;
    const optimisticGroup: TodoGroup = {
      id: tempId,
      name: trimmedName,
      color: color ?? '#94a3b8',
      order: groups.length,
      items: [],
    };

    let previousGroups: TodoGroup[] = [];
    setGroups((prev) => {
      previousGroups = prev;
      return normalizeGroups([...prev, optimisticGroup]);
    });

    try {
      const res = await fetch('/api/todos/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(color ? { name: trimmedName, color } : { name: trimmedName }),
      });
      if (!res.ok) throw new Error(`create group failed: ${res.status}`);
      const created: TodoGroup = await res.json();
      setGroups((prev) => normalizeGroups(prev.map((group) => (group.id === tempId ? created : group))));
      return created;
    } catch (err) {
      console.error('useTodos: createGroup error', err);
      setGroups(previousGroups);
      throw err;
    }
  }, [groups.length]);

  const updateGroup = useCallback(async (id: string, patch: TodoGroupPatch) => {
    let previousGroups: TodoGroup[] = [];
    setGroups((prev) => {
      previousGroups = prev;
      return applyGroupPatch(prev, id, patch);
    });

    try {
      const res = await fetch(`/api/todos/groups/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(`update group failed: ${res.status}`);
      const updated: TodoGroup = await res.json();
      setGroups((prev) => normalizeGroups(prev.map((group) => (group.id === id ? updated : group))));
      return updated;
    } catch (err) {
      console.error('useTodos: updateGroup error', err);
      setGroups(previousGroups);
      throw err;
    }
  }, []);

  const deleteGroup = useCallback(async (id: string) => {
    let previousGroups: TodoGroup[] = [];
    setGroups((prev) => {
      previousGroups = prev;
      return prev.filter((group) => group.id !== id);
    });

    try {
      const res = await fetch(`/api/todos/groups/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`delete group failed: ${res.status}`);
    } catch (err) {
      console.error('useTodos: deleteGroup error', err);
      setGroups(previousGroups);
      throw err;
    }
  }, []);

  const createItem = useCallback(async (groupId: string, text: string) => {
    const trimmedText = text.trim();
    if (!trimmedText) throw new Error('Item text required');

    const targetGroup = groups.find((group) => group.id === groupId);
    const tempId = `tmp-item-${Math.random().toString(36).slice(2)}`;
    const optimisticItem: TodoItem = {
      id: tempId,
      group_id: groupId,
      text: trimmedText,
      completed: false,
      order: targetGroup?.items.length ?? 0,
    };

    let previousGroups: TodoGroup[] = [];
    setGroups((prev) => {
      previousGroups = prev;
      return insertItem(prev, optimisticItem);
    });

    try {
      const res = await fetch('/api/todos/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_id: groupId, text: trimmedText }),
      });
      if (!res.ok) throw new Error(`create item failed: ${res.status}`);
      const created: TodoItem = await res.json();
      setGroups((prev) => normalizeGroups(removeItem(prev, tempId).map((group) => (group.id === created.group_id ? { ...group, items: [...group.items, created] } : group))));
      return created;
    } catch (err) {
      console.error('useTodos: createItem error', err);
      setGroups(previousGroups);
      throw err;
    }
  }, [groups]);

  const updateItem = useCallback(async (id: string, patch: TodoItemPatch) => {
    let previousGroups: TodoGroup[] = [];
    setGroups((prev) => {
      previousGroups = prev;
      return applyItemPatch(prev, id, patch);
    });

    try {
      const res = await fetch(`/api/todos/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(`update item failed: ${res.status}`);
      const updated: TodoItem = await res.json();
      setGroups((prev) => applyItemPatch(prev, id, updated));
      return updated;
    } catch (err) {
      console.error('useTodos: updateItem error', err);
      setGroups(previousGroups);
      throw err;
    }
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    let previousGroups: TodoGroup[] = [];
    setGroups((prev) => {
      previousGroups = prev;
      return removeItem(prev, id);
    });

    try {
      const res = await fetch(`/api/todos/items/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`delete item failed: ${res.status}`);
    } catch (err) {
      console.error('useTodos: deleteItem error', err);
      setGroups(previousGroups);
      throw err;
    }
  }, []);

  const reorderItems = useCallback(async (updates: TodoReorderUpdate[]) => {
    let previousGroups: TodoGroup[] = [];
    setGroups((prev) => {
      previousGroups = prev;
      return applyReorderUpdates(prev, updates);
    });

    try {
      const res = await fetch('/api/todos/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updates }),
      });
      if (!res.ok) throw new Error(`reorder items failed: ${res.status}`);
      const json: { updated?: TodoReorderUpdate[] } = await res.json();
      const confirmedUpdates = json.updated;
      if (confirmedUpdates && confirmedUpdates.length > 0) {
        setGroups((prev) => applyReorderUpdates(prev, confirmedUpdates));
      }
      return json;
    } catch (err) {
      console.error('useTodos: reorderItems error', err);
      setGroups(previousGroups);
      throw err;
    }
  }, []);

  return {
    groups,
    loadTodos,
    createGroup,
    updateGroup,
    deleteGroup,
    createItem,
    updateItem,
    deleteItem,
    reorderItems,
  } as const;
}

export default useTodos;
