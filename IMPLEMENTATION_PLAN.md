# Habit Tracker Implementation Plan

This file tracks **remaining implementation work only** for the Habit Tracker app. `specs/habit-tracker-v3-specifications.md` is the authoritative latest spec; use `specs/habit-tracker-specifications.md` and `specs/habit-tracker-v2-specifications.md` only for baseline details that v3 does not restate.

## Status snapshot

- Green checks: `PYTHONPATH=src pytest tests/` (22 passed), `cd frontend && npx vitest run` (42 passed), `mypy src/ --ignore-missing-imports`, `flake8 src/ tests/`, `cd frontend && npx tsc --noEmit`, `cd frontend && npm run lint`, and `npx playwright test --reporter=list` (5 passed).
- Local-date generation bug (spec v3 §2.2) is fixed: `frontend/src/lib/date.ts` provides shared `formatLocalDate`/`daysInMonth` helpers that never round-trip through UTC; `HabitTable.tsx` and `CalendarView.tsx` both use them.
- `/habits` mounts the React island end-to-end (`src/app/views/habits.py`, `src/app/templates/habits.html`, `frontend/src/main.ts`, `frontend/src/islands/habits/**`).
- Calendar overflow badge behavior is implemented in `frontend/src/components/CalendarView.tsx`, covered by `frontend/src/components/__tests__/CalendarView.test.tsx`.
- **The v3 To-Do feature (spec v3 §3) is fully implemented end-to-end:**
  - Backend: `TodoGroup`/`TodoItem` models in `src/app/models/todo.py` (exported from `src/app/models/__init__.py`); Alembic migration `migrations/versions/a1b2c3d4e5f6_create_todo_groups_items.py`; `src/app/views/api_todos.py` with `GET /api/todos`, group CRUD (`POST/PUT/DELETE /api/todos/groups[/:id]`), item CRUD (`POST/PUT/DELETE /api/todos/items[/:id]`), and `PUT /api/todos/reorder`; registered in `src/app/views/__init__.py`. Covered by `tests/test_api_todos.py` (9 tests).
  - Frontend: `@dnd-kit/core` + `@dnd-kit/sortable` added to `frontend/package.json`; `frontend/src/types/todo.ts`; `frontend/src/hooks/useTodos.ts` (optimistic CRUD + reorder with rollback, mirrors `useHabits.ts` conventions); `frontend/src/components/TodoBoard.tsx` / `TodoGroup.tsx` / `TodoItem.tsx` (dnd-kit drag-and-drop within/across groups, inline add/rename/delete for groups and items); mounted in `HabitApp.tsx` below the table/calendar/legend grid. Unit coverage in `frontend/src/hooks/__tests__/useTodos.test.tsx` and `frontend/src/components/__tests__/TodoBoard.test.tsx`.
  - E2E fix: `e2e/habits.spec.ts` used `page.getByLabel('Color')`, which became ambiguous once the To-Do group color pickers (aria-labels containing "color") were added. Switched all 5 usages to `page.getByTestId('habit-editor-color')`.
  - **Migration-chain gotcha for future work:** `migrations/versions/f1a2b3c4d5e6_drop_hello_table.py` has `down_revision = '9b1c2d3e4f5a'`, so `f1a2b3c4d5e6` (not `9b1c2d3e4f5a`) is the true prior head. Any new migration must set `down_revision = 'f1a2b3c4d5e6'` or `flask --app src.app db heads` will show two heads and `db upgrade` will fail.
  - No known remaining gaps for this feature.
