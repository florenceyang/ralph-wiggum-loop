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

## Remaining work

7. **Accessibility + keyboard navigation between cells** (HIGH)
   - Remaining gap:
     - arrow-key navigation across the table grid is still not implemented
     - keyboard focus movement between days/habits needs explicit coverage
     - add/verify ARIA labels and screen-reader text for the mounted grid
   - Already done and should not be re-opened:
     - Enter/Space toggle within a focused cell
     - legend filtering shared by table + calendar
     - calendar-day click highlighting the corresponding table column
   - Primary files:
     - `frontend/src/components/HabitTable.tsx`
     - `frontend/src/components/HabitCell.tsx`
     - `frontend/src/components/CalendarView.tsx`
   - Test follow-up:
     - extend `frontend/src/components/__tests__/HabitApp.test.tsx`
     - add keyboard-focused e2e coverage in `e2e/habits.spec.ts`

8. **Bulk marking, range selection, and full undo/redo** (HIGH)
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

9. **Calendar overflow, richer cell actions, and remaining UX parity** (MEDIUM)
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

10. **Performance / virtualization for large habit counts** (LOW→MEDIUM)
    - Table row virtualization is still unimplemented.
    - Keep deferred unless real habit counts make the current DOM size painful.
    - Primary file:
      - `frontend/src/components/HabitTable.tsx`

11. **Docs / CI follow-through** (LOW)
    - Keep developer docs and CI expectations aligned with the current
      habit-only app and validation suite.
    - Relevant files:
      - `README.md`
      - CI/workflow config if present

## Validation baseline after the 2026-07-29 pass

- `PYTHONPATH=src pytest tests/` → 13 passed
- `cd frontend && npx vitest run` → 11 passed
- `mypy src/ --ignore-missing-imports` → clean
- `flake8 src/ tests/` → clean
- `cd frontend && npx tsc --noEmit` → clean
- `cd frontend && npm run lint` → clean
- `npx playwright test --reporter=list` → 4 passed

## Explicit non-goals for the next iteration

- No new DB schema changes are required for the next UI-focused pass.
- Do not edit `specs/*.md` to track implementation status.
- Real-time sync remains out of scope.
