import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Phase 5 guards (docs/phase-5.md): axe-core finds nothing critical or serious on the main screens,
// the app follows iOS text size within its cap, the deck stays roomy at large sizes, and no
// animation runs forever on an idle screen. Signed out, so nothing is written to the test account.
test.use({ storageState: { cookies: [], origins: [] } });

const seriousAxe = async (page: Page) => (await page.waitForTimeout(700), await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze())
  .violations.filter(v => v.impact === 'critical' || v.impact === 'serious').map(v => `${v.id}: ${v.nodes[0]?.html.slice(0, 80)}`);

async function openDeck(page: Page) {
  await page.addInitScript(() => {
    if (!localStorage.getItem('analytics_install_id')) localStorage.setItem('analytics_install_id', `e2e-${Math.random().toString(36).slice(2, 12)}`);
    localStorage.setItem('coach_first_card', 'seen');
    localStorage.setItem('onboarding_v2_answers', JSON.stringify({ causes: ['clean_energy', 'beat_cancer', 'keeping_safe'], dealbreakers: [], risk: 'medium', experience: 'few', goal: 'growth' }));
  });
  await page.goto('/app');
  await page.locator('[data-swipe-card="top"]').waitFor();
}

test('no critical or serious axe findings: onboarding, causes, deck, details', async ({ page }) => {
  await page.goto('/app');
  await expect(page.getByRole('button', { name: 'Find my matches' })).toBeVisible();
  expect(await seriousAxe(page), 'hook').toEqual([]);
  await page.getByRole('button', { name: 'Find my matches' }).click();
  await page.getByRole('button', { name: /^Clean energy & climate/ }).click();
  expect(await seriousAxe(page), 'causes').toEqual([]);

  await page.context().clearCookies();
  await openDeck(page);
  expect(await seriousAxe(page), 'deck').toEqual([]);
  await page.getByRole('button', { name: 'View stock details' }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(await seriousAxe(page), 'details').toEqual([]);
});

test('iOS text size: default unchanged, larger sizes grow the app up to 1.25x', async ({ page }) => {
  await page.goto('/app');
  const sizes = await page.evaluate(async () => {
    // @ts-expect-error Vite serves the TypeScript module in dev
    const m = await import('/src/lib/textSize.ts');
    // iOS body sizes: xSmall 14, Large (default) 17, xLarge 19, xxxLarge 23, accessibility 53
    return [14, 17, 19, 23, 53].map((px: number) => m.rootSizeFor(px));
  });
  expect(sizes).toEqual([14, 16, 18, 20, 20]);
});

test('large text: the cause chips share one row, the swipe hint steps aside, and the card keeps its story', async ({ page }) => {
  await openDeck(page);
  await page.evaluate(async () => {
    // @ts-expect-error Vite serves the TypeScript module in dev
    (await import('/src/lib/textSize.ts')).setRootSize(20);
  });
  const chips = page.locator('.deck-causes > *');
  const tops = await chips.evaluateAll(els => [...new Set(els.map(el => Math.round(el.getBoundingClientRect().top)))]);
  expect(tops).toHaveLength(1);
  await expect(page.getByText('← Swipe left to pass · Swipe right to like →')).toBeHidden();
  await expect(page.locator('html')).toHaveClass(/text-large/);
  // The card shows more than its header: the start of the story is on screen
  const card = (await page.locator('[data-swipe-card="top"]').boundingBox())!;
  expect(card.height).toBeGreaterThan(300);
});

test('battery: nothing animates forever on onboarding or the deck', async ({ page }) => {
  const forever = () => page.evaluate(() => document.getAnimations()
    .filter(a => a.playState === 'running' && a.effect?.getTiming().iterations === Infinity)
    .map(a => (a as CSSAnimation).animationName));
  await page.goto('/app');
  await expect(page.getByRole('button', { name: 'Find my matches' })).toBeVisible();
  expect(await forever()).toEqual([]);
  await page.context().clearCookies();
  await page.addInitScript(() => localStorage.removeItem('ai_widget_opened'));
  await openDeck(page);
  // Loading placeholders pulse until their data arrives; after that, nothing should still be looping
  await expect.poll(forever, { timeout: 15_000 }).toEqual([]);
});
