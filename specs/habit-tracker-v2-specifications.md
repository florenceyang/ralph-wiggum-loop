# Habit Tracker v2 — Specification (Gap Analysis & Integration Plan)

This document supersedes/extends `specs/habit-tracker-specifications.md`. The
original spec described the intended feature; this v2 spec documents the
**actual current state of the codebase**, the concrete integration gaps found
during analysis, and the precise plan to close them.

## 1. Gap analysis

The habit-tracker feature is largely built but not wired together:

- **Backend is solid and spec-compliant.** `Habit`/`Entry` models, the
  Alembic migration (`migrations/versions/9b1c2d3e4f5a_create_habits_entries.py`),
  and the REST API (`src/app/views/api_habits.py`, `src/app/views/api_entries.py`)
  implement the full CRUD + bulk contract from the original spec, including
  icon+color uniqueness enforcement. 13 backend pytest tests pass.
- **React components exist and are unit-tested**, but are never assembled or
  rendered anywhere: `frontend/src/components/HabitTable.tsx`,
  `HabitCell.tsx`, `CalendarView.tsx`, `Legend.tsx`, `HabitEditor.tsx`, and
  the `frontend/src/hooks/useHabits.ts` data hook. All have passing vitest
  unit tests (25 total across the frontend suite).
- **The actual bug**: `src/app/templates/habits.html` does not use any of
  the above components. It ships its own separate, hand-rolled vanilla-JS
  list UI (add/delete habit + a "mark today" button) with a duplicated
  icon-glyph map. There is no scrollable day-by-day table and no calendar
  view rendered anywhere in the running app — the two core UI requirements
  from the original spec are simply missing from what a user sees.
- **No island wiring exists for habits.** `frontend/src/main.ts`'s
  `islandRegistry` only registers `game`; there is no
  `frontend/src/islands/habits/` module and no `data-island="habits"` mount
  point in the template.
