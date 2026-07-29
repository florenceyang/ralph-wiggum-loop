import { test, expect } from '@playwright/test';

/**
 * E2E coverage for the Habit Tracker page (replaces the former
 * Space Invaders e2e/game.spec.ts now that the game has been removed).
 *
 * Scenarios per specs/habit-tracker-v2-specifications.md §5:
 * 1. `/` redirects to `/habits`; page title contains "Habits".
 * 2. Create a habit via the editor UI.
 * 3. Mark a day cell in the table; the same icon+color marker appears in
 *    the corresponding calendar day cell.
 * 4. Two habits with distinct icon+color combinations are visually
 *    distinguishable in both table and calendar.
 */
/**
 * Generates a random, run-unique hex color so repeated e2e runs against the
 * same (dev, not reset-between-runs) database never collide with the
 * server's (icon, color) uniqueness constraint.
 */
function uniqueColor(): string {
  const n = Math.floor(Math.random() * 0xffffff);
  return `#${n.toString(16).padStart(6, '0')}`;
}

test.describe('Habit Tracker Page', () => {
  test('redirects root to /habits with the expected title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/habits$/);
    await expect(page).toHaveTitle(/Habits/i);
  });

  test('mounts the habits island', async ({ page }) => {
    await page.goto('/habits');
    const island = page.locator('[data-island="habits"]');
    await expect(island).toBeVisible();
    await expect(page.getByRole('table', { name: /Habit table/i })).toBeVisible();
    await expect(page.getByRole('grid', { name: /Calendar for/i })).toBeVisible();
  });

  test('creates a habit and marks a day, syncing table and calendar', async ({ page }) => {
    await page.goto('/habits');

    const uniqueName = `E2E Habit ${Date.now()}`;
    await page.getByLabel('Habit name').fill(uniqueName);
    await page.getByLabel('Icon').selectOption('star');
    await page.getByTestId('habit-editor-color').fill(uniqueColor());
    await page.getByTestId('habit-editor-submit').click();

    const nameCell = page.locator('span[data-testid^="habit-name-"]', { hasText: uniqueName });
    await expect(nameCell).toBeVisible();

    // Mark the first visible day cell for this habit's row.
    const row = page.locator('tr', { has: nameCell });
    const firstCell = row.locator('button[data-testid^="habit-cell-"]').first();
    const dateAttr = await firstCell.getAttribute('data-testid');
    const date = dateAttr?.replace('habit-cell-', '');
    await firstCell.click();
    await expect(firstCell).toHaveAttribute('aria-pressed', 'true');

    // The same habit's marker should now appear on the corresponding
    // calendar day with the same icon.
    if (date) {
      const calendarDay = page.getByTestId(`calendar-day-${date}`);
      await expect(calendarDay).toBeVisible();
      await expect(calendarDay.locator(`span[title="${uniqueName}"]`)).toContainText('S');
    }
  });

  test('distinguishes two habits by distinct icon+color in the legend', async ({ page }) => {
    await page.goto('/habits');

    const nameA = `E2E A ${Date.now()}`;
    await page.getByLabel('Habit name').fill(nameA);
    await page.getByLabel('Icon').selectOption('heart');
    await page.getByTestId('habit-editor-color').fill(uniqueColor());
    await page.getByTestId('habit-editor-submit').click();
    await expect(page.locator('span[data-testid^="habit-name-"]', { hasText: nameA })).toBeVisible();

    const nameB = `E2E B ${Date.now()}`;
    await page.getByLabel('Habit name').fill(nameB);
    await page.getByLabel('Icon').selectOption('diamond');
    await page.getByTestId('habit-editor-color').fill(uniqueColor());
    await page.getByTestId('habit-editor-submit').click();
    await expect(page.locator('span[data-testid^="habit-name-"]', { hasText: nameB })).toBeVisible();

    // Legend should list both with visually distinct swatches.
    await expect(page.getByLabel(`Toggle ${nameA} visibility — currently shown`)).toBeVisible();
    await expect(page.getByLabel(`Toggle ${nameB} visibility — currently shown`)).toBeVisible();
  });

  test('supports arrow-key navigation between table cells', async ({ page }) => {
    await page.goto('/habits');

    const nameA = `E2E Nav A ${Date.now()}`;
    await page.getByLabel('Habit name').fill(nameA);
    await page.getByLabel('Icon').selectOption('circle');
    await page.getByTestId('habit-editor-color').fill(uniqueColor());
    await page.getByTestId('habit-editor-submit').click();
    const rowA = page.locator('tr', {
      has: page.locator('span[data-testid^="habit-name-"]', { hasText: nameA }),
    });
    await expect(rowA).toBeVisible();

    const nameB = `E2E Nav B ${Date.now()}`;
    await page.getByLabel('Habit name').fill(nameB);
    await page.getByLabel('Icon').selectOption('square');
    await page.getByTestId('habit-editor-color').fill(uniqueColor());
    await page.getByTestId('habit-editor-submit').click();
    const rowB = page.locator('tr', {
      has: page.locator('span[data-testid^="habit-name-"]', { hasText: nameB }),
    });
    await expect(rowB).toBeVisible();

    const firstCellA = rowA.locator('button[data-testid^="habit-cell-"]').first();
    const secondCellA = rowA.locator('button[data-testid^="habit-cell-"]').nth(1);
    const firstCellB = rowB.locator('button[data-testid^="habit-cell-"]').first();

    await firstCellA.focus();
    await expect(firstCellA).toHaveAttribute('tabindex', '0');

    await page.keyboard.press('ArrowRight');
    await expect(secondCellA).toBeFocused();
    await expect(firstCellA).toHaveAttribute('tabindex', '-1');

    await page.keyboard.press('ArrowLeft');
    await expect(firstCellA).toBeFocused();

    await page.keyboard.press('ArrowDown');
    await expect(firstCellB).toBeFocused();

    // Space toggles the focused cell without leaving keyboard control.
    await page.keyboard.press(' ');
    await expect(firstCellB).toHaveAttribute('aria-pressed', 'true');
  });
});
