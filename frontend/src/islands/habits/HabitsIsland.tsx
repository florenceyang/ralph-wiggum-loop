/**
 * HabitsIsland — thin React Island wrapper for the Habit Tracker.
 *
 * Mirrors the `frontend/src/islands/game/GameIsland.tsx` pattern: the island
 * itself owns no logic, it simply renders the real component (`HabitApp`)
 * which lives alongside the other habit components so it can be unit tested
 * with plain `render()` (no island-mounting machinery needed in tests).
 */
import HabitApp from '@/components/HabitApp';

export function HabitsIsland() {
  return <HabitApp />;
}
