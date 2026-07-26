import { expect, test } from '@playwright/test';

test.describe('I18n', () => {
  test.describe('Language switching', () => {
    test('should show the Indonesian homepage by default', async ({ page }) => {
      await page.goto('/');

      await expect(
        page.getByRole('heading', { level: 1 }),
      ).toContainText('Bagikan satu link');
    });

    test('should show the English homepage under /en', async ({ page }) => {
      await page.goto('/en');

      await expect(
        page.getByRole('heading', { level: 1 }),
      ).toContainText('Share one link');
    });

    test('should switch language using the dropdown', async ({ page }) => {
      await page.goto('/');

      await page.getByRole('button', { name: 'Ganti bahasa' }).click();
      await page.getByText('English').click();

      await expect(
        page.getByRole('heading', { level: 1 }),
      ).toContainText('Share one link');
    });
  });
});
