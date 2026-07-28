# Updates

- [x] Backend models & migration implemented (migrations/versions/9b1c2d3e4f5a_create_habits_entries.py)
- Tests added: tests/models/test_habit_entry.py — verified passing

1. Backend: Add Habit & Entry models + DB migration (HIGH)
   - What: Create SQLAlchemy models Habit and Entry and an Alembic migration to create tables.
   - Why: Core persistent data missing; API and tests depend on schema.
   - Files / refs:
     - Spec: specs/habit-tracker-specifications.md — "Data model" (lines ~32–36).
     - Missing: create src/app/models/habit.py and src/app/models/entry.py.
     - Migration: create migrations/versions/<rev>\_create_habits_entries.py (no existing migration for habits; see existing hello migration: migrations/versions/e31396db40b1_create_hello_table.py).
     - Tests: add tests/models/test_habit_entry.py
   - Risk/complexity: high
   - Owner/area: backend (models, migrations, DB)
   - Notes: follow timestamp/UUID columns and indexes for (habit_id, date) queries; use same db instance in src/app/models/base.py.

2. Backend: Implement REST API endpoints per spec (HIGH) — PARTIALLY COMPLETED
   - What (initial): Implement GET/POST for /api/habits and GET/POST for /api/entries (basic create/list/update semantics). Remaining: PUT/DELETE for habits, DELETE for entries, and POST /api/entries/bulk.
   - Why: Client depends on these to persist/retrieve habits and entries.
   - Files / refs (added):
     - src/app/views/api_habits.py (GET /api/habits, POST /api/habits)
     - src/app/views/api_entries.py (GET /api/entries?month=YYYY-MM, POST /api/entries)
     - Updated: src/app/views/__init__.py to register new blueprints
     - Tests added: tests/test_api_habits.py, tests/test_api_entries.py
   - Status: targeted tests for the above endpoints passed (2 tests) in CI-local run.
   - Next work: add PUT/DELETE endpoints, implement /api/entries/bulk with transactional behavior, and add validation schemas and stronger uniqueness checks per-user.
   - Risk/complexity: high
   - Owner/area: backend (API)

3. Backend: Enforce icon+color uniqueness & validation (MEDIUM)
   - What: Validate that (icon, color) pair is unique per user; return 400 on violation; server-side defaults if icon/color absent.
   - Why: Business rule in spec (icon+color uniqueness).
   - Files / refs:
     - Spec: specs/habit-tracker-specifications.md — "Business rule" (lines ~34–36) and "API notes" (line ~48).
     - Implement in models/habit.py + API input validation layer (schemas or marshmallow/pydantic).
     - Tests: unit tests for validation.
   - Risk/complexity: medium
   - Owner/area: backend (models + controllers)

4. Backend: Bulk entries endpoint (POST /api/entries/bulk) + transactional behavior (MEDIUM)
   - What: Implement efficient bulk create/update with DB transaction and validation of date ranges.
   - Files / refs:
     - Spec: specs/habit-tracker-specifications.md — "/api/entries/bulk" (line ~46).
     - New endpoint: src/app/views/api_entries.py
     - Tests: tests/test_api_entries_bulk.py
   - Risk/complexity: medium
   - Owner/area: backend (API)

5. Frontend: Implement core components and data hook (HIGH)
   - What: Implement components listed in spec: HabitTable, HabitCell, CalendarView, Legend, HabitEditor, and client hook useHabits.ts (optimistic updates + monthly caching).
   - Files / refs:
     - Spec: specs/habit-tracker-specifications.md — "Files & components" (lines ~105–113) and multiple UI sections (table/calendar/legend).
     - New files: frontend/src/components/HabitTable.tsx, HabitCell.tsx, CalendarView.tsx, Legend.tsx, HabitEditor.tsx; frontend/src/hooks/useHabits.ts.
     - Tests: frontend unit tests for each component (frontend/tests/components/\*).
   - Risk/complexity: high
   - Owner/area: frontend (UI, hooks)

6. UX: Add /habits route and root redirect/migration (MEDIUM)
   - What: Add route /habits (server-side template for islands) and decide whether root '/' should redirect to /habits (spec suggests replacing Hello World).
   - Files / refs:
     - Current root: src/app/views/game.py — index() route serves Space Invaders (lines 16–23).
     - Spec: specs/habit-tracker-specifications.md — "Route: /habits replaces Hello World" (line ~57).
     - Update templates: a new templates/habits.html that mounts the habit islands.
     - Tests: update tests/test_game_view.py or add new tests to assert /habits exists and root redirects if chosen.
   - Risk/complexity: medium
   - Owner/area: backend + frontend (routing/templates)

