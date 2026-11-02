import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import { openApp } from './helpers';
import { measureContrast } from './contrast-audit';

// Border and safe-area sweep: every main screen at real iPhone screen sizes, with content checked at
// the top, mid-scroll and end of scroll. Browsers have no notch, so env(safe-area-inset-*) is 0 there;
// this rewrites those values to each phone's real insets as the app's code and CSS are served.
// Runs only when BORDERS_OUT is set:
//   BORDERS_OUT=docs/borders npx playwright test e2e/borders.spec.ts --project=iphone
// Findings per screen (docs/borders/report.json):
//   offscreen: text or a control past the left or right edge
//   statusBar: in the status bar / notch area and not covered by a filled header
//   homeBar:   in the home indicator area, or showing below the tab bar
//   clipped:   cut off by a parent that can't scroll (ellipsis and line clamps are deliberate and skipped)
//   covered:   hidden behind something with no way to scroll it clear (checked at the end of scroll)
//   sideways:  the page scrolls sideways
const out = process.env.BORDERS_OUT;
test.skip(!out, 'set BORDERS_OUT to run the border sweep');

const DEVICES = [
  { name: 'iPhone-SE', w: 375, h: 667, top: 20, bottom: 0 },
  { name: 'iPhone-16e', w: 390, h: 844, top: 47, bottom: 34 },
  { name: 'iPhone-16', w: 393, h: 852, top: 59, bottom: 34 },
  { name: 'iPhone-17-Pro-Max', w: 440, h: 956, top: 62, bottom: 34 },
];
type Device = (typeof DEVICES)[number];
type Finding = { kind: string; at: string; text: string; rect: number[]; by?: string };

const reportFile = () => `${out}/report.json`;
const report = (): Record<string, Record<string, Finding[]>> => (fs.existsSync(reportFile()) ? JSON.parse(fs.readFileSync(reportFile(), 'utf8')) : {});

// Serves the app with the phone's real insets in place of env(safe-area-inset-*)
async function phone(page: Page, d: Device) {
  await page.setViewportSize({ width: d.w, height: d.h });
  await page.route(/^http:\/\/localhost:8080\/src\//, async (route) => {
    const response = await route.fetch();
    const type = response.headers()['content-type'] ?? '';
    if (!/javascript|css/.test(type)) return route.fulfill({ response });
    // Not inside Tailwind class names like pb-[max(env(...),1rem)]: their CSS rule is generated from the source
    const body = (await response.text()).replace(/env\(safe-area-inset-(top|bottom)(,\s*[^)]*)?\)/g, (match, side, _fallback, at, text) => {
      const token = text.slice(0, at).split(/[\s"'`]/).pop() ?? '';
      return token.includes('[') ? match : `${side === 'top' ? d.top : d.bottom}px`;
    });
    return route.fulfill({ response, body });
  });
}

