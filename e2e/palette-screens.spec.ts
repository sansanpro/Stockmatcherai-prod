import { test, expect, type Page } from '@playwright/test';
import { openApp } from './helpers';
import { measureContrast } from './contrast-audit';

// The five screens the design brief compares across palette directions: onboarding, a card,
// a "Big swings" caution, the recap and the paywall. Runs only when PALETTE_OUT is set:
//   PALETTE_OUT=docs/phase0/screens/current npx playwright test e2e/palette-screens.spec.ts
const out = process.env.PALETTE_OUT;
test.skip(!out, 'set PALETTE_OUT to capture palette screens');

async function auditContrast(page: Page, name: string) {
  const { writeFileSync } = await import('node:fs');
  writeFileSync(`${out}/${name}.contrast.json`, JSON.stringify(await measureContrast(page), null, 2));
}
const shot = async (page: Page, name: string) => {
  await page.screenshot({ path: `${out}/${name}.png` });
  await auditContrast(page, name);
};
const settle = (page: Page) => page.waitForTimeout(1100); // entrance animations

async function signedOut(page: Page, answers?: Record<string, unknown>) {
  await page.addInitScript((a) => {
    if (!localStorage.getItem('analytics_install_id')) localStorage.setItem('analytics_install_id', `e2e-${Math.random().toString(36).slice(2, 12)}`);
    localStorage.setItem('coach_first_card', 'seen');
    if (a) localStorage.setItem('onboarding_v2_answers', JSON.stringify(a));
  }, answers);
}

test.describe('signed out', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('onboarding', async ({ page }) => {
    await signedOut(page);
    await page.goto('/app');
    await page.getByRole('button', { name: 'Find my matches' }).click();
    await page.getByRole('button', { name: /^Beat cancer & disease/ }).click();
    await page.getByRole('button', { name: /^Clean water/ }).click();
    await settle(page);
    await shot(page, '1-onboarding');
  });

  test('card', async ({ page }) => {
    await signedOut(page, { causes: ['clean_water', 'beat_cancer'], dealbreakers: [], risk: 'medium', experience: 'few', goal: 'growth' });
    await page.goto('/app');
    await page.getByRole('button', { name: 'View stock details' }).first().waitFor();
    await settle(page);
    await shot(page, '2-card');
  });

  test('big swings caution', async ({ page }) => {
    await signedOut(page, { causes: ['mental_health'], dealbreakers: [], risk: 'high', experience: 'few', goal: 'growth' });
    await page.goto('/app');
    for (let i = 0; i < 7; i++) {
      await page.getByRole('button', { name: 'View stock details' }).first().waitFor();
      if (await page.getByText('Big swings').first().isVisible()) break;
      await page.getByRole('button', { name: 'Pass' }).click();
      await page.waitForTimeout(500);
    }
    await expect(page.getByText('Big swings').first()).toBeVisible();
    await page.locator('[class*="cursor-grab"]').first().click({ position: { x: 150, y: 260 } });
    await settle(page);
    await shot(page, '3-caution');
  });

  test('recap', async ({ page }) => {
    await signedOut(page, { causes: ['clean_energy', 'clean_water'], dealbreakers: [], risk: 'medium', experience: 'few', goal: 'growth' });
    await page.goto('/app');
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: 'View stock details' }).first().waitFor();
      await page.getByRole('button', { name: 'Like this company' }).click();
      if (i === 0) await page.getByRole('button', { name: 'Not now' }).click();
      if (i === 2) await page.getByRole('button', { name: 'Keep swiping without saving' }).click();
      await page.waitForTimeout(450);
    }
    while (await page.getByRole('button', { name: 'Pass' }).isVisible().catch(() => false)) {
      await page.getByRole('button', { name: 'Pass' }).click();
      await page.waitForTimeout(450);
    }
    const reel = page.getByRole('dialog', { name: 'Your day in values' });
    await reel.getByRole('button', { name: 'Next' }).click();
    await expect(reel.getByText('Like 1 of 3')).toBeVisible();
    await settle(page);
    await shot(page, '4-recap');
  });
});

test('paywall', async ({ page }) => {
  await page.route(/\/functions\/v1\/stock-assistant/, (route) => route.request().method() !== 'POST' ? route.continue()
    : route.fulfill({ status: 403, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ type: 'upgrade_required', freeMessagesSent: 5 }) }));
  await openApp(page);
  await page.getByRole('button', { name: 'Open Ask AI' }).click();
  await page.getByPlaceholder('Ask about a company or term…').fill('What does Merck do?');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.getByRole('dialog').getByText("You've used your 5 free questions")).toBeVisible();
  await settle(page);
  await shot(page, '5-paywall');
});