- **The v3 habit interaction work (spec v3 §2.3) is now implemented end-to-end:**
  - `frontend/src/hooks/useHabits.ts` gained `isDone(habitId, date)` (synchronous cache lookup) and `bulkSetEntries(items)` (optimistic multi-entry mutation via the existing `POST /api/entries/bulk`, with per-item rollback on failure). The original single-entry `toggle`/`updateHabit`/`removeHabit` are unchanged.
  - `frontend/src/components/HabitCell.tsx`: added `onCellMouseDown`/`onCellMouseEnter` (pointer-drag), `onShiftToggle` (Shift+Click), `onShiftArrow` (Shift+ArrowLeft/Right), and a `previewDone` prop that renders a dashed preview outline for cells inside an in-progress drag — all additive, so the existing single-arg `onToggle`/`onArrow` contracts (and their tests) are untouched.
  - `frontend/src/components/HabitTable.tsx`: row-scoped pointer-drag marking (`mousedown` anchors a drag with `targetDone = !isMarked(anchorCell)`, `mouseenter` extends it, a `window` `mouseup` listener commits the whole range as one `onRangeToggle` call — but only if the pointer actually moved to a different column, so a plain click still goes through the normal single-cell `onToggle` path and isn't double-applied). Shift+Click and Shift+ArrowLeft/Right share a `shiftAnchor` ref-based "range session" so repeated Shift+Arrow presses extend the same range instead of restarting it; any plain (non-shift) interaction resets the session. Drag state is mirrored into a `dragStateRef` so the `mouseup` handler and `commitRange` call happen as plain function calls (not inside a `setDragState` functional updater), avoiding a "setState during another component's render" React warning that briefly appeared during implementation.
  - `frontend/src/components/HabitApp.tsx`: replaced the single-level undo array with `undoStack`/`redoStack` of `Action = Change[]` (`Change = {habitId, date, prevDone, nextDone}`). A single toggle pushes a 1-change action; a drag/Shift-range push pushes one action covering every date in the range, so the whole range undoes/redoes atomically. `Ctrl/Cmd+Z` undoes (`applyAction(action, 'prevDone')`), `Ctrl/Cmd+Shift+Z` redoes (`applyAction(action, 'nextDone')`) via `bulkSetEntries`; any new action clears the redo stack.
  - Test coverage added: `HabitTable.test.tsx` (drag commits a range; a same-cell mousedown/mouseup does _not_ double-fire; Shift+Click range; repeated Shift+ArrowRight extends the same range session), `HabitApp.test.tsx` (multi-step undo+redo of a single toggle; undo of a whole drag range in one Ctrl+Z).
  - Remaining polish not yet done (low priority): no e2e Playwright coverage for drag/shift-range/undo-redo yet (unit coverage is the primary signal); no visual regression check for the dashed preview styling.

## Prioritized remaining work

1. **v3 UI modernization pass (spec v3 §2.1) — done.**
   - `HabitTable.tsx`, `HabitCell.tsx`, `CalendarView.tsx`, `HabitEditor.tsx`, and `Legend.tsx` now use Tailwind utility classes for all static layout/hover/focus styling; only genuinely dynamic per-habit `color` values (and derived border/background shades) remain inline `style`, since Tailwind's static class scanner can't see runtime color strings.
   - Table headers now stack weekday over day-number (`Wed` / `1`) instead of one wide `"Wed 1"` label, reducing per-column width pressure.
   - `HabitTable.tsx` has a sticky header row (`sticky top-0`) and sticky first column (`sticky left-0`) so both stay visible while scrolling a long habit list or month.
   - The delete control is now a real icon button (trash SVG, `habit-delete-<id>` testid) with hover/focus affordances, laid out in a `flex gap-1` row next to a new edit icon button — no more stacking on the habit name.
   - `frontend/src/components/HabitIcon.tsx` is a new shared component rendering a real SVG shape (heart/diamond/circle/square/star/triangle, falling back to a filled circle for any unrecognized icon name) in the habit's color; `HabitCell`, `CalendarView`, and `Legend` all use it instead of `icon.charAt(0).toUpperCase()`. Covered by `frontend/src/components/__tests__/HabitIcon.test.tsx`.
   - Investigated the "table/calendar starts on day 30/31" note: `frontend/src/lib/date.ts`'s `daysInMonth` already iterates `d = 1..numDays` — this was already correct (likely fixed alongside the local-date bug logged above) and required no change; verified via `frontend/src/lib/__tests__/date.test.ts` and the new `CalendarView.test.tsx` day-1-alignment test.

2. **Carried-forward habit-spec gaps — mostly closed.**
   - `frontend/src/components/HabitEditor.tsx` now supports edit mode: pass `habit={habitOrNull}` + `onSave`/`onCancel` to pre-fill name/icon/color and PUT via `onSave` instead of POSTing a new habit. `HabitApp.tsx` wires this to each row's new "Edit" icon button (`habit-edit-<id>` testid) via `useHabits().updateHabit`. Double-click-to-rename on the name cell still works as a quick shortcut but is no longer the only full edit path. Covered by `HabitEditor.test.tsx` ("edit mode pre-fills...") and `HabitApp.test.tsx` ("opens the full edit form...").
   - `HabitTable.tsx` now has sticky header/first column (see item 1). Row-reordering (drag-to-reorder habits, persisting `order`) is **still not implemented** — remains open below.
   - `CalendarView.tsx` is now a true month grid: weekday header row (`Sun`..`Sat`) plus leading blank cells so day 1 aligns under its real local weekday (`new Date(days[0]).getDay()`), and each habit marker is a focusable `<button>` (not a `<span>`) with an `onMarkerClick(habitId, date)` callback; `HabitApp.tsx` wires this to scroll/focus the habit's table row (`habit-row-<id>` testid) and highlight+focus the target day cell. Covered by `CalendarView.test.tsx` (day-1 alignment, marker click).
   - Secondary cell actions from v1 (notes, clear, repeat weekly, context-menu behavior) are **still absent** — no scope change yet; see below.

## Remaining open items

- **Row-reordering UX for habits** (persist `order` via drag-and-drop in `HabitTable.tsx`, mirroring the `@dnd-kit` pattern already used in `TodoBoard.tsx`/`TodoGroup.tsx`). Not started.
- **Secondary cell actions from v1** (notes, clear-cell, repeat-weekly, right-click/context-menu on a `HabitCell`) — not started; lowest priority of the remaining gaps.
- No e2e Playwright coverage yet for: habit edit-mode flow, calendar marker-click jump-to-row, or drag/shift-range/undo-redo (unit coverage is the primary signal for the latter three).

## Docs and validation ergonomics

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