const inspectInPage = ({ top, bottom, at, checks }: { top: number; bottom: number; at: string; checks: string[] }) => {
  const W = innerWidth, H = innerHeight;
  const findings: Finding[] = [];
  const opaque = (el: Element) => {
    const cs = getComputedStyle(el);
    const m = cs.backgroundColor.match(/[\d.]+/g);
    const alpha = m ? (m.length > 3 ? parseFloat(m[3]) : 1) : 0;
    return alpha > 0.5 || cs.backgroundImage !== 'none';
  };
  const shown = (el: Element) => {
    for (let e: Element | null = el; e; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) < 0.05) return false;
      if (e.getAttribute('data-swipe-card') === 'behind') return false;
    }
    return true;
  };
  const seen = new Set<string>();
  const add = (kind: string, text: string, r: DOMRect, by?: string) => {
    const key = `${kind}|${text}`;
    if (seen.has(key)) return;
    seen.add(key);
    findings.push({ kind, at, text: text.slice(0, 60), rect: [r.left, r.top, r.right, r.bottom].map(Math.round), ...(by ? { by } : {}) });
  };

  const inspect = (el: Element, r: DOMRect, text: string) => {
    if (r.width < 1 || r.height < 1 || !shown(el)) return;
    // Trim to what the parents leave on screen
    let [l, t, ri, b] = [r.left, r.top, r.right, r.bottom];
    let cutBy: Element | null = null;
    for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) {
      const cs = getComputedStyle(e);
      const ox = cs.overflowX, oy = cs.overflowY;
      if (ox === 'visible' && oy === 'visible') continue;
      const c = e.getBoundingClientRect();
      const before = [l, t, ri, b];
      if (ox !== 'visible') { l = Math.max(l, c.left); ri = Math.min(ri, c.right); }
      if (oy !== 'visible') { t = Math.max(t, c.top); b = Math.min(b, c.bottom); }
      const trimmed = before[0] !== l || before[1] !== t || before[2] !== ri || before[3] !== b;
      const scrolls = /auto|scroll/.test(ox) || /auto|scroll/.test(oy);
      if (trimmed && !scrolls) cutBy = e;
    }
    if (ri - l < 1 || b - t < 1) return; // scrolled or clipped fully out of view
    if (b < 0 || t > H) return;
    const self = getComputedStyle(el);
    const deliberate = self.textOverflow === 'ellipsis' || self.webkitLineClamp !== 'none'
      || !!el.closest('[class*="line-clamp"], .truncate');
    if (checks.includes('clipped') && cutBy && !deliberate && !el.closest('[data-swipe-card]')) add('clipped', text, r, cutBy.className?.toString().slice(0, 50));

    // What's actually on top at the middle of the visible part
    const x = Math.min(Math.max((l + ri) / 2, 0.5), W - 0.5), y = Math.min(Math.max((t + b) / 2, 0.5), H - 0.5);
    const hit = document.elementFromPoint(x, y);
    const related = (a: Element | null) => !!a && (a === el || a.contains(el) || el.contains(a));
    let filledCover: Element | null = null;
    if (hit && !related(hit)) {
      for (let e: Element | null = hit; e && !e.contains(el); e = e.parentElement) {
        if (e.closest('[role="status"]')) break; // the one-time tip, gone once dismissed
        if (opaque(e)) { filledCover = e; break; }
      }
    }
    if (l < -0.5 || ri > W + 0.5) add('offscreen', text, r);
    if (filledCover) {
      // A pinned header over content scrolled past it is fine: scrolling back up reveals it
      const pinnedHeader = filledCover.getBoundingClientRect().bottom < H / 2;
      if (checks.includes('covered') && !pinnedHeader) add('covered', text, r, `${filledCover.tagName} ${(filledCover as HTMLElement).innerText?.trim().slice(0, 24) ?? ''}`);
      return;
    }
    if (t < top - 0.5 && !statusBackdrop) add('statusBar', text, r);
    const floor = navBottom !== null ? Math.min(navBottom, H - bottom) : H - bottom;
    if (b > floor + 0.5) add('homeBar', text, r);
  };

  // With a sheet or the Ask AI panel open, what's behind it isn't on show
  const overlays = Array.from(document.querySelectorAll('[role="dialog"], div[data-ai-assistant].fixed')).filter(el => el.getBoundingClientRect().height > 0);
  const root = overlays[overlays.length - 1] ?? document.body;
  const navCard = root === document.body ? document.querySelector('nav > div') : null;
  const navBottom = navCard ? navCard.getBoundingClientRect().bottom : null;
  // pointer-events: none, so hit tests pass through it; the screenshots show it covering the status bar
  const statusBackdrop = root === document.body && !!document.querySelector('[data-status-backdrop]');
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const text = n.textContent?.trim();
    const parent = n.parentElement;
    if (!text || !parent || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName)) continue;
    if (parent.closest('.sr-only, [data-sonner-toaster]')) continue;
    const range = document.createRange();
    range.selectNodeContents(n);
    for (const r of Array.from(range.getClientRects())) inspect(parent, r, text);
  }
  for (const el of Array.from(root.querySelectorAll('button, a[href], input, textarea, [role="radio"], [role="checkbox"]'))) {
    if (el.closest('.sr-only')) continue;
    // The recap's invisible full-height tap zones
    if (el.getBoundingClientRect().height > H / 2) continue;
    const label = (el.getAttribute('aria-label') || (el as HTMLElement).innerText || (el as HTMLInputElement).placeholder || el.tagName).trim().replace(/\s+/g, ' ');
    inspect(el, el.getBoundingClientRect(), `[control] ${label}`);
  }
  if (document.documentElement.scrollWidth > W + 1 || document.body.scrollWidth > W + 1) {
    findings.push({ kind: 'sideways', at, text: `page is ${Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)} wide on a ${W} screen`, rect: [] });
  }
  return findings;
};

const scrollAll = (page: Page, fraction: number) => page.evaluate((f) => {
  const list = [document.scrollingElement!, ...Array.from(document.querySelectorAll('*'))].filter(el => {
    if (el === document.scrollingElement) return true;
    const oy = getComputedStyle(el).overflowY;
    return /auto|scroll/.test(oy) && el.scrollHeight > el.clientHeight + 1 && el.getBoundingClientRect().height > 0;
  });
  let moved = 0;
  for (const el of list) {
    const max = el.scrollHeight - el.clientHeight;
    if (max > 1) { el.scrollTop = max * f; moved++; }
  }
  return moved;
}, fraction);

