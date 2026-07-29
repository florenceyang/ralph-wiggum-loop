# Habit Tracker Implementation Plan

This file tracks **remaining implementation work only** for the Habit Tracker app. `specs/habit-tracker-v3-specifications.md` is the authoritative latest spec; use `specs/habit-tracker-specifications.md` and `specs/habit-tracker-v2-specifications.md` only for baseline details that v3 does not restate.

## Status snapshot

- Green checks: `PYTHONPATH=src pytest tests/` (22 passed), `cd frontend && npx vitest run` (28 passed), `mypy src/ --ignore-missing-imports`, `flake8 src/ tests/`, `cd frontend && npx tsc --noEmit`, `cd frontend && npm run lint`, and `npx playwright test --reporter=list` (5 passed).
- Local-date generation bug (spec v3 §2.2) is fixed: `frontend/src/lib/date.ts` provides shared `formatLocalDate`/`daysInMonth` helpers that never round-trip through UTC; `HabitTable.tsx` and `CalendarView.tsx` both use them.
- `/habits` mounts the React island end-to-end (`src/app/views/habits.py`, `src/app/templates/habits.html`, `frontend/src/main.ts`, `frontend/src/islands/habits/**`).
- `POST /api/entries/bulk` exists in `src/app/views/api_entries.py`, but the frontend does not use it yet (see item 1).
- Calendar overflow badge behavior is implemented in `frontend/src/components/CalendarView.tsx`, covered by `frontend/src/components/__tests__/CalendarView.test.tsx`.
- **The v3 To-Do feature (spec v3 §3) is fully implemented end-to-end:**
  - Backend: `TodoGroup`/`TodoItem` models in `src/app/models/todo.py` (exported from `src/app/models/__init__.py`); Alembic migration `migrations/versions/a1b2c3d4e5f6_create_todo_groups_items.py`; `src/app/views/api_todos.py` with `GET /api/todos`, group CRUD (`POST/PUT/DELETE /api/todos/groups[/:id]`), item CRUD (`POST/PUT/DELETE /api/todos/items[/:id]`), and `PUT /api/todos/reorder`; registered in `src/app/views/__init__.py`. Covered by `tests/test_api_todos.py` (9 tests).
  - Frontend: `@dnd-kit/core` + `@dnd-kit/sortable` added to `frontend/package.json`; `frontend/src/types/todo.ts`; `frontend/src/hooks/useTodos.ts` (optimistic CRUD + reorder with rollback, mirrors `useHabits.ts` conventions); `frontend/src/components/TodoBoard.tsx` / `TodoGroup.tsx` / `TodoItem.tsx` (dnd-kit drag-and-drop within/across groups, inline add/rename/delete for groups and items); mounted in `HabitApp.tsx` below the table/calendar/legend grid. Unit coverage in `frontend/src/hooks/__tests__/useTodos.test.tsx` and `frontend/src/components/__tests__/TodoBoard.test.tsx`.
  - E2E fix: `e2e/habits.spec.ts` used `page.getByLabel('Color')`, which became ambiguous once the To-Do group color pickers (aria-labels containing "color") were added. Switched all 5 usages to `page.getByTestId('habit-editor-color')`.
  - **Migration-chain gotcha for future work:** `migrations/versions/f1a2b3c4d5e6_drop_hello_table.py` has `down_revision = '9b1c2d3e4f5a'`, so `f1a2b3c4d5e6` (not `9b1c2d3e4f5a`) is the true prior head. Any new migration must set `down_revision = 'f1a2b3c4d5e6'` or `flask --app src.app db heads` will show two heads and `db upgrade` will fail.
  - No known remaining gaps for this feature.

## Prioritized remaining work

1. **Finish the v3 habit interaction work (spec v3 §2.3).**
   - `frontend/src/hooks/useHabits.ts` currently issues only single-entry `POST /api/entries` and `DELETE /api/entries/:id`; add a range/bulk mutation that uses the already-existing `POST /api/entries/bulk` endpoint.
   - `frontend/src/components/HabitTable.tsx` and `HabitCell.tsx` still lack pointer-drag marking and `Shift+Click` / `Shift+Arrow` range selection for one habit row.
   - `frontend/src/components/HabitApp.tsx` needs a real undo/redo action history. Current reality: undo is already multi-step for single-cell toggles via `undoStack.current.push()`/`pop()`, but there is no redo stack, and `Ctrl/Cmd+Shift+Z` still falls through to the same undo handler.
   - Extend unit/e2e coverage around range marking, bulk persistence, undo, and redo.

2. **Apply the v3 UI modernization pass (spec v3 §2.1).**
   - `frontend/src/components/HabitTable.tsx`, `HabitCell.tsx`, `CalendarView.tsx`, `HabitEditor.tsx`, and `Legend.tsx` still rely on inline `style={{...}}`; convert these to Tailwind classes, following the layout approach already used in `HabitApp.tsx` and the new `TodoBoard.tsx`/`TodoGroup.tsx`/`TodoItem.tsx`.
   - Redesign the table headers to reduce width pressure (stack weekday over date, or equivalent).
   - Replace the current delete control in `frontend/src/components/HabitTable.tsx` — a bare `✕` button with only `style={{ marginLeft: 6, fontSize: 11 }}` — with a real icon button and proper hover/focus affordances.
   - Replace the current first-letter habit-icon fallback (`icon.charAt(0).toUpperCase()` in `HabitCell.tsx`, `CalendarView.tsx`, and `Legend.tsx`) with a shared SVG/icon renderer so habit identity is an actual shape+color pair.

3. **Close the highest-value carried-forward habit-spec gaps that v3 does not restate in detail.**
   - `frontend/src/components/HabitEditor.tsx` is still create-only; add edit mode for existing habits (name/icon/color/order) or deliberately consolidate editing elsewhere, but stop relying on double-click rename as the only full edit path.
   - `frontend/src/components/HabitTable.tsx` still lacks the sticky header / sticky first column and row-reordering UX described in `specs/habit-tracker-specifications.md`.
   - `frontend/src/components/CalendarView.tsx` currently renders sequential day buttons in a 7-column grid; it is not yet a true month grid with weekday alignment, and its habit markers are non-interactive `span`s rather than focusable controls that can jump back to a habit row/day cell.
   - Secondary cell actions from v1 (notes, clear, repeat weekly, context-menu behavior) are still absent; keep them behind items 1-3 unless scope changes.

4. **Keep docs and validation ergonomics aligned as features land.**
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
- After adding a new Alembic migration: `PYTHONPATH=src flask --app src.app db heads` (must show exactly one head) and `PYTHONPATH=src flask --app src.app db upgrade`.

## Explicit non-goals

- No user authentication or multi-user data separation.
- No real-time WebSockets/SSE sync across tabs or devices.
- Do not edit `specs/*.md` to track implementation status; this file is the status tracker.
