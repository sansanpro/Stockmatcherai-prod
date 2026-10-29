import { test, expect } from '@playwright/test';

// Motion checks. Signed out, so nothing is written to the test account. (The Phase 2 swipe and its
// tests were reverted on 2026-10-28 at the owner's request; the swipe is the original one again.)
test.use({ storageState: { cookies: [], origins: [] } });

// Phase 4: the cause orbit (CSS 3D) on the lab route, which renders the same CauseOrbit as the recap
test('the cause orbit turns, logos pass behind the emblem, and it holds still under reduced motion', async ({ page }) => {
  const positions = () => page.locator('.cause-orbit-item').evaluateAll(els => els.map(el => { const r = el.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y)]; }));
  await page.goto('/lab/orbit?v=css');
  await expect(page.locator('.cause-orbit-item')).toHaveCount(8);
  const a = await positions();
  await page.waitForTimeout(1500);
  expect(await positions()).not.toEqual(a);
  // Depth: a logo crossing the emblem is hidden by it on the far side and covers it on the near side
  const crossing = () => page.evaluate(() => {
    const e = document.querySelector('.cause-orbit-emblem img')!.getBoundingClientRect();
    const seen = { behind: false, front: false };
    for (const item of document.querySelectorAll('.cause-orbit-item')) {
      const r = item.getBoundingClientRect(), x = r.x + r.width / 2, y = r.y + r.height / 2;
      if (x < e.x + e.width * 0.1 || x > e.right - e.width * 0.1 || y < e.y + e.height * 0.1 || y > e.bottom - e.height * 0.1) continue;
      if (item.contains(document.elementFromPoint(x, y))) seen.front = true; else seen.behind = true;
    }
    return seen;
  });
  const seen = { behind: false, front: false };
  await expect.poll(async () => { const c = await crossing(); seen.behind ||= c.behind; seen.front ||= c.front; return seen; }, { timeout: 15_000, intervals: [250] })
    .toEqual({ behind: true, front: true });

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await expect(page.locator('.cause-orbit-item')).toHaveCount(8);
  expect(await page.locator('.cause-orbit-item').first().evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  await page.waitForTimeout(500);
  const b = await positions();
  await page.waitForTimeout(1500);
  expect(await positions()).toEqual(b);
});