async function sweep(page: Page, d: Device, screen: string) {
  await page.waitForTimeout(900); // entrance animations
  const dir = `${out}/${d.name}`;
  fs.mkdirSync(dir, { recursive: true });
  const args = { top: d.top, bottom: d.bottom };
  const findings = await page.evaluate(inspectInPage, { ...args, at: 'top', checks: ['clipped'] });
  await page.screenshot({ path: `${dir}/${screen}.png` });
  const moved = await scrollAll(page, 0.5);
  if (moved) {
    await page.waitForTimeout(250);
    findings.push(...await page.evaluate(inspectInPage, { ...args, at: 'mid-scroll', checks: [] }));
    await page.screenshot({ path: `${dir}/${screen}-mid.png` });
  }
  await scrollAll(page, 1);
  await page.waitForTimeout(250);
  findings.push(...await page.evaluate(inspectInPage, { ...args, at: 'end', checks: ['clipped', 'covered'] }));
  if (moved) await page.screenshot({ path: `${dir}/${screen}-end.png` });
  await scrollAll(page, 0);
  // Scrolling content passing the home indicator is normal; it only matters where it comes to rest
  const real = findings.filter(f => f.kind !== 'homeBar' || !moved || f.at === 'end');
  const all = report();
  (all[d.name] ??= {})[screen] = real;
  fs.writeFileSync(reportFile(), JSON.stringify(all, null, 2));
  expect.soft(real.map(f => `${f.kind} (${f.at}): ${f.text}`), `${d.name} ${screen}`).toEqual([]);
}

