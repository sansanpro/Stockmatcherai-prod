import { test, expect, type Page } from '@playwright/test';
import { openApp } from './helpers';
import { measureContrast } from './contrast-audit';

// Phase 3: Premium screens, Ask AI and the optional tip (UI only). Runs as the test account.

const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'POST, GET, OPTIONS' };
const stubFunction = (page: Page, name: string, status: number, body: unknown) =>
  page.route(new RegExp(`/functions/v1/${name}`), (route) => route.request().method() === 'OPTIONS'
    ? route.fulfill({ status: 200, headers: cors })
    : route.fulfill({ status, contentType: 'application/json', headers: cors, body: JSON.stringify(body) }));
const asPremium = (page: Page) => stubFunction(page, 'check-subscription', 200, { subscribed: true, subscription_tier: 'premium', subscription_end: null });
const asFree = (page: Page) => stubFunction(page, 'check-subscription', 200, { subscribed: false, subscription_tier: 'free', subscription_end: null });
const chatPanel = (page: Page) => page.locator('div[data-ai-assistant].fixed');

async function ensureTwoLikes(page: Page) {
  await page.getByRole('button', { name: 'Likes' }).click();
  const cards = page.getByRole('button', { name: /^View .* details$/ });
  await page.waitForTimeout(1500);
  if (await cards.count() >= 2) return;
  await page.getByRole('button', { name: 'Match' }).click();
  for (let i = 0; i < 2; i++) {
    const like = page.getByRole('button', { name: 'Like this company' });
    if (!(await like.isVisible().catch(() => false))) break;
    await like.click();
    await page.waitForTimeout(700);
  }
  await page.getByRole('button', { name: 'Likes' }).click();
  await expect.poll(() => cards.count()).toBeGreaterThanOrEqual(2);
}

test('free: Compare and tutor mode explain they are Premium, with only real perks', async ({ page }) => {
  await asFree(page);
  await openApp(page);
  await ensureTwoLikes(page);
  await page.getByRole('button', { name: /^Compare/ }).click();
  const sheet = page.getByRole('dialog');
  await expect(sheet.getByRole('heading', { name: 'Compare side by side' })).toBeVisible();
  for (const perk of ['12 matches a day', 'Unlimited Ask AI', 'Tutor mode']) await expect(sheet.getByText(perk, { exact: true })).toBeVisible();
  await expect(sheet.getByText(/better (picks|returns|investments)|beat the market/i)).toHaveCount(0);
  await expect(sheet.getByText(/Educational only, not investment advice/)).toBeVisible();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'docs/phase3/screens/paywall-compare.png' });
  expect(await measureContrast(page), 'paywall-compare contrast').toEqual([]);
  await sheet.getByRole('button', { name: 'Maybe later' }).click();

  await page.getByRole('button', { name: 'Open Ask AI' }).click();
  await chatPanel(page).getByRole('button', { name: /Step by step/ }).click();
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Learn step by step' })).toBeVisible();
});

test('premium: pick two liked companies and see them side by side', async ({ page }) => {
  await asPremium(page);
  await openApp(page);
  await ensureTwoLikes(page);
  await page.getByRole('button', { name: /^Compare/ }).click();
  await expect(page.getByText('Pick two to compare.')).toBeVisible();
  const picks = page.getByRole('button', { name: /^Compare .+/ });
  await picks.nth(0).click();
  await expect(picks.nth(0)).toHaveAttribute('aria-pressed', 'true');
  await picks.nth(1).click();
  const sheet = page.getByRole('dialog');
  await expect(sheet.getByRole('heading', { name: 'Side by side' })).toBeVisible();
  // Proof, things to know and cautions all appear, for both companies
  for (const row of ['Proof', 'Things to know', 'Big swings', 'What it does']) await expect(sheet.getByRole('heading', { name: row })).toBeVisible();
  await expect(sheet.getByText(/Educational only, not investment advice/)).toBeAttached();
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'docs/phase3/screens/compare.png' });
  expect(await measureContrast(page), 'compare contrast').toEqual([]);
});

test('premium: tutor mode sends the question as a step-by-step lesson', async ({ page }) => {
  await asPremium(page);
  let sent = '';
  await page.route(/\/functions\/v1\/stock-assistant/, async (route) => {
    if (route.request().method() !== 'POST') return route.fulfill({ status: 200, headers: cors });
    sent = JSON.parse(route.request().postData() ?? '{}').message;
    return route.fulfill({ status: 200, headers: { ...cors, 'content-type': 'text/event-stream' },
      body: 'data: {"type":"content_delta","delta":"1. A P/E ratio compares a share price to profit."}\n\ndata: [DONE]\n\n' });
  });
  await openApp(page);
  await page.getByRole('button', { name: 'Open Ask AI' }).click();
  const tutor = chatPanel(page).getByRole('button', { name: /Step by step/ });
  await tutor.click();
  await expect(tutor).toHaveAttribute('aria-pressed', 'true');
  await page.getByPlaceholder('Ask about a company or term…').fill('What is a P/E ratio?');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(chatPanel(page).getByText('A P/E ratio compares')).toBeVisible();
  expect(sent).toMatch(/^Tutor mode: .*step by step.* What is a P\/E ratio\?$/);
  await expect(chatPanel(page).getByText('What is a P/E ratio?', { exact: true })).toBeVisible(); // the user sees their own words
});

