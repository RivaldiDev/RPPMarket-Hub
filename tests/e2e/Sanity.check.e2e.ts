import { expect, test } from '@playwright/test';

// E2E tests ending with `*.e2e.ts` run before deployment (locally or on CI)
// to ensure the application is ready to ship.

test.describe('Sanity', () => {
  test.describe('Static pages', () => {
    test('should display the homepage', async ({ page }) => {
      await page.goto('/');

      await expect(
        page.getByRole('heading', { level: 1 }),
      ).toContainText('Bagikan satu link');
    });

    test('should display pricing and FAQ sections', async ({ page }) => {
      await page.goto('/');

      await expect(page.getByText('5%').first()).toBeVisible();
    });
  });
});
