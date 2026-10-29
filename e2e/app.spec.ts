import { test, expect, type Page } from '@playwright/test';
import { openApp } from './helpers';

const openChat = async (page: Page) => {
  await page.getByRole('button', { name: 'Open Ask AI' }).click();
  await expect(chatPanel(page).getByRole('heading', { name: 'Ask AI' })).toBeVisible();
};

const chatInput = (page: Page) => page.getByPlaceholder('Ask about a company or term…');
// The chat panel (the deck has its own "not investment advice" footer, so answers are matched in here)
const chatPanel = (page: Page) => page.locator('div[data-ai-assistant].fixed');

test('swipe deck loads a values-matched card, story first', async ({ page }) => {
  await openApp(page);
  await expect(page.getByText('P/E Ratio').first()).toBeVisible();
  await expect(page.getByText(/matches left today/)).toBeVisible();
  // The test account's real deck can start with news updates; pass them to reach a company card
  for (let i = 0; i < 3 && await page.getByRole('button', { name: 'Interested' }).isVisible(); i++) {
    await page.getByRole('button', { name: 'Pass' }).click();
    await page.waitForTimeout(600);
  }
  // Card face: values match chips, then proof and things to know side by side (equally prominent,
  // both on screen without scrolling), then the numbers
  const card = page.locator('[class*="cursor-grab"]').first();
  await expect(card.getByText('Values match')).toBeVisible();
  await expect(card.getByText(/· (core business|part of the business)$/).first()).toBeVisible();
  await expect(card.getByText('Proof', { exact: true })).toBeInViewport();
  await expect(card.getByText('Things to know', { exact: true })).toBeInViewport();
  await expect(card.getByText(/(Steadier: a large, established company|Moderate price swings|Bigger price swings)$/)).toBeVisible();
  const box = async (text: string) => (await card.getByText(text, { exact: true }).first().boundingBox())!;
  expect((await box('Values match')).y).toBeLessThan((await box('Proof')).y);
  expect(Math.abs((await box('Proof')).y - (await box('Things to know')).y)).toBeLessThan(4);
  expect((await box('Proof')).height).toBeCloseTo((await box('Things to know')).height, 0);
  expect((await box('Things to know')).y).toBeLessThan((await box('The numbers')).y);
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

// Answers the chat with a fixed status, so these run without calling Gemini
const stubChat = (page: Page, status: number, body: Record<string, unknown>) =>
  page.route(/\/functions\/v1\/stock-assistant/, (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    return route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) });
  });

test('when the AI is busy, the chat says so next to the question', async ({ page }) => {
  await stubChat(page, 429, { error: 'The AI service is busy right now. Please try again in a moment.' });
  await openApp(page);
  await openChat(page);
  await chatInput(page).fill('What does Merck do?');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(chatPanel(page).getByText('What does Merck do?')).toBeVisible();
  await expect(chatPanel(page).getByText('The AI service is busy right now. Please try again in a moment.')).toBeVisible();
  await page.screenshot({ path: 'e2e/screens/chat-busy.png' });
});

test('running out of free questions explains why and lists only real Premium perks', async ({ page }) => {
  await stubChat(page, 403, { type: 'upgrade_required', freeMessagesSent: 5 });
  await openApp(page);
  await openChat(page);
  await chatInput(page).fill('What does Merck do?');
  await page.getByRole('button', { name: 'Send message' }).click();
  const sheet = page.getByRole('dialog');
  await expect(sheet.getByText("You've used your 5 free questions")).toBeVisible();
  await expect(sheet.getByText('12 matches a day')).toBeVisible();
  await expect(sheet.getByText('Instead of 7, all for your causes')).toBeVisible();
  await expect(sheet.getByText('Unlimited Ask AI')).toBeVisible();
  await expect(sheet.getByText('Instead of 5 questions a day')).toBeVisible();
  await expect(sheet.getByText(/unlimited (daily )?swipes|portfolio tracking|advanced filtering|better (picks|returns)/i)).toHaveCount(0);
  await page.waitForTimeout(500); // let the sheet finish opening
  await expect(sheet.getByRole('heading', { name: "You've used your 5 free questions" })).toBeInViewport();
  await expect(sheet.getByRole('button', { name: 'Maybe later' })).toBeVisible();
  await page.screenshot({ path: 'e2e/screens/upgrade-ai.png' });
  // Apple requires the subscription screen to link the privacy policy and terms
  for (const name of ['Privacy Policy', 'Terms of Service']) {
    const link = sheet.getByRole('link', { name });
    await link.scrollIntoViewIfNeeded();
    await expect(link).toBeInViewport();
  }
});

