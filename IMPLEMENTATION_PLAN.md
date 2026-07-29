# Habit Tracker Implementation Plan

This plan tracks the remaining work after the habit-tracker integration pass
documented in `specs/habit-tracker-v2-specifications.md`. The original
habit-tracker spec remains the product reference; this file is the execution
status and forward plan.

## Status snapshot

- Backend data model, migrations, API, and API tests are in place.
- The real app now mounts the React habit tracker at `/habits`; the old
  duplicate vanilla-JS habits UI is gone.
- The obsolete Space Invaders app and its tests have been removed.
- Validation is green across pytest, vitest, mypy, flake8, TypeScript, eslint,
  and Playwright.

## 2026-07-29 completed increment

### Habit tracker wiring fixed in the running app

Resolved the core integration bug where habit React components existed but were
never rendered in production.

- Added composition root: `frontend/src/components/HabitApp.tsx`
- Added island wrapper + mount entry:
  - `frontend/src/islands/habits/HabitsIsland.tsx`
  - `frontend/src/islands/habits/index.tsx`
  - `frontend/src/main.ts`
- Replaced the old hand-rolled template UI with a single island mount:
  - `src/app/templates/habits.html`
- Extended existing components/hooks so the mounted app supports:
  - month navigation
  - shared legend filtering across table + calendar
  - calendar-day click → table column highlight/scroll sync
  - inline rename/delete
  - add/update/remove habit flows
  - single-level Ctrl/Cmd+Z undo for the last cell toggle
- Files updated for that wiring:
  - `frontend/src/components/HabitTable.tsx`
  - `frontend/src/components/CalendarView.tsx`
  - `frontend/src/components/Legend.tsx`
  - `frontend/src/hooks/useHabits.ts`
- Tests added/updated:
  - `frontend/src/components/__tests__/HabitApp.test.tsx`
  - `e2e/habits.spec.ts`

### Obsolete game code removed

Removed unreachable Space Invaders/game code now that the app is habit-tracker
only.

- Deleted:
  - `src/app/views/game.py`
  - `src/app/templates/game.html`
  - `frontend/src/game/**`
  - `frontend/src/islands/game/**`
  - `frontend/tests/game/**`
  - `e2e/game.spec.ts`
- Moved the root redirect into:
  - `src/app/views/habits.py`
- Updated blueprint registration:
  - `src/app/views/__init__.py`
- Replaced/renamed route test:
  - `tests/test_habits_view.py`

### Alembic duplicate-heads bug fixed

Fixed a real migration-chain bug that previously broke fresh setup and upgrade.

- Updated:
  - `migrations/versions/f1a2b3c4d5e6_drop_hello_table.py`
- Resulting chain is now linear:
  - `e31396db40b1_create_hello_table.py`
  - `9b1c2d3e4f5a_create_habits_entries.py`
  - `f1a2b3c4d5e6_drop_hello_table.py`

### Frontend typecheck/lint baseline fixed

Fixed pre-existing frontend validation failures that blocked clean verification.

- Updated:
  - `frontend/tsconfig.json`
  - `frontend/eslint.config.js`
  - `frontend/src/components/HabitTable.tsx`
- Added:
  - `frontend/src/test-globals.d.ts`
- Cleaned test files to remove obsolete `import React` lines and support
  `global.fetch` stubs under TypeScript/eslint.

## Completed plan items

1. **Backend models + migration** — done
   - `src/app/models/habit.py`
   - `src/app/models/entry.py`
   - `migrations/versions/9b1c2d3e4f5a_create_habits_entries.py`
   - `tests/models/test_habit_entry.py`

2. **Backend REST API** — done
   - `src/app/views/api_habits.py`
   - `src/app/views/api_entries.py`
   - `tests/test_api_habits.py`
   - `tests/test_api_entries.py`

3. **Server-side validation + icon/color uniqueness** — done
   - `tests/test_api_habits_validation.py`

4. **Bulk entries endpoint** — done
   - `tests/test_api_entries_bulk.py`

5. **Frontend core components + hook are now truly wired** — done
   - Previously missing runtime integration is resolved by `HabitApp`,
     `frontend/src/islands/habits/**`, `frontend/src/main.ts`, and the rewritten
     `src/app/templates/habits.html`.

6. **`/habits` route + root redirect** — done
   - Served from `src/app/views/habits.py`
   - Verified by `tests/test_habits_view.py`

## 2026-07-29 completed increment (item 7: keyboard navigation + a11y fix)

### Arrow-key grid navigation implemented in HabitTable/HabitCell