test('Ask AI: disclaimer always shown; out of free questions is said before typing', async ({ page }) => {
  await asFree(page);
  // The widget counts today's answered questions from the database; pretend all 5 are used
  await page.route(/\/rest\/v1\/ai_chat_messages/, (route) => route.fulfill({ status: 200, headers: { ...cors, 'content-range': '0-4/5', 'access-control-expose-headers': 'content-range' }, contentType: 'application/json', body: '[]' }));
  await page.route(/\/rest\/v1\/ai_chat_conversations/, (route) => route.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: '[{"id":"00000000-0000-0000-0000-000000000001"}]' }));
  await openApp(page);
  await page.getByRole('button', { name: 'Open Ask AI' }).click();
  await expect(chatPanel(page).getByText('Educational only, not investment advice.')).toBeVisible();
  await expect(chatPanel(page).getByText("You've used today's 5 free questions.")).toBeVisible();
  await expect(page.getByPlaceholder('Ask about a company or term…')).toHaveCount(0);
  await page.screenshot({ path: 'docs/phase3/screens/ask-ai-out.png' });
  expect(await measureContrast(page), 'ask-ai-out contrast').toEqual([]);
});

test('"Ask AI about" a company opens the chat with the question filled in, not sent', async ({ page }) => {
  let posts = 0;
  await page.route(/\/functions\/v1\/stock-assistant/, (route) => { if (route.request().method() === 'POST') posts++; return route.continue(); });
  await openApp(page);
  await page.getByRole('button', { name: 'View stock details' }).first().click();
  const ask = page.getByRole('button', { name: /^Ask AI about / });
  const name = (await ask.textContent())!.replace('Ask AI about ', '').trim();
  await ask.scrollIntoViewIfNeeded();
  await ask.click();
  await expect(page.getByPlaceholder('Ask about a company or term…')).toHaveValue(new RegExp(`^What does ${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  expect(posts).toBe(0);
});

test.describe('the optional tip', () => {
  test('hidden until the purchase is approved', async ({ page }) => {
    await openApp(page);
    await page.getByRole('button', { name: 'Profile' }).click();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await expect(page.getByText('Support StockMatcherAI')).toHaveCount(0);
  });

  test('preview: Profile row, plain copy, equal "Not now", thank-you', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('support_preview', '1'));
    await openApp(page);
    await page.getByRole('button', { name: 'Profile' }).click();
    await page.getByText('Support StockMatcherAI').click();
    const sheet = page.getByRole('dialog');
    await expect(sheet.getByRole('heading', { name: 'Help keep StockMatcherAI going' })).toBeVisible();
    await expect(sheet.getByText(/It goes to StockMatcherAI, not to a charity, and it doesn't unlock anything/)).toBeVisible();
    await expect(sheet.getByText(/donat|tax/i)).toHaveCount(0);
    const tip = sheet.getByRole('button', { name: 'Tip $1.99' });
    const notNow = sheet.getByRole('button', { name: 'Not now' });
    await page.waitForTimeout(500); // the sheet's rise has finished
    expect((await tip.boundingBox())!.height).toBeCloseTo((await notNow.boundingBox())!.height, 1); // equal weight
    await page.screenshot({ path: 'docs/phase3/screens/tip.png' });
  expect(await measureContrast(page), 'tip contrast').toEqual([]);
    await tip.click();
    await expect(sheet.getByRole('heading', { name: 'Thank you' })).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'docs/phase3/screens/tip-thanks.png' });
  expect(await measureContrast(page), 'tip-thanks contrast').toEqual([]);
  });

  test('recap card: at most weekly, gone after "Not now" twice', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('support_preview', '1'));
    await openApp(page);
    const rules = await page.evaluate(async () => {
      // @ts-expect-error Vite serves the TypeScript module in dev
      const m = await import('/src/lib/support.ts');
      localStorage.removeItem('support_recap');
      const day = (d: string) => new Date(`${d}T12:00:00Z`);
      const out: boolean[] = [];
      out.push(m.shouldOfferTipOnRecap(day('2026-11-01'))); // first time: yes
      m.markTipOfferShown(day('2026-11-01'));
      out.push(m.shouldOfferTipOnRecap(day('2026-11-05'))); // 4 days later: no
      out.push(m.shouldOfferTipOnRecap(day('2026-11-08'))); // a week later: yes
      m.dismissTipOffer();
      m.markTipOfferShown(day('2026-11-08'));
      out.push(m.shouldOfferTipOnRecap(day('2026-11-15'))); // one "Not now": still weekly
      m.dismissTipOffer();
      out.push(m.shouldOfferTipOnRecap(day('2026-12-30'))); // two: never again
      localStorage.removeItem('support_recap');
      return out;
    });
    expect(rules).toEqual([true, false, true, true, false]);
  });
});
