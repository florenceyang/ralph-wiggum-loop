# Habit Tracker Implementation Plan

This file tracks **remaining implementation work only** for the Habit Tracker app. `specs/habit-tracker-v3-specifications.md` is the authoritative latest spec; use `specs/habit-tracker-specifications.md` and `specs/habit-tracker-v2-specifications.md` only for baseline details that v3 does not restate.

## Status snapshot

- As of this review, the already-established green checks are: `PYTHONPATH=src pytest tests/`, `cd frontend && npx vitest run`, `mypy src/ --ignore-missing-imports`, `flake8 src/ tests/`, and `cd frontend && npx tsc --noEmit`.
- Local-date generation bug (spec v3 §2.2) is fixed: `frontend/src/lib/date.ts` now provides shared `formatLocalDate`/`daysInMonth` helpers that never round-trip through UTC; `HabitTable.tsx` and `CalendarView.tsx` both use them, and `frontend/src/lib/__tests__/date.test.ts` plus the updated `HabitApp.test.tsx` fixtures assert local-day-key correctness.
- `/habits` already mounts the React island end-to-end (`src/app/views/habits.py`, `src/app/templates/habits.html`, `frontend/src/main.ts`, `frontend/src/islands/habits/**`), and the existing Habit/Entry backend API is already wired to the current React UI.
- `POST /api/entries/bulk` already exists in `src/app/views/api_entries.py`, but the frontend does not use it yet.
- Calendar overflow badge behavior is already implemented in `frontend/src/components/CalendarView.tsx` and already covered by `frontend/src/components/__tests__/CalendarView.test.tsx`.
- No To-Do feature exists yet: no Todo models, no Todo migration, no `src/app/views/api_todos.py`, no Todo hook/components, and no `@dnd-kit/*` dependency in `frontend/package.json`.

## Prioritized remaining work

1. **Build the v3 To-Do feature next (net-new feature, spec v3 §3).**
   - **Backend models:** add `TodoGroup` and `TodoItem` under `src/app/models/`, then export them from `src/app/models/__init__.py`.
   - **Migration:** add a new Alembic migration in `migrations/versions/` for `todo_groups` and `todo_items`.
   - **API:** add `src/app/views/api_todos.py` with `GET /api/todos`, group CRUD, item CRUD, and `PUT /api/todos/reorder`; register it in `src/app/views/__init__.py`.
   - **Backend tests:** add targeted pytest coverage for todo CRUD, validation, reorder persistence, and moving items across groups.
   - **Frontend dependencies/types:** add `@dnd-kit/core` and `@dnd-kit/sortable` in `frontend/package.json`, and add Todo types where they will actually be shared.
   - **Frontend hook:** add `frontend/src/hooks/useTodos.ts` for fetching, optimistic CRUD, and reorder syncing.
   - **Frontend components:** add `frontend/src/components/TodoBoard.tsx`, `TodoGroup.tsx`, and `TodoItem.tsx`.
   - **Mounting/integration:** render `TodoBoard` from `frontend/src/components/HabitApp.tsx` below the existing habit table/calendar layout.
   - **Frontend + E2E tests:** add unit coverage for the hook/components and Playwright coverage for create group, add item, toggle complete, reorder within a group, move across groups, and delete.

2. **Finish the v3 habit interaction work (spec v3 §2.3).**
   - `frontend/src/hooks/useHabits.ts` currently issues only single-entry `POST /api/entries` and `DELETE /api/entries/:id`; add a range/bulk mutation that uses the already-existing `POST /api/entries/bulk` endpoint.
   - `frontend/src/components/HabitTable.tsx` and `HabitCell.tsx` still lack pointer-drag marking and `Shift+Click` / `Shift+Arrow` range selection for one habit row.
   - `frontend/src/components/HabitApp.tsx` needs a real undo/redo action history. Current reality: undo is already multi-step for single-cell toggles via `undoStack.current.push()`/`pop()`, but there is no redo stack, and `Ctrl/Cmd+Shift+Z` still falls through to the same undo handler.
   - Extend unit/e2e coverage around range marking, bulk persistence, undo, and redo.

3. **Apply the v3 UI modernization pass (spec v3 §2.1).**
   - `frontend/src/components/HabitTable.tsx`, `HabitCell.tsx`, `CalendarView.tsx`, `HabitEditor.tsx`, and `Legend.tsx` still rely on inline `style={{...}}`; convert these to Tailwind classes, following the layout approach already used in `HabitApp.tsx`.
   - Redesign the table headers to reduce width pressure (stack weekday over date, or equivalent).
   - Replace the current delete control in `frontend/src/components/HabitTable.tsx` — a bare `✕` button with only `style={{ marginLeft: 6, fontSize: 11 }}` — with a real icon button and proper hover/focus affordances.
   - Replace the current first-letter habit-icon fallback (`icon.charAt(0).toUpperCase()` in `HabitCell.tsx`, `CalendarView.tsx`, and `Legend.tsx`) with a shared SVG/icon renderer so habit identity is an actual shape+color pair.

4. **Close the highest-value carried-forward habit-spec gaps that v3 does not restate in detail.**
   - `frontend/src/components/HabitEditor.tsx` is still create-only; add edit mode for existing habits (name/icon/color/order) or deliberately consolidate editing elsewhere, but stop relying on double-click rename as the only full edit path.
   - `frontend/src/components/HabitTable.tsx` still lacks the sticky header / sticky first column and row-reordering UX described in `specs/habit-tracker-specifications.md`.
   - `frontend/src/components/CalendarView.tsx` currently renders sequential day buttons in a 7-column grid; it is not yet a true month grid with weekday alignment, and its habit markers are non-interactive `span`s rather than focusable controls that can jump back to a habit row/day cell.
   - Secondary cell actions from v1 (notes, clear, repeat weekly, context-menu behavior) are still absent; keep them behind items 1-4 unless scope changes.

5. **Keep docs and validation ergonomics aligned as features land.**
   - Update `README.md` and CI/workflow notes only when the implemented behavior or required commands actually change.
   - Do not edit `specs/*.md` to track status; this file remains the execution tracker.

## Validation commands

- `PYTHONPATH=src pytest tests/`
- `cd frontend && npx vitest run`
- `mypy src/ --ignore-missing-imports`
- `flake8 src/ tests/`
- `cd frontend && npx tsc --noEmit`
- `cd frontend && npm run lint`
- `npx playwright test --reporter=list`
- After adding the To-Do migration: `flask --app src.app db heads` and `flask --app src.app db upgrade`

## Explicit non-goals

- No user authentication or multi-user data separation.
- No real-time WebSockets/SSE sync across tabs or devices.
- Do not edit `specs/*.md` to track implementation status; this file is the status tracker.
