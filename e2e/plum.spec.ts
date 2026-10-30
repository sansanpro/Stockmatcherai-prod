import { test, expect, type Page } from '@playwright/test';
import { openApp } from './helpers';

// The plum and coral look (scripts/build-plum-tokens.mjs): the card's plum header with the price,
// the deck's own Ask AI button, and dark mode following the system setting. Runs as the test account.

const IPHONE_15_APP = { width: 393, height: 759 }; // the app's own screen on an iPhone 15 (no Safari bars)

async function companyCard(page: Page) {
  await page.setViewportSize(IPHONE_15_APP);
  await openApp(page);
  await page.locator('[data-swipe-card="top"]').waitFor();
  // The test account's deck can start with news updates; pass them to reach a company card
  for (let i = 0; i < 3 && await page.getByRole('button', { name: 'Interested' }).isVisible(); i++) {
    await page.getByRole('button', { name: 'Pass' }).click();
    await page.waitForTimeout(600);
  }
  return page.locator('[data-swipe-card="top"]');
}

test('the card header shows the share price and past year, green only for a gain', async ({ page }) => {
  const card = await companyCard(page);
  await expect(card.getByText('Share price', { exact: true })).toBeVisible();
  await expect(card.getByText(/^\$\d[\d,]*\.\d{2}$/)).toBeVisible();
  const change = card.getByText(/^[↑↓]? ?[+-]?\d+\.\d%$/);
  await expect(change).toBeVisible();
  const text = (await change.innerText()).trim();
  const color = await change.evaluate(el => getComputedStyle(el).color);
  if (text.includes('+')) expect(color).toBe('rgb(126, 224, 138)'); // gain-on-plum
  else expect(color).not.toBe('rgb(126, 224, 138)');
  // The price isn't repeated in the card's numbers
  await expect(card.getByText('The numbers')).toBeAttached();
  await expect(card.getByRole('button', { name: 'What is Share price?' })).toHaveCount(0);
  // Proof and To know are on screen without scrolling at the app's real size
  await expect(card.getByText('Proof', { exact: true })).toBeInViewport({ ratio: 1 });
  await expect(card.getByText('To know', { exact: true })).toBeInViewport({ ratio: 1 });
  await page.screenshot({ path: 'docs/plum/deck-light-393x759.png' });
});

test("the deck's Ask AI button fills in a question about the company, without sending it", async ({ page }) => {
  let posts = 0;
  await page.route(/\/functions\/v1\/stock-assistant/, (route) => { if (route.request().method() === 'POST') posts++; return route.continue(); });
  const card = await companyCard(page);
  const name = (await card.locator('h2').innerText()).trim();
  await expect(page.getByRole('button', { name: 'Open Ask AI' })).toHaveCount(0); // the floating button steps aside on the deck
  await page.getByRole('button', { name: 'Ask AI', exact: true }).click();
  await expect(page.getByPlaceholder('Ask about a company or term…')).toHaveValue(`What does ${name} (${(await card.getByText(/^[A-Z.]{1,6}$/).first().innerText()).trim()}) do, and how does it connect to my causes?`);
  expect(posts).toBe(0);
  // On Likes, the floating button is back
  await page.getByRole('button', { name: 'Close Ask AI' }).click();
  await page.getByRole('button', { name: 'Likes' }).click();
  await expect(page.getByRole('button', { name: 'Open Ask AI' })).toBeVisible();
});

test('dark mode follows the system setting', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await companyCard(page);
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).toBe('rgb(26, 15, 21)'); // #1A0F15, warm plum-black
  await page.screenshot({ path: 'docs/plum/deck-dark-393x759.png' });
  await page.emulateMedia({ colorScheme: 'light' });
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(255, 248, 244)'); // #FFF8F4
});
