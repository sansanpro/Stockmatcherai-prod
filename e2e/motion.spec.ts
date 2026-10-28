import { test, expect, type Page } from '@playwright/test';

// The swipe gesture and the reduced-motion versions (docs/phase-0.md, motion storyboard).
// Signed out, so nothing is written to the test account.
test.use({ storageState: { cookies: [], origins: [] } });

const TOP = '[data-swipe-card="top"]';

async function openDeck(page: Page) {
  await page.addInitScript(() => {
    if (!localStorage.getItem('analytics_install_id')) localStorage.setItem('analytics_install_id', `e2e-${Math.random().toString(36).slice(2, 12)}`);
    localStorage.setItem('coach_first_card', 'seen');
    localStorage.setItem('onboarding_v2_answers', JSON.stringify({ causes: ['clean_energy', 'beat_cancer'], dealbreakers: [], risk: 'medium', experience: 'few', goal: 'growth' }));
  });
  await page.goto('/app');
  await page.locator(TOP).waitFor();
}

const left = async (page: Page) => Number((await page.getByText(/matches left today/).textContent())!.match(/^(\d+)/)![1]);
const transform = (page: Page) => page.locator(TOP).evaluate(el => getComputedStyle(el).transform);

// Presses on the card's story, drags dx in `steps` moves `gap` ms apart, and returns a release function
async function dragBy(page: Page, dx: number, { steps = 20, gap = 8, release = true } = {}) {
  const box = (await page.locator(TOP).boundingBox())!;
  const x = box.x + box.width / 2, y = box.y + box.height * 0.6;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(x + (dx * i) / steps, y);
    await page.waitForTimeout(gap);
  }
  if (release) await page.mouse.up();
}

test('a short slow drag springs back; a long one passes; a flick passes', async ({ page }) => {
  await openDeck(page);
  const start = await left(page);
  const ticker = await page.locator(TOP).getByText(/·/).first().textContent();

  await dragBy(page, 80, { gap: 30 }); // under 35% of the width, slow
  await expect.poll(() => transform(page)).toBe('matrix(1, 0, 0, 1, 0, 0)');
  expect(await left(page)).toBe(start);
  await expect(page.getByRole('dialog')).toHaveCount(0); // a drag isn't a tap

  await dragBy(page, -220); // past 35%
  await expect.poll(() => left(page)).toBe(start - 1);
  await expect(page.locator(TOP).getByText(/·/).first()).not.toHaveText(ticker!);

  await dragBy(page, -70, { steps: 4, gap: 5 }); // short but fast
  await expect.poll(() => left(page)).toBe(start - 2);
});

test('the card tilts with the drag and can be grabbed while springing back', async ({ page }) => {
  await openDeck(page);
  const start = await left(page);
  await dragBy(page, 100, { gap: 30, release: false });
  const m = (await transform(page)).match(/matrix\(([^)]+)\)/)![1].split(',').map(Number);
  expect(Math.atan2(m[1], m[0]) * 180 / Math.PI).toBeCloseTo(100 * 0.06, 0); // 0.06° per px
  await page.mouse.up();
  // Grab it mid-flight: it stops where it is and follows the new drag
  await page.waitForTimeout(40);
  const box = (await page.locator(TOP).boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.6);
  await page.mouse.down();
  await page.waitForTimeout(100);
  const held = await transform(page);
  expect(held).not.toBe('matrix(1, 0, 0, 1, 0, 0)');
  await page.waitForTimeout(150);
  expect(await transform(page)).toBe(held);
  await page.mouse.up(); // released without moving: springs back, doesn't open
  await expect.poll(() => transform(page)).toBe('matrix(1, 0, 0, 1, 0, 0)');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await left(page)).toBe(start);
});

test('a tap opens the card; the pass button flies it off', async ({ page }) => {
  await openDeck(page);
  const start = await left(page);
  const box = (await page.locator(TOP).boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.6);
  await expect(page.getByRole('dialog').getByText('Stock Details')).toBeVisible();
  await page.getByRole('button', { name: 'Collapse stock details' }).click();
  await page.getByRole('button', { name: 'Pass' }).click();
  await expect.poll(() => left(page)).toBe(start - 1);
});

test('reduced motion: no tilt, a short fade instead of a fling, fades instead of rises', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openDeck(page);
  const start = await left(page);

  await dragBy(page, 100, { gap: 30, release: false });
  const m = (await transform(page)).match(/matrix\(([^)]+)\)/)![1].split(',').map(Number);
  expect(m[1]).toBe(0); // no rotation
  await page.mouse.up();
  await expect.poll(() => transform(page)).toBe('matrix(1, 0, 0, 1, 0, 0)');

  // The pass button: the card slides 40 px at most and fades
  const xs: number[] = [];
  await page.getByRole('button', { name: 'Pass' }).click();
  for (let i = 0; i < 6; i++) {
    const t = await page.locator(TOP).evaluate(el => getComputedStyle(el).transform).catch(() => null);
    if (t && t.startsWith('matrix(')) xs.push(Number(t.slice(7, -1).split(',')[4]));
    await page.waitForTimeout(20);
  }
  await expect.poll(() => left(page)).toBe(start - 1);
  expect(Math.min(0, ...xs)).toBeGreaterThanOrEqual(-40);

  // CSS: animations become a fade, sheets don't slide
  const names = await page.evaluate(() => {
    const probe = (cls: string) => {
      const el = document.createElement('div');
      el.className = cls;
      document.body.appendChild(el);
      const name = getComputedStyle(el).animationName;
      el.remove();
      return name;
    };
    return { rise: probe('rise-in'), art: probe('art-3d'), heart: probe('heart-pop'), sheet: probe('animate-in slide-in-from-bottom') };
  });
  expect(names.rise).toBe('fade-in');
  expect(names.art.split(', ').filter(n => n !== 'none')).toEqual(['fade-in']); // the float loop is off
  expect(names.heart).toBe('none');
  expect(names.sheet).toBe('enter');
  const slide = await page.evaluate(() => {
    const el = document.createElement('div');
    el.className = 'animate-in slide-in-from-bottom';
    document.body.appendChild(el);
    const v = getComputedStyle(el).getPropertyValue('--tw-enter-translate-y').trim();
    el.remove();
    return v;
  });
  expect(slide).toBe('0');
});