- **Space Invaders game is still present** (`src/app/views/game.py`,
  `src/app/templates/game.html`, `frontend/src/game/**`,
  `frontend/src/islands/game/**`, `frontend/tests/game/**`,
  `e2e/game.spec.ts`) even though `/` already redirects to `/habits`
  (`src/app/views/game.py`'s `index()` route). This needs full removal since
  the habit tracker replaces it.
- **No e2e coverage** exists for the habit-tracker flows (create habit →
  mark days → verify calendar reflects the same icon/color). The only e2e
  spec in the repo (`e2e/game.spec.ts`) tests the game being removed.

## 2. API contract (as actually implemented)

Confirmed by reading `src/app/views/api_habits.py` and
`src/app/views/api_entries.py` — this is the ground truth the frontend must
integrate against (no backend rewrite planned).

### `GET /api/habits`
Returns `[{id, name, icon, color, order}]`, ordered by `order`.

### `POST /api/habits`
Body: `{name (required), icon?, color?}`. Auto-assigns next icon/color from a
fixed default palette (`DEFAULT_ICONS`, `DEFAULT_COLORS`) when omitted.
Validates `name` (1–255 chars), `icon` (non-empty, ≤64 chars), `color`
(`#RRGGBB` hex). Enforces uniqueness of the `(icon, color)` pair across all
habits — returns `400 {error, conflict_id}` on conflict. Returns `201` with
the created habit on success.

### `PUT /api/habits/:id`
Partial update of `name`/`icon`/`color`/`order`. Same validation and
`(icon, color)` uniqueness enforcement as create (excluding the habit itself).
Returns `404` if not found, `200` with updated habit on success.

### `DELETE /api/habits/:id`
Deletes the habit and cascades delete of its `Entry` rows. Returns
`200 {deleted: true}` or `404`.

### `GET /api/entries?month=YYYY-MM`
Returns `[{id, habit_id, date (YYYY-MM-DD), done, note}]` filtered to the
given month (inclusive whole-month range via `calendar.monthrange`). Omitting
`month` returns all entries. Invalid month format returns `400`.

### `POST /api/entries`
Body: `{habit_id, date (YYYY-MM-DD), done? (default true), note?}`. Upserts:
updates the existing entry for that `(habit_id, date)` pair if present,
otherwise creates it. Returns `404` if `habit_id` doesn't exist, `400` for
missing fields or bad date format, `200` with the entry.

### `POST /api/entries/bulk`
Body: `{entries: [{habit_id, date, done?, note?}, ...]}`. Same upsert
semantics as single POST, applied transactionally (`db.session.begin_nested`).
Returns `200 {updated: [...]}` or `400`/`404`/`500` on the first error.

### `DELETE /api/entries/:id`
Deletes a single entry. Returns `200 {deleted: true}` or `404`.

### `PATCH /api/entries/:id`
Partial update of `done` and/or `note` on an existing entry. Returns `200`
with updated entry or `404`.

## 3. Frontend integration contract to build

### `HabitApp` container component
New file: `frontend/src/components/HabitApp.tsx`. Responsibilities:
- Uses `useHabits()` for habits list, per-month entries cache, and the
  `toggle(habitId, date)` mutation.
- Owns `selectedMonth` state (`YYYY-MM`, default: current month) with a month
  selector control that both `HabitTable` and `CalendarView` read from.
- Composes:
  - `HabitEditor` — create/edit a habit (name, icon, color); surfaces `400`
    uniqueness-conflict errors from the API rather than duplicating the
    check client-side.
  - `HabitTable` — the editable, scrollable table; single click toggles a
    cell via `toggle()`; each habit's cells always render that habit's
    assigned icon+color.
  - `CalendarView` — month grid showing each day's marked habit icons
    (up to 4 + overflow indicator per original spec), synced to
    `selectedMonth`.
  - `Legend` — maps icon+color → habit name; clicking an entry
    filters/highlights that habit across both `HabitTable` and
    `CalendarView`.
- Wires bidirectional sync: clicking a calendar day scrolls/focuses the
  corresponding table column; clicking a legend item toggles
  filter/highlight state shared by both child views.
- New test file: `frontend/src/components/__tests__/HabitApp.test.tsx`,
  mocking `fetch`, covering: initial load, creating a habit, toggling a
  cell, and asserting the same icon/color renders in both the table and the
  calendar for that habit.

### `habits` island
New files:
- `frontend/src/islands/habits/HabitsIsland.tsx` — thin wrapper rendering
  `<HabitApp />`.
- `frontend/src/islands/habits/index.tsx` — exports `mount(element, props)`
  using `createRoot`, mirroring the existing `frontend/src/islands/game/index.tsx`
  pattern.
- Register `habits: () => import('./islands/habits')` in the
  `islandRegistry` map in `frontend/src/main.ts`.

### Template
Replace all inline vanilla-JS in `src/app/templates/habits.html` with a
single mount point:
```html
<div data-island="habits" data-props='{}'>
  <noscript><p>JavaScript is required to use the Habit Tracker.</p></noscript>
</div>
```
Retain the page heading/intro copy but drop the "minimal client app"
disclaimer now that the full spec'd UI is present.

## 4. Space Invaders removal

Files/routes to delete or update as part of replacing the game with the
habit tracker (root already redirects to `/habits`, so this is cleanup, not
a behavior change):
- Delete: `src/app/views/game.py`, `src/app/templates/game.html`,
  `frontend/src/game/**`, `frontend/src/islands/game/**`,
  `frontend/tests/game/**`, `e2e/game.spec.ts`.
- Move the `/` → `/habits` redirect into `src/app/views/habits.py` (or a
  minimal root blueprint); update `src/app/views/__init__.py` to drop the
  `game_bp` registration.
- Remove the `game` entry from `islandRegistry` in `frontend/src/main.ts`.
- Update `tests/test_game_view.py` → rename to `tests/test_habits_view.py`,
  keeping the redirect + habits-page-shell assertions, dropping
  game-specific docstrings/content.

## 5. E2E test scenarios to add

New file `e2e/habits.spec.ts` (replacing `e2e/game.spec.ts`):
1. `/` redirects to `/habits`; page title contains "Habits".
2. Create a habit (name + icon + color) via the editor UI.
3. Mark a day cell in the table for that habit; assert the identical
   icon+color marker appears in the corresponding day cell in the calendar
   view.
4. Create a second habit with a different icon/color; confirm both table
   and calendar visually differentiate the two habits (distinct icon+color
   combinations), matching the spec's "Key rule (icons & identity)".

## 6. Validation commands

- `PYTHONPATH=src pytest tests/` — backend unit/integration tests.
- `cd frontend && npx vitest run` — frontend unit tests.
- `npx playwright test --reporter=list` — e2e tests (auto-starts dev servers).
- `script/typecheck` — `mypy` + `tsc`.
- `script/lint` — `flake8` + `eslint`.

## 7. Non-goals for this iteration

- No new DB schema/migration changes — `Habit`/`Entry` models and the
  existing migration already satisfy the data model in
  `specs/habit-tracker-specifications.md`.
- No changes to the original `specs/habit-tracker-specifications.md` file;
  this document supplements it with implementation-accurate detail rather
  than replacing it.
- No real-time multi-device sync (WebSockets/SSE) — explicitly deferred in
  the original spec as a v2+ item and out of scope here.
