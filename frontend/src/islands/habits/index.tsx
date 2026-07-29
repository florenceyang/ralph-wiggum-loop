/**
 * Habits Island mount logic.
 *
 * Dynamically imported by `main.ts` when a `[data-island="habits"]` element
 * is found in the DOM. No server-provided props are required — all habit
 * and entry state is fetched client-side via useHabits.
 */
import { createRoot } from 'react-dom/client'
import { HabitsIsland } from './HabitsIsland'

/**
 * Mount the HabitsIsland into the given element.
 *
 * @param element - DOM element (the data-island div) to render into.
 * @param _props  - Unused; the habit tracker fetches its own state from the API.
 */
export function mount(element: HTMLElement, _props: unknown): void {
  // Clear the server-rendered fallback (e.g. the <noscript> notice).
  element.innerHTML = ''

  const root = createRoot(element)
  root.render(<HabitsIsland />)
}
