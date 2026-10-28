import { test, expect, type Page } from '@playwright/test';

// Frame times and touch response while swiping cards, measured in the page with
// requestAnimationFrame and event timestamps. Runs only when PERF_OUT is set:
//   PERF_OUT=docs/phase2/perf-after.json npx playwright test e2e/motion-perf.spec.ts
// WebKit (the iOS engine) can't be CPU-throttled and its frame timer jitters even when idle, so the
// perf-throttled project repeats this in Chromium with the CPU slowed 4x (PERF_CPU). Both are relative
// measures (before vs after); neither stands in for an iPhone 12.
const out = process.env.PERF_OUT;
test.skip(!out, 'set PERF_OUT to measure swipe performance');
test.use({ storageState: { cookies: [], origins: [] } });

const CARD = '[class*="cursor-grab"]';

async function install(page: Page) {
  await page.evaluate((sel) => {
    const w = window as unknown as { __perf: { frames: number[]; latencies: number[]; on: boolean } };
    w.__perf = { frames: [], latencies: [], on: false };
    let pending: number | null = null; // timestamp of the oldest move not yet on screen
    let last = '';
    // Moves inside the first 12 px are the tap allowance (the card doesn't move yet), so they don't count
    let x0 = 0, y0 = 0;
    document.addEventListener('pointerdown', (e) => { x0 = e.clientX; y0 = e.clientY; pending = null; }, true);
    document.addEventListener('pointermove', (e) => {
      if (pending === null && Math.hypot(e.clientX - x0, e.clientY - y0) > 12) pending = performance.now();
    }, true);
    const tick = (t: number) => {
      const p = w.__perf;
      if (p.on) p.frames.push(t);
      const card = document.querySelector(sel);
      const now = card ? getComputedStyle(card).transform : '';
      if (now !== last) {
        if (p.on && pending !== null) p.latencies.push(performance.now() - pending); // rAF's t can predate the event
        last = now;
        pending = null;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, CARD);
}

const setRecording = (page: Page, on: boolean) =>
  page.evaluate((v) => { (window as unknown as { __perf: { on: boolean } }).__perf.on = v; }, on);

// A finger-paced drag: one move every ~8 ms, then release
async function drag(page: Page, dx: number, steps = 30) {
  const box = (await page.locator(CARD).first().boundingBox())!;
  const x0 = box.x + box.width / 2, y0 = box.y + box.height * 0.6;
  await page.mouse.move(x0, y0);
  await page.mouse.down();
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(x0 + (dx * i) / steps, y0 + (12 * i) / steps);
    await page.waitForTimeout(8);
  }
  await page.mouse.up();
  await page.waitForTimeout(900);
  // The old drag code also opened the details sheet on mouse release; close it so the next drag lands
  if (await page.getByRole('dialog').count()) { await page.keyboard.press('Escape'); await page.waitForTimeout(400); }
}

const pct = (xs: number[], p: number) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? +s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))].toFixed(1) : null;
};

test('swipe frame times and touch response', async ({ page, browserName }) => {
  const cpu = Number(process.env.PERF_CPU ?? 4);
  if (browserName === 'chromium') {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  }
  await page.addInitScript(() => {
    if (!localStorage.getItem('analytics_install_id')) localStorage.setItem('analytics_install_id', `e2e-${Math.random().toString(36).slice(2, 12)}`);
    localStorage.setItem('coach_first_card', 'seen');
    localStorage.setItem('onboarding_v2_answers', JSON.stringify({ causes: ['clean_energy', 'beat_cancer'], dealbreakers: [], risk: 'medium', experience: 'few', goal: 'growth' }));
  });
  await page.goto('/app');
  await page.getByRole('button', { name: 'View stock details' }).first().waitFor();
  await page.waitForTimeout(1200);
  await install(page);
  const counter = page.getByText(/matches left today/);
  const before = await counter.textContent();

  // The browser's own frame jitter with nothing moving, for comparison
  await setRecording(page, true);
  await page.waitForTimeout(3000);
  await setRecording(page, false);
  const idle = await page.evaluate(() => {
    const p = (window as unknown as { __perf: { frames: number[] } }).__perf;
    const f = p.frames.splice(0);
    return f.slice(1).map((t, i) => t - f[i]);
  });

  await setRecording(page, true);
  await drag(page, 60); // not far enough: springs back
  await drag(page, -260); // pass
  await drag(page, -260); // pass
  await drag(page, -90, 6); // short and fast: a flick
  await setRecording(page, false);

  const { frames, latencies } = await page.evaluate(() => (window as unknown as { __perf: { frames: number[]; latencies: number[] } }).__perf);
  const intervals = frames.slice(1).map((t, i) => t - frames[i]);
  const result = {
    measured_on: browserName === 'chromium'
      ? `Playwright Chromium, iPhone 15 viewport, CPU slowed ${cpu}x`
      : 'Playwright WebKit, iPhone 15 viewport, desktop CPU (not throttled)',
    idle: { frames: idle.length, p50: pct(idle, 50), p95: pct(idle, 95), pct_frames_on_time: +(100 * idle.filter(d => d <= 20).length / Math.max(1, idle.length)).toFixed(1) },
    frames: intervals.length,
    frame_ms: { p50: pct(intervals, 50), p95: pct(intervals, 95), p99: pct(intervals, 99), max: pct(intervals, 100) },
    frames_over_20ms: intervals.filter(d => d > 20).length,
    pct_frames_on_time: +(100 * intervals.filter(d => d <= 20).length / Math.max(1, intervals.length)).toFixed(1),
    move_to_frame_ms: { samples: latencies.length, p50: pct(latencies, 50), p95: pct(latencies, 95), max: pct(latencies, 100) },
    deck_counter: { before, after: await counter.textContent() },
  };
  const { writeFileSync } = await import('node:fs');
  writeFileSync(out!, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result, null, 2));
  expect(intervals.length).toBeGreaterThan(30);
});