test('Likes shows each company with its causes and story, and no momentum labels', async ({ page }) => {
  await openApp(page);
  await page.getByRole('button', { name: 'View stock details' }).first().waitFor(); // deck loaded
  await page.getByRole('button', { name: 'Likes' }).click();
  await expect(page.getByRole('heading', { name: 'Your Likes' })).toBeVisible();
  const details = page.getByRole('button', { name: /^View (?!stock\b).+ details$/ }).first();
  await expect(details).toBeVisible();
  // (the deck stays mounted, hidden, behind the Likes tab)
  await expect(page.getByText('Values match').filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByText(/momentum|Expert Insights|Why this fits you/i)).toHaveCount(0);
  await page.screenshot({ path: 'e2e/screens/likes.png' });
  await details.click();
  await expect(page.getByRole('dialog').getByText(/% past year$/)).toBeVisible();
});

test('AI data sharing can be turned off in Settings', async ({ page }) => {
  await openApp(page);
  await page.getByRole('button', { name: 'Profile' }).click();
  await expect(page.getByText('Ask AI data sharing')).toBeVisible();
  await page.getByRole('button', { name: 'Turn off' }).click();
  await expect(page.getByText(/^Off: Ask AI will ask before sending anything/)).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('ai_data_consent'))).toBeNull();
  await expect(page.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', 'https://stockmatcherai.com/support');
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
  await expect(page.getByRole('dialog').getByText(/% past year$/)).toBeVisible(); // StockDetailsModal hero
  await page.waitForTimeout(600); // let any sheet animation finish
  // The card's own expanded sheet has a "Stock Details" header; it must stay closed
  await expect(page.getByRole('heading', { name: 'Stock Details' })).toHaveCount(0);
  await page.screenshot({ path: 'e2e/screens/details-only.png' });
});

test('tapping a "?" on the card explains the number and does not expand the card', async ({ page }) => {
  await openApp(page);
  await page.getByRole('button', { name: 'View stock details' }).first().waitFor();
  await page.getByRole('button', { name: 'What is Share price?' }).first().click();
  // Opens on tap (hover tooltips never open on a phone)
  await expect(page.getByText('What one share costs right now.', { exact: false })).toBeVisible();
  await page.waitForTimeout(600);
  await expect(page.getByRole('heading', { name: 'Stock Details' })).toHaveCount(0);
  await page.screenshot({ path: 'e2e/screens/number-explained.png' });
});

