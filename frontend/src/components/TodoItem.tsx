import React, { useEffect, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import type { TodoItem as TodoItemType, TodoItemPatch } from '../types/todo';

type TodoItemProps = {
  item: TodoItemType;
  onUpdate: (id: string, patch: TodoItemPatch) => Promise<unknown> | unknown;
  onDelete: (id: string) => Promise<unknown> | unknown;
};

const buttonClasses = 'rounded p-1.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-200';

export const TodoItem: React.FC<TodoItemProps> = ({ item, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draftText, setDraftText] = useState(item.text);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  useEffect(() => {
    if (!isEditing) {
      setDraftText(item.text);
    }
  }, [isEditing, item.text]);

  const commitEdit = () => {
    const trimmedText = draftText.trim();
    setIsEditing(false);
    if (!trimmedText || trimmedText === item.text) {
      setDraftText(item.text);
      return;
    }
    void onUpdate(item.id, { text: trimmedText });
  };

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={[
        'rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition',
        item.completed ? 'bg-slate-50' : '',
        isDragging ? 'opacity-70 shadow-md' : '',
      ].join(' ')}
      data-testid={`todo-item-${item.id}`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          className="mt-0.5 cursor-grab rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-200"
          aria-label={`Drag ${item.text}`}
          {...attributes}
          {...listeners}
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current" aria-hidden="true">
            <circle cx="6" cy="6" r="1.5" />
            <circle cx="6" cy="14" r="1.5" />
            <circle cx="10" cy="6" r="1.5" />
            <circle cx="10" cy="14" r="1.5" />
            <circle cx="14" cy="6" r="1.5" />
            <circle cx="14" cy="14" r="1.5" />
          </svg>
        </button>

        <input
          type="checkbox"
          checked={item.completed}
          onChange={(event) => {
            void onUpdate(item.id, { completed: event.target.checked });
          }}
          aria-label={`Toggle ${item.text}`}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-300"
        />

        <div className="min-w-0 flex-1">
          {isEditing ? (
            <input
              autoFocus
              value={draftText}
              onChange={(event) => setDraftText(event.target.value)}
              onBlur={commitEdit}
              onKeyDown={(event) => {
                if (event.key === 'Enter') commitEdit();
                if (event.key === 'Escape') {
                  setDraftText(item.text);
                  setIsEditing(false);
                }
              }}
              aria-label={`Edit ${item.text}`}
              className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className={[
                'w-full rounded text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-slate-200',
                item.completed ? 'text-slate-400 line-through' : 'text-slate-700',
              ].join(' ')}
            >
              {item.text}
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            void onDelete(item.id);
          }}
          aria-label={`Delete ${item.text}`}
          className={buttonClasses}
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
  );
};

export default TodoItem;
