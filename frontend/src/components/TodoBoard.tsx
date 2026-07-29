import React, { useMemo, useState } from 'react';
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';

import TodoGroup from './TodoGroup';
import useTodos from '../hooks/useTodos';
import type { TodoGroup as TodoGroupType, TodoItem, TodoReorderUpdate } from '../types/todo';

const GROUP_DROP_PREFIX = 'todo-group-drop-';

export function getTodoGroupDropId(groupId: string): string {
  return `${GROUP_DROP_PREFIX}${groupId}`;
}

function findGroupByItemId(groups: TodoGroupType[], itemId: string): TodoGroupType | undefined {
  return groups.find((group) => group.items.some((item) => item.id === itemId));
}

function findItem(groups: TodoGroupType[], itemId: string): TodoItem | undefined {
  return groups.flatMap((group) => group.items).find((item) => item.id === itemId);
}

function isGroupDropId(id: string): boolean {
  return id.startsWith(GROUP_DROP_PREFIX);
}

export function buildTodoReorderPayload(
  groups: TodoGroupType[],
  activeId: string,
  overId: string,
): TodoReorderUpdate[] {
  if (activeId === overId) return [];

  const sourceGroup = findGroupByItemId(groups, activeId);
  const activeItem = findItem(groups, activeId);
  if (!sourceGroup || !activeItem) return [];

  const sourceIndex = sourceGroup.items.findIndex((item) => item.id === activeId);
  if (sourceIndex < 0) return [];

  if (!isGroupDropId(overId)) {
    const targetGroup = findGroupByItemId(groups, overId);
    if (!targetGroup) return [];
    const targetIndex = targetGroup.items.findIndex((item) => item.id === overId);
    if (targetIndex < 0) return [];

    const nextGroups = groups.map((group) => {
      if (group.id !== sourceGroup.id && group.id !== targetGroup.id) return group;

      if (sourceGroup.id === targetGroup.id && group.id === sourceGroup.id) {
        return { ...group, items: arrayMove(group.items, sourceIndex, targetIndex) };
      }

      if (group.id === sourceGroup.id) {
        return { ...group, items: group.items.filter((item) => item.id !== activeId) };
      }

      const nextItems = [...group.items];
      nextItems.splice(targetIndex, 0, { ...activeItem, group_id: targetGroup.id });
      return { ...group, items: nextItems };
    });

    return nextGroups.flatMap((group) =>
      group.items.flatMap((item, index) => {
        const original = findItem(groups, item.id);
        if (!original) return [];
        if (original.group_id === group.id && original.order === index) return [];
        return { id: item.id, order: index, group_id: group.id };
      }),
    );
  }

  const targetGroupId = overId.slice(GROUP_DROP_PREFIX.length);
  const targetGroup = groups.find((group) => group.id === targetGroupId);
  if (!targetGroup) return [];

  const sourceItems = sourceGroup.items.filter((item) => item.id !== activeId);
  const targetItems = sourceGroup.id === targetGroup.id ? sourceItems : [...targetGroup.items];
  const nextTargetItems = [...targetItems, { ...activeItem, group_id: targetGroup.id }];

  const nextGroups = groups.map((group) => {
    if (group.id === sourceGroup.id && group.id === targetGroup.id) {
      return { ...group, items: nextTargetItems };
    }
    if (group.id === sourceGroup.id) {
      return { ...group, items: sourceItems };
    }
    if (group.id === targetGroup.id) {
      return { ...group, items: nextTargetItems };
    }
    return group;
  });

  return nextGroups.flatMap((group) =>
    group.items.flatMap((item, index) => {
      const original = findItem(groups, item.id);
      if (!original) return [];
      if (original.group_id === group.id && original.order === index) return [];
      return { id: item.id, order: index, group_id: group.id };
    }),
  );
}

export const TodoBoard: React.FC = () => {
  const { groups, createGroup, updateGroup, deleteGroup, createItem, updateItem, deleteItem, reorderItems } = useTodos();
  const [groupName, setGroupName] = useState('');
  const [groupColor, setGroupColor] = useState('#38bdf8');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const orderedGroups = useMemo(() => groups, [groups]);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return;
    const updates = buildTodoReorderPayload(orderedGroups, String(active.id), String(over.id));
    if (!updates.length) return;
    void reorderItems(updates);
  };

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">To-Do List</h2>
          <p className="text-sm text-slate-500">Organize tasks by group and drag them where they belong.</p>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            const trimmedName = groupName.trim();
            if (!trimmedName) return;
            void createGroup(trimmedName, groupColor);
            setGroupName('');
            setGroupColor('#38bdf8');
          }}
          className="flex flex-wrap items-center gap-2"
          aria-label="todo-group-form"
        >
          <input
            value={groupName}
            onChange={(event) => setGroupName(event.target.value)}
            placeholder="New group"
            aria-label="New group name"
            className="rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
          <input
            type="color"
            value={groupColor}
            onChange={(event) => setGroupColor(event.target.value)}
            aria-label="New group color"
            className="h-10 w-10 cursor-pointer rounded border border-slate-300 bg-white p-1"
          />
          <button
            type="submit"
            className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            Add group
          </button>
        </form>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-1" data-testid="todo-board-columns">
          {orderedGroups.map((group) => (
            <TodoGroup
              key={group.id}
              group={group}
              dropId={getTodoGroupDropId(group.id)}
              onCreateItem={createItem}
              onUpdateItem={updateItem}
              onDeleteItem={deleteItem}
              onUpdateGroup={updateGroup}
              onDeleteGroup={deleteGroup}
            />
          ))}

          {orderedGroups.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-sm text-slate-500">
              Create your first group to start tracking tasks.
            </div>
          )}
        </div>
      </DndContext>
    </section>
  );
};

export default TodoBoard;
