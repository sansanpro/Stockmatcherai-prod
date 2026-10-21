import { test, expect, type Page } from '@playwright/test';

// A first launch: no account, straight into values onboarding, then the deck and the save prompt
test.use({ storageState: { cookies: [], origins: [] } });

const FOSSIL_FLAGGED = ['NEE', 'BE', 'CEG', 'CWEN', 'GEV', 'XEL'];

async function freshInstall(page: Page) {
  await page.addInitScript(() => {
    // Marks test traffic so analytics metrics exclude it
    if (!localStorage.getItem('analytics_install_id')) {
      localStorage.setItem('analytics_install_id', `e2e-${Math.random().toString(36).slice(2, 12)}`);
    }
  });
}

const like = (page: Page) => page.getByRole('button', { name: 'Like this company' }).click();

test('new user: onboarding, reveal, first matches and the save prompt, all without an account', async ({ page }) => {
  const events: { event: string; status: number; props: Record<string, unknown> }[] = [];
  page.on('response', async (response) => {
    if (response.url().includes('/rest/v1/analytics_events') && response.request().method() === 'POST') {
      const body = JSON.parse(response.request().postData() ?? '{}');
      events.push({ event: body.event, status: response.status(), props: body.props ?? {} });
    }
  });
  await freshInstall(page);
  await page.goto('/app');

  // 1. Hook (no sign-in wall)
  await expect(page.getByText('Your money is already saying something.', { exact: false })).toBeVisible();
  await expect(page.getByText('No account needed.', { exact: false })).toBeVisible();
  await page.screenshot({ path: 'e2e/screens/onboarding-1-hook.png' });
  await page.getByRole('button', { name: 'Find my matches' }).click();

  // 2. Why (one tap moves on)
  await expect(page.getByText("What's finally pushing you to start?")).toBeVisible();
  await page.getByRole('radio', { name: 'I want my money to actually mean something' }).click();

  // 3. Causes: tap order is the rank, each pick shows its live count
  await expect(page.getByText('What do you want your money to fight for?')).toBeVisible();
  await page.getByRole('button', { name: /^Beat cancer & disease/ }).click();
  await page.getByRole('button', { name: /^Clean energy & climate/ }).click();
  await expect(page.getByRole('button', { name: 'Beat cancer & disease, pick 1' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Clean energy & climate, pick 2' })).toBeVisible();
  await expect(page.getByText(/\d+ companies are working on this/).first()).toBeVisible();
  await page.screenshot({ path: 'e2e/screens/onboarding-3-causes.png' });
  await page.getByRole('button', { name: 'Continue' }).click();

  // 4. Dealbreakers (no animal testing option)
  await expect(page.getByText("Anything you'd never want your money to fund?")).toBeVisible();
  await expect(page.getByText(/animal testing/i)).toHaveCount(0);
  await page.getByRole('checkbox', { name: 'Fossil fuels' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  // 5. Risk as behavior, plus experience
  await expect(page.getByText('Imagine a company you own drops 20% in a month.', { exact: false })).toBeVisible();
  await page.getByRole('radio', { name: 'Wait it out.' }).click();
  await page.getByRole('radio', { name: 'Never' }).click();

  // 6. Goal and (optional) starting amount
  await expect(page.getByText("What's this money for?")).toBeVisible();
  await page.getByRole('radio', { name: 'Growing it for the long haul (5+ years)' }).click();
  await page.getByRole('radio', { name: '$500' }).click();
  await expect(page.getByText(/slice of a share for as little as \$5/)).toBeVisible();
  await page.screenshot({ path: 'e2e/screens/onboarding-6-goal.png' });
  await page.getByRole('button', { name: 'Continue' }).click();

  // 7. Reveal: real count of matching companies (minus fossil-flagged ones) and the values card
  await expect(page.getByText(/We found \d+ companies working on Beat cancer & disease and Clean energy & climate\./)).toBeVisible();
  await expect(page.getByText('I invest in what I believe in:')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Share' })).toBeVisible();
  await page.waitForTimeout(3500); // let the build animation and the count finish
  await page.screenshot({ path: 'e2e/screens/onboarding-7-reveal.png' });
  await page.getByRole('button', { name: 'See my first 7 matches' }).click();

  // First deck: values-matched cards and the one-time coach mark
  await expect(page.getByText('P/E Ratio').first()).toBeVisible();
  await expect(page.getByText("Swipe right if you'd be proud to own a piece of this company.")).toBeVisible();
  await expect(page.getByText('7 of 7 matches left today')).toBeVisible();
  await page.screenshot({ path: 'e2e/screens/onboarding-8-first-card.png' });
  const deck = await page.evaluate(() => JSON.parse(localStorage.getItem('device_feed_v1') ?? '{}'));
  const tickers: string[] = deck.deck.cards.map((c: { ticker: string }) => c.ticker);
  expect(tickers.length).toBe(7);
  expect(tickers.filter(t => FOSSIL_FLAGGED.includes(t))).toEqual([]);
  await page.getByRole('button', { name: 'Got it' }).click();

  // First like: soft save prompt
  await like(page);
  await expect(page.getByRole('dialog').getByText('Save your matches?')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue with Apple' })).toBeVisible();
  await page.waitForTimeout(600); // sheet slide-in
  await page.screenshot({ path: 'e2e/screens/onboarding-9-save-prompt.png' });
  await page.getByRole('button', { name: 'Not now' }).click();
  await expect(page.getByText('6 of 7 matches left today')).toBeVisible();

  // Third like: keeping the list needs an account
  await like(page);
  await expect(page.getByText('5 of 7 matches left today')).toBeVisible();
  await like(page);
  await expect(page.getByRole('dialog').getByText('Keep your matches')).toBeVisible();
  await page.waitForTimeout(600); // sheet slide-in
  await page.screenshot({ path: 'e2e/screens/onboarding-10-keep-prompt.png' });
  await page.getByRole('button', { name: 'Keep swiping without saving' }).click();
  await like(page);

  // Likes: the first three are shown, the rest wait for an account
  await page.getByRole('button', { name: 'Likes' }).click();
  await expect(page.getByText('1 more like is waiting')).toBeVisible();
  await page.screenshot({ path: 'e2e/screens/onboarding-11-likes.png' });

  // The day's deck and answers survive a reload
  await page.reload();
  await expect(page.getByText('3 of 7 matches left today')).toBeVisible();

  await expect.poll(() => events.map(e => e.event), { timeout: 10_000 })
    .toEqual(expect.arrayContaining(['onboarding_started', 'onboarding_complete', 'deck_loaded', 'first_like', 'save_prompt_shown']));
  expect(events.every(e => e.status === 201)).toBe(true);
  expect(events.find(e => e.event === 'onboarding_complete')?.props.version).toBe(2);
});

test('"I already have an account" goes to sign in', async ({ page }) => {
  await freshInstall(page);
  await page.goto('/app');
  await page.getByRole('button', { name: 'I already have an account' }).click();
  await expect(page.getByText('Welcome back')).toBeVisible();
  await expect(page.locator('#signin-email')).toBeVisible();
});
