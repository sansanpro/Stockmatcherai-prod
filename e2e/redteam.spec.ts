import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
import { openApp } from './helpers';
import { measureContrast } from './contrast-audit';

// Phase 5 red-team sweep: every main screen, checked by outside instruments. Runs only when REDTEAM_OUT is set:
//   REDTEAM_OUT=docs/phase5/sweep.json npx playwright test e2e/redteam.spec.ts --project=iphone
// (REDTEAM_SCREENS sets the screenshot folder, REDTEAM_SCHEME=dark checks dark mode)
// Per screen: axe-core (WCAG 2.2 A/AA plus best practices), our contrast audit, touch targets under 44 pt
// (Apple) and 24 px (WCAG 2.5.8), animations that never stop (battery), sideways overflow, and the same
// screen at the largest iOS text size the app follows (root 20 px, see src/lib/textSize.ts) for overflow and clipped text.
const out = process.env.REDTEAM_OUT;
test.skip(!out, 'set REDTEAM_OUT to run the red-team sweep');
const LARGE_ROOT = process.env.REDTEAM_ROOT ?? '20px';
// REDTEAM_SCHEME=dark runs the sweep in dark mode (the app follows the system setting)
test.use({ colorScheme: process.env.REDTEAM_SCHEME === 'dark' ? 'dark' : 'light' });
const results: Record<string, unknown> = fs.existsSync(out ?? '') ? JSON.parse(fs.readFileSync(out!, 'utf8')) : {};

async function audit(page: Page, name: string) {
  await page.waitForTimeout(900); // entrance animations
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
  const contrast = await measureContrast(page);
  const scan = () => page.evaluate(() => {
    const visible = (el: Element) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && r.bottom > 0 && r.top < innerHeight; };
    const label = (el: Element) => (el.getAttribute('aria-label') || (el as HTMLElement).innerText || el.getAttribute('title') || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 50);
    const targets = [...document.querySelectorAll('button, a[href], [role="button"], [role="checkbox"], [role="radio"], [role="tab"], [role="switch"], input, select, textarea')]
      .filter(visible)
      .map(el => {
        // Count the extended tap area of `.tap-target` controls (their ::after reaches past the box)
        const r = el.getBoundingClientRect(); const a = getComputedStyle(el, '::after');
        const grow = (v: string) => (el.classList.contains('tap-target') ? Math.max(0, -parseFloat(v) || 0) : 0);
        return { name: label(el), w: Math.round(r.width + grow(a.left) + grow(a.right)), h: Math.round(r.height + grow(a.top) + grow(a.bottom)) };
      })
      .filter(t => t.w < 44 || t.h < 44);
    const forever = document.getAnimations()
      .filter(a => a.playState === 'running' && (a.effect?.getTiming().iterations ?? 1) === Infinity)
      .map(a => { const t = (a.effect as KeyframeEffect).target as Element | null; return `${(a as CSSAnimation).animationName ?? 'js'} on ${t?.className?.toString().slice(0, 40) ?? '?'}`; });
    const clipped = [...document.querySelectorAll('body *')].filter(el => {
      if (!visible(el) || !(el as HTMLElement).innerText?.trim() || el.children.length) return false;
      const cs = getComputedStyle(el);
      return (cs.overflow === 'hidden' || cs.textOverflow === 'ellipsis' || cs.webkitLineClamp !== 'none') && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1);
    }).map(el => (el as HTMLElement).innerText.trim().slice(0, 50));
    const offRight = [...document.querySelectorAll('body *')].filter(el => visible(el) && el.getBoundingClientRect().right > innerWidth + 1 && !el.closest('[data-swipe-card]'))
      .map(el => `${el.tagName} ${(el as HTMLElement).innerText?.trim().slice(0, 30) ?? ''}`).slice(0, 8);
    return { targets, forever: [...new Set(forever)], clipped, offRight, sidewaysScroll: document.documentElement.scrollWidth > innerWidth };
  });
  const normal = await scan();
  await page.screenshot({ path: `${process.env.REDTEAM_SCREENS ?? 'docs/phase5/screens'}/${name}.png` });
  await page.evaluate((size) => { document.documentElement.style.fontSize = size; document.documentElement.classList.add('text-large'); }, LARGE_ROOT);
  await page.waitForTimeout(400);
  const large = await scan();
  await page.screenshot({ path: `${process.env.REDTEAM_SCREENS ?? 'docs/phase5/screens'}/${name}-large.png` });
  await page.evaluate(() => { document.documentElement.style.fontSize = ''; document.documentElement.classList.remove('text-large'); });
  results[name] = {
    axe: axe.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length, examples: v.nodes.slice(0, 3).map(n => n.html.slice(0, 140)) })),
    contrast: contrast.map(c => `${c.text} (${c.ratio})`),
    smallTargets: normal.targets,
    under24: normal.targets.filter(t => t.w < 24 || t.h < 24),
    foreverAnimations: normal.forever,
    clipped: normal.clipped,
    sidewaysScroll: normal.sidewaysScroll,
    large: { sidewaysScroll: large.sidewaysScroll, clipped: large.clipped, offRight: large.offRight },
  };
  fs.writeFileSync(out!, JSON.stringify(results, null, 2));
}

