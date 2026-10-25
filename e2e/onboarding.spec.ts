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
  await page.waitForTimeout(900); // entrance animations
  await page.screenshot({ path: 'e2e/screens/onboarding-1-hook.png' });
  await page.getByRole('button', { name: 'Find my matches' }).click();

  // 2. Causes (first of five questions, one per screen): tap order is the rank, each pick shows its live count
  await expect(page.getByText('What do you want your money to fight for?')).toBeVisible();
  await page.getByRole('button', { name: /^Beat cancer & disease/ }).click();
  await page.getByRole('button', { name: /^Clean energy & climate/ }).click();
  await expect(page.getByRole('button', { name: 'Beat cancer & disease, pick 1' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Clean energy & climate, pick 2' })).toBeVisible();
  await expect(page.getByText(/\d+ companies are working on this/).first()).toBeVisible();
  await page.waitForTimeout(900); // entrance animations
  await page.screenshot({ path: 'e2e/screens/onboarding-3-causes.png' });
  await page.getByRole('button', { name: 'Continue' }).click();

  // 3. Dealbreakers (no animal testing option)
  await expect(page.getByText("Anything you'd never want your money to fund?")).toBeVisible();
  await expect(page.getByText(/animal testing/i)).toHaveCount(0);
  await page.getByRole('checkbox', { name: 'Fossil fuels' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  // 4-6. One tap each, and each screen moves on by itself: risk as behavior, experience, goal
  await expect(page.getByText('Imagine a company you own drops 20% in a month.', { exact: false })).toBeVisible();
  await page.waitForTimeout(900); // let the art spin in
  await page.screenshot({ path: 'e2e/screens/onboarding-4-risk.png' });
  await page.getByRole('radio', { name: 'Wait it out.' }).click();
  await expect(page.getByText('Have you ever bought a stock?')).toBeVisible();
  await page.getByRole('radio', { name: 'Never' }).click();
  await expect(page.getByText("What's this money for?")).toBeVisible();
  await expect(page.getByText(/What's finally pushing you|Thinking of starting with/)).toHaveCount(0); // dropped questions
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'e2e/screens/onboarding-6-goal.png' });
  await page.getByRole('radio', { name: 'Growing it for the long haul (5+ years)' }).click();

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
  // Never bought a stock: each number also says what it means
  await expect(page.getByText('Cost of one share').first()).toBeVisible();
  await expect(page.getByText('What the whole company is worth').first()).toBeVisible();
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

test('saving from the prompt creates an account that keeps the answers and likes', async ({ page }) => {
  await freshInstall(page);
  await page.goto('/app');

  // Onboarding with one cause, no dealbreakers
  await page.getByRole('button', { name: 'Find my matches' }).click();
  await page.getByRole('button', { name: /^Live longer & healthier/ }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Skip' }).click();
  await page.getByRole('radio', { name: 'Wait it out.' }).click();
  await page.getByRole('radio', { name: 'A few times' }).click();
  await page.getByRole('radio', { name: 'A little extra income' }).click();
  await page.getByRole('button', { name: 'See my first 7 matches' }).click();
  await page.getByRole('button', { name: 'Got it' }).click();

  // Like two companies on the device
  const liked: string[] = [];
  for (let i = 0; i < 2; i++) {
    await page.getByRole('button', { name: 'View stock details' }).first().waitFor();
    liked.push((await page.locator('h2').first().innerText()).trim());
    await like(page);
    if (i === 0) await page.getByRole('button', { name: 'Not now' }).click();
    await expect(page.getByText(`${6 - i} of 7 matches left today`)).toBeVisible();
  }

  // Save them: Profile tab -> save prompt -> email sign-up
  await page.getByRole('button', { name: 'Profile' }).click();
  await page.getByRole('button', { name: 'Use email' }).click();
  await expect(page.getByText('Save your matches')).toBeVisible();
  const email = `e2e-${Date.now()}@example.com`;
  await page.locator('#signup-name').fill('E2E');
  await page.locator('#signup-email').fill(email);
  await page.locator('#signup-password').fill(`Pw-${Math.random().toString(36).slice(2, 12)}!`);
  await page.getByRole('button', { name: 'Save my matches' }).click();

  // Signed in: the account's own (free) deck, without the companies liked before signing up
  await expect(page.getByText(/of 7 matches left today/)).toBeVisible({ timeout: 30_000 });
  const device = await page.evaluate(() => ({
    answers: localStorage.getItem('onboarding_v2_answers'),
    feed: localStorage.getItem('device_feed_v1'),
  }));
  expect(device).toEqual({ answers: null, feed: null }); // moved to the account, gone from the device
  for (const name of liked) await expect(page.locator('h2').first()).not.toHaveText(name);

  // The likes made before sign-up are in the account's Likes list
  await page.getByRole('button', { name: 'Likes' }).click();
  await expect(page.getByText('2 companies saved')).toBeVisible();
  for (const name of liked) await expect(page.getByText(name).first()).toBeVisible();
  await expect(page.getByText(/more likes? (is|are) waiting/)).toHaveCount(0);
  await page.screenshot({ path: 'e2e/screens/signup-likes-carried-over.png' });

  // The answers are on the account: Settings shows the cause and goal picked before sign-up
  await page.getByRole('button', { name: 'Profile' }).click();
  await expect(page.getByRole('button', { name: 'Live longer & healthier, pick 1' })).toBeVisible();
  await expect(page.getByRole('radio', { name: 'A little extra income' })).toHaveAttribute('aria-checked', 'true');

  // Clean up: delete the throwaway account through the app
  await page.getByRole('button', { name: 'Delete Account' }).click();
  await page.getByPlaceholder('Type DELETE to confirm').fill('DELETE');
  await page.getByRole('button', { name: 'Delete My Account' }).click();
  await expect(page.getByText('Your account has been deleted.')).toBeVisible();
});

test('email fields take "@" from one-tap endings as well as the keyboard', async ({ page }) => {
  await freshInstall(page);
  await page.goto('/auth?mode=signin');
  const email = page.locator('#signin-email');
  await expect(email).toHaveAttribute('inputmode', 'email');
  await expect(email).toHaveAttribute('autocapitalize', 'none');
  await email.click();
  await page.keyboard.type('pat');
  await page.getByRole('group', { name: 'Email endings' }).getByRole('button', { name: '@icloud.com' }).click();
  await expect(email).toHaveValue('pat@icloud.com');
  await expect(page.getByRole('group', { name: 'Email endings' })).toHaveCount(0); // done once there's an "@"
  await email.fill('');
  await page.keyboard.type('sam');
  await page.getByRole('group', { name: 'Email endings' }).getByRole('button', { name: '@', exact: true }).click();
  await page.keyboard.type('example.org');
  await expect(email).toHaveValue('sam@example.org');
});

test('signed out, Ask AI is on screen and asks for a free account', async ({ page }) => {
  await freshInstall(page);
  await page.addInitScript(() => {
    localStorage.setItem('onboarding_v2_answers', JSON.stringify({ causes: ['clean_energy'], dealbreakers: [], risk: 'medium', experience: 'few', goal: 'growth' }));
    localStorage.setItem('coach_first_card', 'seen');
  });
  await page.goto('/app');
  await page.getByRole('button', { name: 'View stock details' }).first().waitFor();
  await page.getByRole('button', { name: 'Open Ask AI' }).click();
  const sheet = page.getByRole('dialog');
  await expect(sheet.getByText('Ask AI with a free account')).toBeVisible();
  await expect(sheet.getByRole('button', { name: 'Continue with Apple' })).toBeVisible();
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'e2e/screens/ask-ai-signed-out.png' });
});