7. Frontend: Accessibility & keyboard nav (HIGH)
   - What: Implement ARIA attributes, keyboard focus handling, and screen-reader labels described in spec.
   - Files / refs:
     - Spec: specs/habit-tracker-specifications.md — "Accessibility" (lines ~69–73) and table interactions (lines ~59–63).
     - Implement in components and add automated accessibility tests (axe, or E2E checks).
     - Tests: integration E2E scripts to cover keyboard navigation.
   - Risk/complexity: medium
   - Owner/area: frontend (a11y)

8. Frontend: Bulk-marking, undo/redo, selection mechanics (MEDIUM)
   - What: Implement shift+click/drag range select, undo/redo stack, keyboard ranges (Shift+Arrows), and bulk API integration.
   - Files / refs:
     - Spec: specs/habit-tracker-specifications.md — "Editing & interactions" (lines ~21–23, ~59–63).
     - Implement in HabitTable + useHabits hooks.
     - Tests: unit + integration tests for selection and undo/redo.
   - Risk/complexity: medium-high
   - Owner/area: frontend (UI & hooks)

9. Frontend: Calendar interactions & overflow rendering (MEDIUM)
   - What: Calendar shows up to 4 icons/day, overflow +N indicator, click-to-focus behavior, tooltips with notes.
   - Files / refs:
     - Spec: specs/habit-tracker-specifications.md — "Calendar view" (lines ~25–31).
     - Implement in CalendarView.tsx; tests and visual snapshots for overflow.
   - Risk/complexity: medium
   - Owner/area: frontend (UI)

10. Tests: Comprehensive test coverage (HIGH)
    - What: Add unit tests for backend models and API, frontend component tests, integration tests for table↔calendar sync, and E2E tests that simulate the user flows in the spec.
    - Files / refs:
      - Spec: specs/habit-tracker-specifications.md — "Testing & validation" (lines ~98–104).
      - New tests: tests/test*api*_.py, frontend/tests/components/_, e2e/ Playwright scenarios for create habit, bulk marking, calendar sync.
      - Use tests/conftest.py fixtures (already present) to run backend tests.
    - Risk/complexity: high
    - Owner/area: tests + frontend + backend

11. Performance & virtualization for large row counts (LOW→MEDIUM)
    - What: Add virtualization for table rows and cap day columns at 31; ensure bulk endpoints are efficient.
    - Files / refs:
      - Spec: specs/habit-tracker-specifications.md — "Performance" (line ~23) and "Visual & implementation notes" (lines ~83–88).
      - Implement using windowing (e.g., react-window) in HabitTable.
    - Risk/complexity: medium
    - Owner/area: frontend

12. Shared utilities: Create src/lib and consolidate common code (LOW)
    - What: Add src/lib for shared utilities (date helpers, icon set, color palette, ARIA helpers, API client wrappers); move duplicates there.
    - Files / refs:
      - Current: no src/lib directory present (note).
      - New: src/lib/icons.py or frontend/src/lib/icons.tsx, src/lib/colors.py, src/lib/date_utils.py.
    - Risk/complexity: low
    - Owner/area: shared (backend/frontend)

13. Docs & README updates (LOW)
    - What: Add migration notes, API docs, and developer setup steps (bootstrap/setup/test commands are documented—update to include habit feature).
    - Files / refs:
      - Update README.md and add specs/api-habits.md / specs/frontend-components.md (see proposed filenames below).
    - Risk/complexity: low
    - Owner/area: docs

14. CI / tests integration (LOW→MEDIUM)
    - What: Ensure CI runs backend tests (pytest), frontend tests (vitest), and E2E (Playwright) as needed; update pipelines to run new tests.
    - Files / refs:
      - Existing scripts: script/test, script/test-e2e (custom).
    - Risk/complexity: low→medium
    - Owner/area: infra / CI

Checks / quick cross-references (high-confidence citations)

