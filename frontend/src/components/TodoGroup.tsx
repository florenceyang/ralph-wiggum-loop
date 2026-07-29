import React, { useEffect, useState } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';

import TodoItem from './TodoItem';
import type { TodoGroup as TodoGroupType, TodoItemPatch } from '../types/todo';

type TodoGroupProps = {
  group: TodoGroupType;
  dropId: string;
  onCreateItem: (groupId: string, text: string) => Promise<unknown> | unknown;
  onUpdateItem: (id: string, patch: TodoItemPatch) => Promise<unknown> | unknown;
  onDeleteItem: (id: string) => Promise<unknown> | unknown;
  onUpdateGroup: (id: string, patch: Partial<Pick<TodoGroupType, 'name' | 'color'>>) => Promise<unknown> | unknown;
  onDeleteGroup: (id: string) => Promise<unknown> | unknown;
};

export const TodoGroup: React.FC<TodoGroupProps> = ({
  group,
  dropId,
  onCreateItem,
  onUpdateItem,
  onDeleteItem,
  onUpdateGroup,
  onDeleteGroup,
}) => {
  const [newItemText, setNewItemText] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState(group.name);
  const { setNodeRef, isOver } = useDroppable({ id: dropId });

  useEffect(() => {
    if (!isEditingName) {
      setDraftName(group.name);
    }
  }, [group.name, isEditingName]);

  const commitName = () => {
    const trimmedName = draftName.trim();
    setIsEditingName(false);
    if (!trimmedName || trimmedName === group.name) {
      setDraftName(group.name);
      return;
    }
    void onUpdateGroup(group.id, { name: trimmedName });
  };

  return (
    <section className="flex min-h-[18rem] min-w-[18rem] max-w-xs flex-1 flex-col rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
      <header className="rounded-t-xl border-b border-slate-200 bg-white p-4">
        <div className="flex items-start gap-3">
          <span className="mt-1 h-3 w-3 rounded-full border border-white shadow-sm" style={{ backgroundColor: group.color }} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            {isEditingName ? (
              <input
                autoFocus
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                onBlur={commitName}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') commitName();
                  if (event.key === 'Escape') {
                    setDraftName(group.name);
                    setIsEditingName(false);
                  }
                }}
                aria-label={`Edit ${group.name}`}
                className="w-full rounded border border-slate-300 px-2 py-1 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingName(true)}
                className="rounded text-left text-base font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                {group.name}
              </button>
            )}
            <p className="mt-1 text-xs text-slate-500">{group.items.length} item{group.items.length === 1 ? '' : 's'}</p>
          </div>
          <div className="flex items-center gap-1">
            <input
              type="color"
              value={group.color}
              onChange={(event) => {
                void onUpdateGroup(group.id, { color: event.target.value });
              }}
              aria-label={`Choose color for ${group.name}`}
              className="h-9 w-9 cursor-pointer rounded border border-slate-200 bg-white p-1"
            />
            <button
              type="button"
              onClick={() => {
                void onDeleteGroup(group.id);
              }}
              aria-label={`Delete ${group.name}`}
              className="rounded p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-200"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                <path d="M4 6h12" strokeLinecap="round" />
                <path d="M7.5 6V4.75A1.25 1.25 0 0 1 8.75 3.5h2.5A1.25 1.25 0 0 1 12.5 4.75V6" strokeLinecap="round" />
                <path d="M6.5 6.75v8A1.25 1.25 0 0 0 7.75 16h4.5a1.25 1.25 0 0 0 1.25-1.25v-8" strokeLinecap="round" />
                <path d="M8.5 9.25v4.5M11.5 9.25v4.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div
        ref={setNodeRef}
        className={[
          'flex flex-1 flex-col gap-3 p-4 transition',
          isOver ? 'rounded-b-xl bg-slate-100' : '',
        ].join(' ')}
        data-testid={`todo-group-${group.id}`}
      >
        <SortableContext items={group.items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          {group.items.map((item) => (
            <TodoItem key={item.id} item={item} onUpdate={onUpdateItem} onDelete={onDeleteItem} />
          ))}
        </SortableContext>

        {group.items.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white/70 px-3 py-6 text-center text-sm text-slate-400">
            Drop an item here or add a new task.
          </div>
        )}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            const trimmedText = newItemText.trim();
            if (!trimmedText) return;
            void onCreateItem(group.id, trimmedText);
            setNewItemText('');
          }}
          className="mt-auto flex gap-2"
        >
          <input
            value={newItemText}
            onChange={(event) => setNewItemText(event.target.value)}
            placeholder="Add a task"
            aria-label={`Add item to ${group.name}`}
            className="min-w-0 flex-1 rounded border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
          <button
            type="submit"
            className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            Add
          </button>
        </form>
      </div>
    </section>
  );
};

export default TodoGroup;
