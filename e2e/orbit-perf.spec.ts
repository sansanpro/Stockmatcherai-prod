import { test, expect } from '@playwright/test';
import fs from 'node:fs';

// Phase 4: the recap orbit built three ways (CSS 3D, Lottie, three.js) plus today's static art,
// each measured over 10 s on the hidden lab route. Runs only when PERF_OUT is set:
//   PERF_OUT=docs/phase4/perf-webkit.json npx playwright test e2e/orbit-perf.spec.ts --project=iphone
//   PERF_OUT=docs/phase4/perf-gpu-4x.json PERF_CPU=4 npx playwright test e2e/orbit-perf.spec.ts --project=orbit-gpu
// Chromium also reports main-thread busy time (a proxy for battery) through the DevTools protocol.
const out = process.env.PERF_OUT;
test.skip(!out, 'set PERF_OUT to measure the orbit prototypes');
// LAB_URL points at a production lab build (VITE_LAB=1 vite build, then vite preview) so the
// time to first frame includes downloading the real chunk, not the dev server's on-demand compile.
test.use({ storageState: { cookies: [], origins: [] }, ...(process.env.LAB_URL ? { baseURL: process.env.LAB_URL } : {}) });

const VARIANTS = ['static', 'css', 'lottie', 'three'];
const results: Record<string, unknown> = {};

for (const v of VARIANTS) {
  test(`orbit: ${v}`, async ({ page, browserName }) => {
    test.setTimeout(60_000);
    const cpu = Number(process.env.PERF_CPU || 1);
    const cdp = browserName === 'chromium' ? await page.context().newCDPSession(page) : null;
    if (cdp) {
      await cdp.send('Performance.enable');
      if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
    }
    const metrics = async () => {
      if (!cdp) return null;
      const { metrics: m } = await cdp.send('Performance.getMetrics');
      return Object.fromEntries(m.map(x => [x.name, x.value]));
    };
    await page.goto(`/lab/orbit?v=${v}&measure=10000`);
    await expect(page.getByText(/first frame/)).toBeVisible({ timeout: 20_000 });
    await page.waitForTimeout(1000); // the lab's warm-up
    const m0 = await metrics();
    await page.waitForFunction(() => (window as unknown as { __orbit?: unknown }).__orbit, null, { timeout: 30_000 });
    const m1 = await metrics();
    const r = await page.evaluate(() => (window as unknown as { __orbit: Record<string, unknown> }).__orbit);
    if (m0 && m1) {
      const wall = m1.Timestamp - m0.Timestamp;
      r.mainThreadBusyPct = Math.round(((m1.TaskDuration - m0.TaskDuration) / wall) * 1000) / 10;
      r.scriptPct = Math.round(((m1.ScriptDuration - m0.ScriptDuration) / wall) * 1000) / 10;
      r.cpuSlowdown = cpu;
    }
    results[v] = r;
    await page.screenshot({ path: `docs/phase4/screens/${v}.png` });
    fs.writeFileSync(out!, JSON.stringify(results, null, 2));
  });
}