- Spec exists: specs/habit-tracker-specifications.md — Data model (lines ~32–36), API (lines ~38–48), UI components (lines ~105–113), Testing (lines ~98–104).
- Current root app serves game island: src/app/views/game.py — index route (lines 16–23).
- No existing habit models or API files: src/app/models/ contains only base.py (src/app/models/**init**.py) and no habit/entry models.
- Migrations: migrations/versions contains hello table migration only (migrations/versions/e31396db40b1_create_hello_table.py).
- Tests: backend test coverage limited to tests/test_game_view.py (see tests/test_game_view.py, e.g., test_index_returns_html lines ~19–33). Frontend tests cover SpaceInvaders (frontend/tests/game/SpaceInvaders.test.ts).
- No src/lib present — consolidate shared utilities there.

Search & quality findings (TODOs, placeholders, flakiness)

- Placeholders / notes:
  - src/app/static/.gitkeep contains "# Placeholder for Vite build output".
  - frontend/tests/game/SpaceInvaders.test.ts contains comment "Minimal CanvasRenderingContext2D stub" (intended) — not an implementation TODO but a test stub.
  - Various prompt and agent docs contain "placeholder" guidance (docs, .github), not code TODOs.
- No tests marked skipped/xfail/flaky found in repo search (high-confidence).
- No "NotImplementedError" or obvious stubbed Python functions found in core backend code.

Duplication & src/lib recommendation

- Duplication risk: no explicit duplicated logic found, but absence of src/lib means future habit features may copy date/icon utilities between backend & frontend — recommend src/lib for shared server-side helpers and frontend/src/lib for shared client utilities (icons, palettes, date utils, ARIA helpers).

Test coverage gaps (explicit)

- Backend:
  - No model unit tests for Habit/Entry (missing).
  - No API integration tests for /api/habits or /api/entries (missing).
  - No migration for new tables (missing).
- Frontend:
  - No components for habit UI, thus no unit tests/integration tests exist for them (missing).
  - E2E Playwright tests for the habit flows are missing.
- Existing tests:
  - tests/test_game_view.py only validates the game HTML shell and error handlers (see tests/test_game_view.py lines ~19–33, ~43–58). This is appropriate for current game but not for habit feature.

Intentional vs accidental omissions

- Intentional: The Space Invaders game is intentionally implemented; the habit-tracker spec appears to be a planned replacement or optional feature (spec file present in specs/ and prompts in prompts.txt). The existing hello migration and game route suggest the repo intentionally includes an interactive app rather than the habit feature at this time.
- Accidental/To-do: Habit models, APIs, migrations, frontend components, validation, and tests are missing — likely intentional (proposal stage) but must be implemented to satisfy the spec.

Recommended minimum first iteration (MVP) to deliver spec acceptance quickly

- Implement backend models + migration (task 1)
- Implement GET/POST /api/habits and GET /api/entries?month=YYYY-MM and POST /api/entries (task 2)
- Add basic frontend HabitTable + CalendarView + useHabits hook that toggles a cell and persists (tasks 5 & 6)
- Add integration tests: backend API tests and a single E2E scenario: create habit, mark day, verify calendar shows icon (task 10)
  Estimated time (rough): 8–12 developer days for one experienced fullstack dev (backend + frontend) to reach acceptance-criteria-lowbar (persistence, basic UI, sync, tests).

Files to create under specs/ (filenames + one-paragraph summaries)

1. specs/api-habits.md
   - Summary: Detailed API contract for /api/habits endpoints: request/response schemas (JSON examples), validation rules (name length, icon enum, color hex format), status codes, error payloads, and uniqueness constraints for (icon,color) per user. Include example curl requests and expected responses, and backward-compatibility notes for default assignments.

2. specs/api-entries.md
   - Summary: Detailed API contract for /api/entries and /api/entries/bulk: per-entry payload formats, idempotency behavior (POST for create/update), transactional behavior for bulk updates, conflict resolution rules for optimistic updates, and expected query parameters (month=YYYY-MM). Include performance notes for large ranges and server-side validation rules.

3. specs/frontend-components.md
   - Summary: Component-level spec for HabitTable, HabitCell, CalendarView, Legend, and HabitEditor: props, events, accessible roles/aria attributes, keyboard behavior, state shape expected from useHabits hook, snapshot examples for overflow states and mobile layout breakpoints, and a small style guide for icon sizes/color palette.

4. specs/accessibility.md
   - Summary: Accessibility acceptance criteria and test checklist: ARIA attributes and labels required, keyboard focus flow, screen reader text examples, color contrast thresholds, and a plan for automated a11y checks in CI (axe or similar).

5. specs/migrations.md
   - Summary: Migration plan describing DB schema changes (habits and entries tables), rollout strategy, data migration and rollback considerations, and alembic revision naming convention + example migration file content.
