# Habit Tracker v3 — Specification

This document outlines the planned improvements and new features for v3 of the Habit Tracker, addressing UI discrepancies, UX gaps, and adding a new To-Do list functionality to the site.

## 1. Problem Statement

The v2 implementation successfully integrated the React frontend with the Flask backend, replacing the old vanilla JS implementation. However, several UX/UI gaps and bugs remain:
- **Date Generation Bug:** The table columns and calendar sometimes show incorrect days (e.g., missing the 31st day or displaying 30 days incorrectly) due to timezone shifts when formatting local dates into ISO strings.
- **Congested Table Headers:** The `HabitTable` headers (`"Mon 1"`, `"Tue 2"`) take up too much horizontal space, making the table layout congested and hard to read.
- **Squished UI Elements:** The inline habit deletion button (`✕`) is visually cramped and lacks proper styling.
- **Missing Interaction Polish:** Key interactions outlined in previous plans—such as drag-to-select range marking and multi-step undo/redo—are still missing.
- **Missing Feature:** There is currently no way to track daily to-do items alongside habits.

## 2. Core Upgrades (Habit Tracker)

### 2.1 UI Modernization & Polish
- **Tailwind Enhancements:** Upgrade the visual language of the habit table and calendar using Tailwind CSS. Implement consistent rounded corners (`rounded-md`, `rounded-lg`), subtle shadows (`shadow-sm`), and improved padding to make the UI "modern, simple, and clean".
- **Table Headers:** Redesign the `HabitTable` columns. Stack the weekday abbreviation above the numeric date (e.g., `Mon` on top, `1` below), or rotate the text to save horizontal width and reduce congestion.
- **Delete Button:** Replace the inline text `✕` with a modern SVG trash icon (e.g., from an icon library or custom SVG), adding proper padding, hover effects (`hover:text-red-500`, `hover:bg-red-50`), and `aria-label`s for accessibility.

### 2.2 Bug Fixes
- **Timezone/Date Alignment:** Refactor the `daysInMonth` helper function in both `HabitTable.tsx` and `CalendarView.tsx`. Replace `new Date(...).toISOString()` with explicit string formatting (`${yyyy}-${mm}-${dd}`) based on local time to prevent timezone offset bugs that cause incorrect day counts in certain locales.

### 2.3 Interaction Features (from v2 Plan)
- **Bulk Marking & Range Selection:** Add the ability to drag across multiple cells in the `HabitTable` to mark/unmark a range of days for a specific habit in a single continuous interaction. Support `Shift+Click` for bulk selecting between two dates.
- **Multi-step Undo/Redo:** Upgrade the single-level `UndoStack` in `HabitApp.tsx` into a robust multi-step undo/redo stack (`Ctrl+Z` to undo, `Ctrl+Shift+Z` or `Cmd+Shift+Z` to redo).

## 3. New Feature: To-Do List

A new to-do list section will be integrated directly into the `/habits` page, below the existing Habit Tracker calendar and table.

### 3.1 Data Model & API
- **Models:**
  - `TodoGroup`: Represents a category or bucket of tasks. Fields: `id`, `name`, `color` (for UI differentiation).
  - `TodoItem`: Represents a single task. Fields: `id`, `group_id` (foreign key), `text`, `completed` (boolean), `order` (integer for drag-and-drop sorting).
- **Database:** A new Alembic migration will be generated to create `todo_groups` and `todo_items` tables.
- **REST API:**
  - `GET /api/todos`: Fetch all groups and items.
  - `POST/PUT/DELETE /api/todos/groups`: Manage categories.
  - `POST/PUT/DELETE /api/todos/items`: Manage tasks.
  - `PUT /api/todos/reorder`: Specialized endpoint accepting a list of item IDs and their new `order` values to persist drag-and-drop state.

### 3.2 Frontend Implementation
- **Drag & Drop:** Integrate `@dnd-kit/core` and `@dnd-kit/sortable` to support robust, accessible, and touch-friendly drag-and-drop reordering of `TodoItem`s within and across `TodoGroup`s.
- **Component Architecture:**
  - `TodoBoard`: Top-level container managing the dnd-kit `DndContext` and API sync.
  - `TodoGroup`: A column or section representing a category, colored via the group's `color` property.
  - `TodoItem`: A draggable card with a checkbox, text, and an inline delete action.
- **Integration:** Mount the `TodoBoard` component within the main `HabitApp` layout, ensuring it sits cleanly below the table and calendar views, matching the modernized styling (shadows, rounded corners).

## 4. Non-Goals for v3
- User authentication and multi-user data separation (still single-user local state).
- Real-time WebSockets synchronization across multiple browser tabs.