test('news about a liked company shows as an update card', async ({ page }) => {
  // Put an update card on top of today's deck, the way match-feed sends them
  await page.route(/\/functions\/v1\/match-feed/, async (route) => {
    if (route.request().method() !== 'POST' || !(route.request().postData() ?? '').includes('"deck"')) return route.continue();
    const response = await route.fetch();
    const body = await response.json();
    const update = {
      type: 'update', ticker: 'MRK', companyName: 'Merck & Co., Inc.', sector: 'healthcare',
      headline: 'Merck reports results from a late-stage cancer study', source: 'Reuters',
      url: 'https://www.reuters.com/', publishedAt: new Date(Date.now() - 2 * 3_600_000).toISOString(),
      pricePerShare: 100, oneYearReturn: 5, marketCap: '$250B', peRatio: 14, dividendYield: 2.5, riskLevel: 'low',
      missionStory: 'Develops medicines and vaccines, led by Keytruda, an immunotherapy that helps the immune system find and attack cancer.',
    };
    await route.fulfill({
      status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({ ...body, cards: [update, ...(body.cards ?? [])], swiped: [] }),
    });
  });
  await openApp(page);
  const card = page.locator('[class*="cursor-grab"]').first();
  await expect(card.getByText('News on a company you liked')).toBeVisible();
  await expect(card.getByText('Merck reports results from a late-stage cancer study')).toBeVisible();
  await expect(card.getByText('Reuters · 2h ago')).toBeVisible();
  await expect(card.getByRole('link', { name: 'Read it on Reuters ↗' })).toHaveAttribute('href', 'https://www.reuters.com/');
  await expect(card.getByText('Why you liked it')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Interested' })).toBeVisible();
  await page.screenshot({ path: 'e2e/screens/update-card.png' });
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

test('swiping is explained by the hint line, with no arrows over the card text', async ({ page }) => {
  await openApp(page);
  await expect(page.getByText('P/E Ratio').first()).toBeVisible();
  await expect(page.getByText('← Swipe left to pass · Swipe right to like →')).toBeVisible();
  await expect(page.locator('svg.lucide-chevron-left:visible')).toHaveCount(0);
  await expect(page.locator('svg.lucide-chevron-right:visible').filter({ hasNot: page.locator('xpath=ancestor::button') })).toHaveCount(0);
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
  // Plain-English risk instead of momentum labels
  await expect(details.getByText(/momentum/i)).toHaveCount(0);
  await expect(details.getByText(/Steadier: a large, established company|Moderate price swings|Bigger price swings/).first()).toBeVisible();

  // Proof keeps its source link in the full view
  await expect(details.getByRole('link', { name: 'Source ↗' }).first()).toHaveAttribute('href', /^https:\/\//);
  // Price history tab: real periods from market data, no simulated chart, no red/green
  await details.getByRole('tab', { name: /Price history/ }).click();
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
  for (const tab of [/Overview/, /Metrics/, /Price history/, /News/]) {
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
  await expect(page.getByRole('group', { name: 'Causes' }).getByRole('button')).toHaveCount(7);
  await expect(page.getByRole('button', { name: /, pick 1 / })).toBeVisible(); // the account's #1 cause
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

test('changing causes after the last card says they start tomorrow, and a deck with cards left is rebuilt', async ({ page }) => {
  // Today's deck as if every card were already passed; rebuilds can't refill a finished day
  const rebuilds: boolean[] = [];
  let finished = true;
  await page.route(/\/functions\/v1\/match-feed/, async (route) => {
    const post = route.request().postData() ?? '';
    if (route.request().method() !== 'POST' || !post.includes('"deck"')) return route.continue();
    const rebuild = JSON.parse(post).rebuild === true;
    if (rebuild) rebuilds.push(finished);
    const body = await (await route.fetch()).json();
    const swiped = finished ? (body.cards ?? []).map((c: { ticker: string }) => ({ ticker: c.ticker, liked: false })) : [];
    await route.fulfill({
      status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({ ...body, swiped, ...(rebuild ? { rebuilt: !finished } : {}) }),
    });
  });
  // Don't really change the test account's causes
  await page.route(/\/rest\/v1\/user_profiles/, (route) => route.request().method() === 'POST'
    ? route.fulfill({ status: 201, headers: { 'access-control-allow-origin': '*' }, body: '' })
    : route.continue());
  const changeACause = async () => {
    const group = page.getByRole('group', { name: 'Causes' });
    await expect(group.getByRole('button')).toHaveCount(7);
    const unpicked = group.getByRole('button').filter({ hasNotText: /pick \d/ });
    const picked = group.getByRole('button', { name: /pick \d/ });
    if (await picked.count() < 3) await unpicked.first().click();
    else await picked.first().click();
    await page.getByRole('button', { name: 'Save Changes' }).click();
  };

  await openApp(page);
  await expect(page.getByRole('heading', { name: "That's today's matches" })).toBeVisible();
  await expect(page.getByText("Changes start with tomorrow's matches.")).toBeVisible();
  await page.getByRole('button', { name: 'Change my causes' }).click();
  await expect(page.getByText("You've seen all of today's matches, so changes here start with tomorrow's.")).toBeVisible();
  await changeACause();
  await expect(page.getByText("Saved. Your new picks start with tomorrow's matches.")).toBeVisible();
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByText("Your new causes are saved. You've already seen today's matches, so they start with tomorrow's.")).toBeVisible();
  await page.screenshot({ path: 'e2e/screens/causes-wait-for-tomorrow.png' });

  // With cards left, saving new causes rebuilds the rest of today's deck
  finished = false;
  await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('deck_finished_')).forEach(k => localStorage.removeItem(k)));
  await page.reload();
  await expect(page.locator('[data-swipe-card="top"]')).toBeVisible();
  await page.getByRole('button', { name: 'Profile' }).click();
  await expect(page.getByText("You've seen all of today's matches")).toHaveCount(0);
  await changeACause();
  await expect(page.getByText('Saved.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByText("Today's remaining matches now follow your new picks.")).toBeVisible();
  expect(rebuilds).toEqual([true, false]);
});
