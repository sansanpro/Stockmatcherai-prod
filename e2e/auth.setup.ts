import { test as setup, expect } from '@playwright/test';
import { testUser } from './helpers';

// Signs in once through the real sign-in screen and saves the session for the other tests
setup('sign in as test user', async ({ page }) => {
  const { email, password } = testUser();
  // Marks test traffic so analytics metrics exclude it
  await page.addInitScript(() => {
    if (!localStorage.getItem('analytics_install_id')) {
      localStorage.setItem('analytics_install_id', `e2e-${Math.random().toString(36).slice(2, 12)}`);
    }
  });
  await page.goto('/auth?mode=signin');
  await page.locator('#signin-email').fill(email);
  await page.getByPlaceholder('Your password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL(/\/app/);
  await page.context().storageState({ path: 'e2e/.auth/test-user.json' });
});