test.describe('signed out: onboarding', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test('onboarding screens', async ({ page }) => {
    test.setTimeout(180_000);
    await page.addInitScript(() => { if (!localStorage.getItem('analytics_install_id')) localStorage.setItem('analytics_install_id', `e2e-${Math.random().toString(36).slice(2, 12)}`); });
    await page.goto('/app');
    await expect(page.getByRole('button', { name: 'Find my matches' })).toBeVisible();
    await audit(page, 'onboarding-hook');
    await page.getByRole('button', { name: 'Find my matches' }).click();
    await expect(page.getByText('What do you want your money to fight for?')).toBeVisible();
    await page.getByRole('button', { name: /^Clean energy & climate/ }).click();
    await audit(page, 'onboarding-causes');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText("Anything you'd never want your money to fund?")).toBeVisible();
    await audit(page, 'onboarding-dealbreakers');
    await page.getByRole('button', { name: /^(Skip|Continue)/ }).click();
    await expect(page.getByRole('radio', { name: 'Wait it out.' })).toBeVisible();
    await audit(page, 'onboarding-risk');
    await page.getByRole('radio', { name: 'Wait it out.' }).click();
    await page.getByRole('radio', { name: 'Never' }).click();
    await expect(page.getByText("What's this money for?")).toBeVisible();
    await page.getByRole('radio', { name: 'Growing it for the long haul (5+ years)' }).click();
    await expect(page.getByRole('button', { name: /See my first \d+ matches/ })).toBeVisible();
    await page.waitForTimeout(3000);
    await audit(page, 'onboarding-reveal');
    await page.getByRole('button', { name: /See my first \d+ matches/ }).click();
    await expect(page.locator('[data-swipe-card="top"]')).toBeVisible();
    await audit(page, 'deck-first-run');
  });

  test('sign-in screen', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    await audit(page, 'auth');
  });

  test('recap', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/lab/orbit?v=recap');
    const reel = page.getByRole('dialog', { name: 'Your day in values' });
    await expect(reel.getByText('Your day in values')).toBeVisible();
    await audit(page, 'recap-intro');
    for (let i = 0; i < 6; i++) await reel.getByRole('button', { name: 'Next' }).click();
    await expect(reel.getByText('What your likes say about you')).toBeVisible();
    await page.waitForTimeout(3000);
    await audit(page, 'recap-insight');
    await reel.getByRole('button', { name: 'Next' }).click();
    await expect(reel.getByText("That's your day.")).toBeVisible();
    await audit(page, 'recap-outro');
  });
});

test.describe('signed in', () => {
  test('main screens', async ({ page }) => {
    test.setTimeout(240_000);
    await openApp(page);
    await expect(page.locator('[data-swipe-card="top"]').or(page.getByText(/That's today's matches|come back tomorrow/i)).first()).toBeVisible();
    await audit(page, 'deck');
    const details = page.getByRole('button', { name: 'View stock details' }).first();
    if (await details.isVisible().catch(() => false)) {
      await details.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await audit(page, 'details');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
    await page.getByRole('button', { name: 'Likes' }).click();
    await page.waitForTimeout(1500);
    await audit(page, 'likes');
    await page.getByRole('button', { name: 'Open Ask AI' }).click();
    await page.waitForTimeout(800);
    await audit(page, 'ask-ai');
    await page.getByRole('button', { name: 'Close Ask AI' }).click();
    await page.getByRole('button', { name: 'Profile' }).click();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await audit(page, 'profile');
    const premium = page.getByRole('button', { name: 'See Premium' });
    if (await premium.isVisible().catch(() => false)) {
      await premium.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await audit(page, 'paywall');
    }
  });
});