Closed the accessibility gap flagged in the plan: cells were only reachable
one Tab stop at a time (Enter/Space toggle existed, but no arrow-key movement
and no roving tabindex), and cell `aria-label`s used the raw icon id instead
of the habit name (spec: `"Habit: <name> — <date> — marked/unmarked"`).

- `frontend/src/components/HabitCell.tsx`
  - Converted to `React.forwardRef` so the table can hold direct DOM refs
    per cell for imperative `.focus()` calls.
  - Added `name`, `tabIndex`, `onArrow`, `onFocusCell` props.
  - Fixed `aria-label` to use `name` (falls back to `icon` only if no name
    is supplied) instead of always using the icon string.
  - `ArrowUp/Down/Left/Right/Home/End` are intercepted in `onKeyDown` and
    forwarded via `onArrow(date, key)`; Enter/Space toggle behavior is
    unchanged.
- `frontend/src/components/HabitTable.tsx`
  - Added a `cellRefs` matrix (`(HTMLButtonElement | null)[][]`) and
    `activeCell` state implementing the standard grid **roving tabindex**
    pattern: exactly one cell has `tabIndex=0` at a time, all others `-1`.
  - `handleArrow` maps Up/Down to habit rows and Left/Right to day columns,
    clamped to grid bounds; Home/End jump to first/last day in the row.
  - `onFocusCell` keeps `activeCell` in sync when focus moves via Tab (not
    just arrow keys), and a `useEffect` clamps `activeCell` when habits or
    the visible day count shrinks (habit deleted, month changed) so a tab
    stop always exists.
- Tests:
  - `frontend/src/components/__tests__/HabitTable.test.tsx` — added cases
    for: correct `aria-label` using habit name, single tab-stop via roving
    tabindex, and full arrow/Home/End navigation across rows and columns.
  - `e2e/habits.spec.ts` — added
    `supports arrow-key navigation between table cells`, exercising
    ArrowRight/Left/Down focus movement across two habit rows plus
    Space-to-toggle on the newly focused cell.

Validation for this increment: `frontend` vitest (14 passed), `tsc --noEmit`
(clean), `eslint` (clean), `pytest` (13 passed, unaffected), `mypy`/`flake8`
(clean, unaffected), `playwright test e2e/habits.spec.ts` (5 passed).

## Remaining work

7. **Bulk marking, range selection, and full undo/redo** (HIGH)
   - Remaining gap:
     - shift+click bulk marking
     - drag/range selection
     - Shift+Arrow keyboard range selection
     - multi-step undo/redo stack
     - bulk API integration for range operations
   - Current state:
     - only single-cell toggle exists
     - only basic single-level Ctrl/Cmd+Z undo exists
   - Primary files:
     - `frontend/src/components/HabitTable.tsx`
     - `frontend/src/components/HabitCell.tsx`
     - `frontend/src/hooks/useHabits.ts`
   - Spec refs:
     - `specs/habit-tracker-specifications.md` — editing/interactions

8. **Calendar overflow, richer cell actions, and remaining UX parity** (MEDIUM)
   - Remaining gap:
     - overflow-state verification/snapshots for days with many habits
     - context menu / secondary cell actions (note, clear, repeat weekly)
     - row reordering UI that persists the existing `order` field
     - HabitEditor modal UX from the wireframe is still not implemented;
       current behavior is create-only editor + inline rename in the table
   - Current state:
     - calendar renders and stays in sync with the table
     - legend-based filtering works in both views
   - Primary files:
     - `frontend/src/components/CalendarView.tsx`
     - `frontend/src/components/HabitEditor.tsx`
     - `frontend/src/components/HabitTable.tsx`

9. **Performance / virtualization for large habit counts** (LOW→MEDIUM)
    - Table row virtualization is still unimplemented.
    - Keep deferred unless real habit counts make the current DOM size painful.
    - Primary file:
      - `frontend/src/components/HabitTable.tsx`

10. **Docs / CI follow-through** (LOW)
    - Keep developer docs and CI expectations aligned with the current
      habit-only app and validation suite.
    - Relevant files:
      - `README.md`
      - CI/workflow config if present

## Validation baseline after the 2026-07-29 pass (keyboard nav increment)

- `PYTHONPATH=src pytest tests/` → 13 passed
- `cd frontend && npx vitest run` → 14 passed
- `mypy src/ --ignore-missing-imports` → clean
- `flake8 src/ tests/` → clean
- `cd frontend && npx tsc --noEmit` → clean
- `cd frontend && npm run lint` → clean
- `npx playwright test --reporter=list` → 5 passed

## Explicit non-goals for the next iteration

- No new DB schema changes are required for the next UI-focused pass.
- Do not edit `specs/*.md` to track implementation status.
- Real-time sync remains out of scope.
