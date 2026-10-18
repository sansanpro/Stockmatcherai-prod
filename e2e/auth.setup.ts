import { test as setup, expect } from '@playwright/test';
import { testUser } from './helpers';

// Signs in once through the real sign-in screen and saves the session for the other tests
setup('sign in as test user', async ({ page }) => {
  const { email, password } = testUser();
  await page.goto('/auth');
  await page.getByText('Already have an account?').click();
  await page.locator('#signin-email').fill(email);
  await page.getByPlaceholder('Your password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL(/\/app/);
  await page.context().storageState({ path: 'e2e/.auth/test-user.json' });
});