for (const d of DEVICES) {
  test.describe(d.name, () => {
    test.describe.configure({ timeout: 300_000 });

    test.describe('signed out', () => {
      test.use({ storageState: { cookies: [], origins: [] } });

      test('onboarding and first deck', async ({ page }) => {
        await phone(page, d);
        await page.addInitScript(() => { if (!localStorage.getItem('analytics_install_id')) localStorage.setItem('analytics_install_id', `e2e-${Math.random().toString(36).slice(2, 12)}`); });
        await page.goto('/app');
        await expect(page.getByRole('button', { name: 'Find my matches' })).toBeVisible();
        await sweep(page, d, 'onboarding-hook');
        await page.getByRole('button', { name: 'Find my matches' }).click();
        await expect(page.getByText('What do you want your money to fight for?')).toBeVisible();
        await page.getByRole('button', { name: /^Clean energy & climate/ }).click();
        await sweep(page, d, 'onboarding-causes');
        await page.getByRole('button', { name: 'Continue' }).click();
        await expect(page.getByText("Anything you'd never want your money to fund?")).toBeVisible();
        await sweep(page, d, 'onboarding-dealbreakers');
        await page.getByRole('button', { name: /^(Skip|Continue)/ }).click();
        await expect(page.getByRole('radio', { name: 'Wait it out.' })).toBeVisible();
        await sweep(page, d, 'onboarding-risk');
        await page.getByRole('radio', { name: 'Wait it out.' }).click();
        await expect(page.getByRole('radio', { name: 'Never' })).toBeVisible();
        await sweep(page, d, 'onboarding-experience');
        await page.getByRole('radio', { name: 'Never' }).click();
        await expect(page.getByText("What's this money for?")).toBeVisible();
        await sweep(page, d, 'onboarding-goal');
        await page.getByRole('radio', { name: 'Growing it for the long haul (5+ years)' }).click();
        await expect(page.getByRole('button', { name: /See my first/ })).toBeVisible();
        await page.waitForTimeout(3000);
        await sweep(page, d, 'onboarding-reveal');
        await page.getByRole('button', { name: /See my first/ }).click();
        await expect(page.locator('[data-swipe-card="top"]')).toBeVisible();
        await sweep(page, d, 'deck-first-run');
      });

      test('sign-in and sign-up', async ({ page }) => {
        await phone(page, d);
        await page.goto('/auth?mode=signin');
        await page.waitForLoadState('networkidle');
        await sweep(page, d, 'auth-signin');
        await page.goto('/auth');
        await page.waitForLoadState('networkidle');
        await sweep(page, d, 'auth-signup');
      });

      test('save prompt, recap and end of day', async ({ page }) => {
        await phone(page, d);
        await page.addInitScript(() => {
          if (!localStorage.getItem('analytics_install_id')) localStorage.setItem('analytics_install_id', `e2e-${Math.random().toString(36).slice(2, 12)}`);
          localStorage.setItem('coach_first_card', 'seen');
          localStorage.setItem('onboarding_v2_answers', JSON.stringify({ causes: ['clean_energy'], dealbreakers: [], risk: 'medium', experience: 'never', goal: 'growth' }));
        });
        await page.goto('/app');
        await page.locator('[data-swipe-card="top"]').waitFor();
        await sweep(page, d, 'deck-explained');
        await page.getByRole('button', { name: 'Like this company' }).click();
        await expect(page.getByRole('dialog').getByText('Save your matches?')).toBeVisible();
        await sweep(page, d, 'save-prompt');
        await page.getByRole('button', { name: 'Not now' }).click();
        await page.waitForTimeout(500);
        await page.getByRole('button', { name: 'Like this company' }).click();
        await page.waitForTimeout(500);
        await page.getByRole('button', { name: 'Like this company' }).click();
        await page.getByRole('button', { name: 'Keep swiping without saving' }).click();
        const reel = page.getByRole('dialog', { name: 'Your day in values' });
        for (let i = 0; i < 25 && !(await reel.isVisible()); i++) {
          await page.getByRole('button', { name: /^(Pass)$/ }).click({ timeout: 3000 }).catch(() => {});
          await page.waitForTimeout(450);
        }
        await expect(reel.getByText('Your day in values')).toBeVisible();
        await sweep(page, d, 'recap-intro');
        await reel.getByRole('button', { name: 'Next' }).click();
        await expect(reel.getByText('Like 1 of 3')).toBeVisible();
        await sweep(page, d, 'recap-company');
        await reel.getByRole('button', { name: 'Next' }).click();
        await reel.getByRole('button', { name: 'Next' }).click();
        await reel.getByRole('button', { name: 'Next' }).click();
        await expect(reel.getByText('What your likes say about you')).toBeVisible();
        await page.waitForTimeout(3200);
        await sweep(page, d, 'recap-insight');
        await reel.getByRole('button', { name: 'Next' }).click();
        await expect(reel.getByText("That's your day.")).toBeVisible();
        await sweep(page, d, 'recap-outro');
        await reel.getByRole('button', { name: 'Done' }).click();
        await expect(page.locator('figure', { hasText: "Today's thought" })).toBeVisible();
        await sweep(page, d, 'end-of-day');
      });
    });

    test('paywall (as a free account)', async ({ page }) => {
      await page.route(/\/functions\/v1\/check-subscription/, (route) => route.request().method() === 'OPTIONS'
        ? route.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' } })
        : route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ subscribed: false, subscription_tier: 'free', subscription_end: null }) }));
      await phone(page, d);
      await openApp(page);
      await page.getByRole('button', { name: 'Profile' }).click();
      await page.getByRole('button', { name: 'See Premium' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await sweep(page, d, 'paywall');
      // Rounded corners stay off the screen edges
      const box = (await page.getByRole('dialog').boundingBox())!;
      expect(box.x).toBeGreaterThan(4);
      expect(box.x + box.width).toBeLessThan(d.w - 4);
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.waitForTimeout(300);
      expect(await measureContrast(page), 'paywall contrast in dark').toEqual([]);
    });

    test('signed in screens', async ({ page }) => {
      await phone(page, d);
      await openApp(page);
      await expect(page.locator('[data-swipe-card="top"]').or(page.getByText("That's today's matches")).first()).toBeVisible();
      await sweep(page, d, 'deck');
      const details = page.getByRole('button', { name: 'View stock details' }).first();
      if (await details.isVisible().catch(() => false)) {
        await page.locator('h2').first().click();
        await expect(page.getByRole('button', { name: 'Collapse stock details' })).toBeVisible();
        await sweep(page, d, 'expanded-card');
        await page.getByRole('button', { name: 'Collapse stock details' }).click();
        await page.waitForTimeout(500);
        await details.click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await sweep(page, d, 'details');
        await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click({ timeout: 5000 }); // fails if something covers it
        await page.waitForTimeout(500);
      }
      await page.getByRole('button', { name: 'Likes' }).click();
      await page.waitForTimeout(1500);
      await sweep(page, d, 'likes');
      await page.getByRole('button', { name: 'Open Ask AI' }).click();
      await page.waitForTimeout(800);
      await sweep(page, d, 'ask-ai');
      await page.getByRole('button', { name: 'Close Ask AI' }).click();
      await page.getByRole('button', { name: 'Profile' }).click();
      await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
      await sweep(page, d, 'profile');
      const premium = page.getByRole('button', { name: 'See Premium' });
      if (await premium.isVisible().catch(() => false)) {
        await premium.click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await sweep(page, d, 'paywall');
      }
    });
  });
}
