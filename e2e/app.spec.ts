import { test, expect, type Page } from '@playwright/test';
import { openApp } from './helpers';

const openChat = async (page: Page) => {
  await page.getByRole('button', { name: 'Open AI Assistant' }).click();
  await expect(page.getByText('AI Stock Assistant')).toBeVisible();
};

const chatInput = (page: Page) => page.getByPlaceholder(/Ask about stocks|Try asking about a stock/);

test('swipe deck loads a stock card', async ({ page }) => {
  await openApp(page);
  await expect(page.getByText('P/E Ratio').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'View stock details' }).first()).toBeVisible();
  await page.screenshot({ path: 'e2e/screens/deck.png' });
});

test('stock details show company description, employees and HQ', async ({ page }) => {
  await openApp(page);
  await page.getByRole('button', { name: 'View stock details' }).first().click();
  const details = page.getByRole('dialog');
  // These come from the company_profiles table, not a live API
  await expect(details.getByText(/^About /)).toBeVisible();
  await expect(details.getByText('Employees')).toBeVisible();
  await expect(details.getByText('Headquarters')).toBeVisible();
  await expect(details.getByText('Went Public')).toBeVisible();
  await expect(details.getByText(/is a company in the .* sector\./)).toHaveCount(0); // generic fallback text
  await page.screenshot({ path: 'e2e/screens/details.png' });
});

test('first message shows the AI consent dialog above the chat, then sends', async ({ page }) => {
  await openApp(page, { aiConsent: false });
  await openChat(page);
  await chatInput(page).fill('Explain P/E ratio in simple terms');
  await page.getByRole('button', { name: 'Send message' }).click();

  const agree = page.getByRole('button', { name: 'I Agree' });
  await expect(agree).toBeVisible();
  await agree.click(); // fails if the dialog is hidden behind the chat panel
  await expect(page.getByText(/not investment advice/i).last()).toBeVisible({ timeout: 60_000 });
  await page.screenshot({ path: 'e2e/screens/chat-consent.png' });
});

test('chat answers a data question without showing raw tool output', async ({ page }) => {
  await openApp(page);
  await openChat(page);
  await chatInput(page).fill('How is NVIDIA doing?');
  await page.getByRole('button', { name: 'Send message' }).click();

  await expect(page.getByText(/not investment advice/i).last()).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText(/Fetched/)).toHaveCount(0);
  await expect(page.getByText(/NVDA|NVIDIA/).last()).toBeVisible();
  await page.screenshot({ path: 'e2e/screens/chat-answer.png' });
});

test('chat input accepts typing while stock details are open', async ({ page }) => {
  await openApp(page);
  await page.getByRole('button', { name: 'View stock details' }).first().click();
  await openChat(page);
  await chatInput(page).click();
  await page.keyboard.type('typing works');
  await expect(chatInput(page)).toHaveValue('typing works');
  await page.screenshot({ path: 'e2e/screens/chat-over-details.png' });
});

test('details button opens only the details panel, not the expanded card too', async ({ page }) => {
  await openApp(page);
  await page.getByRole('button', { name: 'View stock details' }).first().click();
  await expect(page.getByRole('dialog').getByText(/% 1Y$/)).toBeVisible(); // StockDetailsModal hero
  await page.waitForTimeout(600); // let any sheet animation finish
  // The card's own expanded sheet has a "Stock Details" header; it must stay closed
  await expect(page.getByRole('heading', { name: 'Stock Details' })).toHaveCount(0);
  await page.screenshot({ path: 'e2e/screens/details-only.png' });
});

test('tapping a tooltip on the card does not expand the card', async ({ page }) => {
  await openApp(page);
  await page.getByRole('button', { name: 'View stock details' }).first().waitFor();
  await page.locator('button:has(svg.lucide-circle-help), button:has(svg.lucide-help-circle)').first().click();
  await page.waitForTimeout(600);
  await expect(page.getByRole('heading', { name: 'Stock Details' })).toHaveCount(0);
});

test('expanded card can be collapsed (AI button does not cover it)', async ({ page }) => {
  await openApp(page);
  await page.getByText('P/E Ratio').first().click(); // tap the card body to expand it
  const collapse = page.getByRole('button', { name: 'Collapse stock details' });
  await expect(collapse).toBeVisible();
  await page.waitForTimeout(600); // sheet slide-in animation
  await page.screenshot({ path: 'e2e/screens/expanded-card.png' });
  await collapse.click({ timeout: 5_000 }); // fails if another element intercepts the tap
  await expect(page.getByRole('heading', { name: 'Stock Details' })).toHaveCount(0);
});

test('deck shows one pair of swipe arrows', async ({ page }) => {
  await openApp(page);
  await expect(page.getByText('P/E Ratio').first()).toBeVisible();
  await expect(page.locator('svg.lucide-chevron-left:visible')).toHaveCount(1);
  await expect(page.locator('svg.lucide-chevron-right:visible').filter({ hasNot: page.locator('xpath=ancestor::button') })).toHaveCount(1);
});

test('company logo loads instead of a blank tile', async ({ page }) => {
  await openApp(page);
  const logo = page.locator('img[alt$=" logo"]').first();
  // The img is kept transparent (initials shown) until it has loaded
  await expect.poll(() => logo.evaluate((img: HTMLImageElement) => img.complete ? img.naturalWidth : 0), { timeout: 20_000 })
    .toBeGreaterThan(0);
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'e2e/screens/logo.png' });
});

test('details panel shows real returns, real news and no buy/sell ratings', async ({ page }) => {
  await openApp(page);
  await page.getByRole('button', { name: 'View stock details' }).first().click();
  const details = page.getByRole('dialog');

  // No analyst-style ratings (they were derived from 1Y return, not analysts)
  await expect(details.getByText(/Strong Buy|Analyst Rating|\bSell\b/)).toHaveCount(0);
  await expect(details.getByText(/momentum|^Flat$/i).first()).toBeVisible();

  // Returns tab: real periods from market data, no simulated chart
  await details.getByRole('tab', { name: /Returns/ }).click();
  await expect(details.getByText('52-Week Range')).toBeVisible();
  await expect(details.getByText(/Simulated/)).toHaveCount(0);
  await expect(details.getByText('1Y', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'e2e/screens/details-returns.png' });

  // News tab: real headlines link out; none of the old template headlines
  await details.getByRole('tab', { name: /News/ }).click();
  await expect(details.getByText(/Reports Strong Q4 Earnings|Analysts Upgrade/)).toHaveCount(0);
  await expect(details.locator('a[href^="http"]').first().or(details.getByText(/No recent news|unavailable/))).toBeVisible();
  await expect(details.getByText(/demonstrates strong commitment/)).toHaveCount(0);
  await page.screenshot({ path: 'e2e/screens/details-news.png' });
});

test('no ESG scores anywhere (they were unsourced placeholder values)', async ({ page }) => {
  await openApp(page);
  await expect(page.getByText('P/E Ratio').first()).toBeVisible();
  await expect(page.getByText(/\bESG\b|sustainability leader/i)).toHaveCount(0);
  await page.getByRole('button', { name: 'View stock details' }).first().click();
  const details = page.getByRole('dialog');
  for (const tab of [/Overview/, /Metrics/, /Returns/, /News/]) {
    await details.getByRole('tab', { name: tab }).click();
    await expect(details.getByText(/\bESG\b/)).toHaveCount(0);
  }
});
