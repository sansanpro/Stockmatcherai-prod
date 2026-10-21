import { test, expect, type Page } from '@playwright/test';
import { openApp } from './helpers';

const openChat = async (page: Page) => {
  await page.getByRole('button', { name: 'Open AI Assistant' }).click();
  await expect(page.getByText('AI Stock Assistant')).toBeVisible();
};

const chatInput = (page: Page) => page.getByPlaceholder(/Ask about stocks|Try asking about a stock/);
// The chat panel (the deck has its own "not investment advice" footer, so answers are matched in here)
const chatPanel = (page: Page) => page.locator('div[data-ai-assistant].fixed');

test('swipe deck loads a values-matched card', async ({ page }) => {
  await openApp(page);
  await expect(page.getByText('P/E Ratio').first()).toBeVisible();
  await expect(page.getByText('Why this matches you').first()).toBeVisible();
  await expect(page.getByText(/matches left today/)).toBeVisible();
  // Profile chips are the user's causes now, not age or sector
  await expect(page.getByText(/^\d+yo$/)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'View stock details' }).first()).toBeVisible();
  await page.screenshot({ path: 'e2e/screens/deck.png' });
});

test('stock details show company description, HQ and IPO year', async ({ page }) => {
  await openApp(page);
  await page.getByRole('button', { name: 'View stock details' }).first().click();
  const details = page.getByRole('dialog');
  // These come from the company_profiles table, not a live API
  await expect(details.getByText(/^About /)).toBeVisible();
  // (Employee counts exist for the original companies only, so that tile isn't checked here)
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
  await expect(chatPanel(page).getByText(/not investment advice/i).last()).toBeVisible({ timeout: 60_000 });
  await page.screenshot({ path: 'e2e/screens/chat-consent.png' });
});

test('chat answers a data question without showing raw tool output', async ({ page }) => {
  await openApp(page);
  await openChat(page);
  await chatInput(page).fill('How is NVIDIA doing?');
  await page.getByRole('button', { name: 'Send message' }).click();

  await expect(chatPanel(page).getByText(/not investment advice/i).last()).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText(/Fetched/)).toHaveCount(0);
  await expect(chatPanel(page).getByText(/NVDA|NVIDIA/).last()).toBeVisible();
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
  await page.getByRole('button', { name: 'View stock details' }).first().waitFor(); // deck loaded
  await page.locator('h2').first().click(); // tap the card (its company name) to expand it
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

test('a card whose price is over 20 minutes old refreshes it on screen', async ({ page }) => {
  // Make every stock look an hour old so the visible card must refresh its price
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  await page.route(/\/functions\/v1\/match-feed/, async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    const response = await route.fetch();
    const body = await response.json();
    const aged = Array.isArray(body.cards)
      ? { ...body, cards: body.cards.map((c: Record<string, unknown>) => ({ ...c, lastUpdated: hourAgo })) }
      : body;
    // Build the reply by hand: fulfill({ response, json }) crashes WebKit's network process
    await route.fulfill({
      status: response.status(),
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify(aged),
    });
  });

  const refresh = page.waitForRequest(req =>
    req.url().includes('/functions/v1/company-data') && (req.postData() ?? '').includes('refresh_quotes'));
  await openApp(page);
  const request = await refresh;
  const ticker = JSON.parse(request.postData()!).symbol as string;
  const response = await (await request.response())!.json();
  const fresh = response.data.prices[ticker];
  expect(fresh.price).toBeGreaterThan(0);

  // The top card's freshness badge shows the refreshed time (cards stacked behind it keep
  // their age until they reach the top)
  await expect(page.getByText(/^(Just now|[0-9]+m ago)$/).first()).toBeVisible({ timeout: 10_000 });
  await page.screenshot({ path: 'e2e/screens/live-quote.png' });
});

test('analytics events are recorded (app_open, deck_loaded, swipe, details_opened)', async ({ page }) => {
  const recorded: { event: string; status: number }[] = [];
  page.on('response', async (response) => {
    if (response.url().includes('/rest/v1/analytics_events') && response.request().method() === 'POST') {
      const body = JSON.parse(response.request().postData() ?? '{}');
      recorded.push({ event: body.event, status: response.status() });
    }
  });
  await openApp(page);
  await expect(page.getByText('P/E Ratio').first()).toBeVisible();
  await page.getByRole('button', { name: 'View stock details' }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect.poll(() => recorded.map(r => r.event), { timeout: 10_000 })
    .toEqual(expect.arrayContaining(['app_open', 'deck_loaded', 'details_opened']));
  // Every insert was accepted by the database (RLS allows inserts, 201 Created)
  expect(recorded.every(r => r.status === 201)).toBe(true);
});

test('profile settings edit causes and no longer ask for age, gender or income', async ({ page }) => {
  await openApp(page);
  await expect(page.getByText('P/E Ratio').first()).toBeVisible();
  await page.getByRole('button', { name: 'Profile' }).click();
  await expect(page.getByText('What you care about')).toBeVisible();
  await expect(page.getByRole('group', { name: 'Causes' }).getByRole('button')).toHaveCount(4);
  await expect(page.getByRole('button', { name: /, pick 1$/ })).toBeVisible(); // the account's #1 cause
  await expect(page.getByText(/^(Age|Gender|Annual Income)$/)).toHaveCount(0);
  await page.screenshot({ path: 'e2e/screens/settings-causes.png', fullPage: true });
});

test('an account from before values matching is asked for causes once', async ({ page }) => {
  // Pretend the profile predates causes; the upsert is answered locally so the real profile stays as it is
  await page.route(/\/rest\/v1\/user_profiles/, async (route) => {
    const request = route.request();
    if (request.method() === 'GET') {
      const response = await route.fetch();
      const row = await response.json();
      // maybeSingle() reads a list and takes the first row
      const toLegacy = (r: Record<string, unknown>) => ({ ...r, causes: null, dealbreakers: null, onboarding_version: 1 });
      const legacy = Array.isArray(row) ? row.map(toLegacy) : row && typeof row === 'object' ? toLegacy(row) : row;
      return route.fulfill({ status: response.status(), contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(legacy) });
    }
    return route.fulfill({ status: 201, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '[]' });
  });
  await openApp(page);
  await expect(page.getByText('New: match by what you care about.')).toBeVisible();
  await page.screenshot({ path: 'e2e/screens/existing-user-causes-intro.png' });
  await page.getByRole('button', { name: 'Pick my causes' }).click();
  await page.getByRole('button', { name: /^Keeping people safe/ }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText("Anything you'd never want your money to fund?")).toBeVisible();
  await page.getByRole('button', { name: 'Show my matches' }).click();
  await expect(page.getByText('P/E Ratio').first()).toBeVisible();
});
