// Captures the current app for ads, in light and dark: walks a new user's onboarding in WebKit at
// iPhone size, then the deck, details, Likes, recap and Ask AI. It reads the running dev server, so
// the shots show the code in the repo right now. It doesn't touch marketing/app-store or marketing/raw.
//
//   npm run dev            (in another terminal)
//   node scripts/capture-ad-shots.mjs      (ASK_AI_ATTEMPTS=1 to give up on a busy Gemini sooner)
//
// Output: marketing/ads/shots/{light,dark}/*.png. `card*` are the card alone, for the swipe animation.
// `*-masked` have the share price and past-year move hidden, by CSS at capture time only.
// Signed-out screens use a throwaway install marked e2e- so analytics ignore it; Ask AI signs in as
// the test account from .env.test.local.
import { chromium, webkit } from '@playwright/test';
import { readFileSync, mkdirSync } from 'node:fs';

const BASE = 'http://localhost:8080';
const W = 393, H = 852, OUT = 'marketing/ads/shots';
const env = Object.fromEntries(readFileSync('.env.test.local', 'utf8').split('\n')
  .map(l => l.match(/^([A-Z0-9_]+)=(.*)$/)).filter(Boolean).map(m => [m[1], m[2]]));

const browser = await webkit.launch();
const newPage = async (scheme) => {
  const context = await browser.newContext({
    viewport: { width: W, height: H }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: scheme,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
  });
  await context.addInitScript(() => {
    if (!localStorage.getItem('analytics_install_id')) {
      localStorage.setItem('analytics_install_id', `e2e-adshots-${Math.random().toString(36).slice(2, 10)}`);
    }
    localStorage.setItem('att_status', 'authorized');
  });
  return context.newPage();
};
const logosLoaded = (page) => page.waitForFunction(() =>
  [...document.querySelectorAll('img')].filter(img => img.getBoundingClientRect().top < innerHeight)
    .every(img => img.complete && img.naturalWidth > 0), null, { timeout: 15_000 }).catch(() => console.log('  (some images still loading)'));

// The price row in the plum header: "Share price" and the amount and past-year pill under it
const maskPrice = (page) => page.evaluate(() => {
  const label = [...document.querySelectorAll('[data-swipe-card="top"] p')].find(el => /^Share price/.test(el.textContent.trim()));
  const row = label?.parentElement;
  if (!row) return false;
  row.dataset.adMask = '1';
  row.style.visibility = 'hidden';
  return true;
});
const unmaskPrice = (page) => page.evaluate(() => document.querySelectorAll('[data-ad-mask]').forEach(el => { el.style.visibility = ''; }));

for (const scheme of ['light', 'dark']) {
  const dir = `${OUT}/${scheme}`;
  mkdirSync(dir, { recursive: true });
  const shot = async (page, name) => {
    await logosLoaded(page);
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${dir}/${name}.png` });
    console.log(scheme, name);
  };
  const shotCard = async (page, name) => {
    const card = page.locator('[data-swipe-card="top"]');
    await logosLoaded(page);
    await page.waitForTimeout(500);
    await shot(page, name.replace('card', 'deck'));
    await card.screenshot({ path: `${dir}/${name}.png`, omitBackground: true });
    if (await maskPrice(page)) {
      await shot(page, `${name.replace('card', 'deck')}-masked`);
      await card.screenshot({ path: `${dir}/${name}-masked.png`, omitBackground: true });
      await unmaskPrice(page);
    } else console.log('  (price row not found, no masked copy)');
  };

  // A new user, no account
  {
    const page = await newPage(scheme);
    await page.goto(`${BASE}/app`);
    await page.getByRole('button', { name: 'Find my matches' }).waitFor();
    await page.waitForTimeout(900);
    await shot(page, 'hook');
    await page.getByRole('button', { name: 'Find my matches' }).click();
    await page.getByText('What do you want your money to fight for?').waitFor();
    await page.getByRole('button', { name: /^Beat cancer & disease/ }).click();
    await page.getByRole('button', { name: /^Clean energy & climate/ }).click();
    await page.getByText(/\d+ companies match/).first().waitFor();
    await shot(page, 'causes');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByText("Anything you'd never want your money to fund?").waitFor();
    await page.getByRole('checkbox', { name: 'Fossil fuels' }).click();
    await shot(page, 'dealbreakers');
    await page.getByRole('button', { name: /^(Skip|Continue)/ }).click();
    await page.getByText('Imagine a company you own drops 20% in a month.').waitFor();
    await page.waitForTimeout(900); // the art spins in
    await shot(page, 'question');
    await page.getByRole('radio', { name: 'Wait it out.' }).click();
    await page.getByRole('radio', { name: 'Never' }).click();
    await page.getByRole('radio', { name: 'Growing it for the long haul (5+ years)' }).click();
    await page.getByRole('button', { name: /See my first \d+ matches/ }).waitFor();
    await page.waitForTimeout(3500); // build animation and count
    await shot(page, 'reveal');
    await page.getByRole('button', { name: /See my first \d+ matches/ }).click();
    await page.getByRole('button', { name: 'Got it' }).click({ timeout: 8000 }).catch(() => {});
    await page.locator('[data-swipe-card="top"]').waitFor();

    // The first three cards, as the deck serves them
    await shotCard(page, 'card-1');

    // The full story, with its sources
    await page.getByRole('button', { name: 'View stock details' }).first().click();
    await page.getByRole('button', { name: 'Got it' }).click({ timeout: 4000 }).catch(() => {}); // the coach tip
    await page.waitForTimeout(1200);
    await shot(page, 'details');
    await page.getByRole('button', { name: 'Collapse stock details' }).first().click({ timeout: 4000 }).catch(() => page.keyboard.press('Escape'));
    await page.waitForTimeout(800);

    await page.getByRole('button', { name: 'Like this company' }).click();
    await page.getByRole('button', { name: 'Not now' }).click({ timeout: 4000 }).catch(() => {});
    await page.waitForTimeout(800);
    await shotCard(page, 'card-2');

    await page.getByRole('button', { name: 'Like this company' }).click();
    await page.waitForTimeout(800);
    await shotCard(page, 'card-3');
    await page.getByRole('button', { name: 'Like this company' }).click();
    await page.getByRole('button', { name: 'Keep swiping without saving' }).click({ timeout: 4000 }).catch(() => {});
    await page.waitForTimeout(800);

    // Metrics, from the next card that has a P/E (a loss-making company shows a dash)
    for (let i = 0; i < 8; i++) {
      await page.getByRole('button', { name: 'View stock details' }).first().click();
      await page.getByRole('button', { name: 'Got it' }).click({ timeout: 1500 }).catch(() => {});
      await page.getByRole('tab', { name: /Metrics/ }).click({ timeout: 4000 })
        .catch(() => page.getByRole('button', { name: /Metrics/ }).first().click());
      await page.waitForTimeout(800);
      const tile = await page.getByText('P/E Ratio').last().locator('xpath=ancestor::div[2]').innerText().catch(() => '');
      if (/\d/.test(tile)) { await shot(page, 'metrics'); break; }
      await page.getByRole('button', { name: 'Collapse stock details' }).first().click({ timeout: 4000 }).catch(() => page.keyboard.press('Escape'));
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: 'Like this company' }).click();
      await page.waitForTimeout(800);
    }
    await page.getByRole('button', { name: 'Collapse stock details' }).first().click({ timeout: 4000 }).catch(() => page.keyboard.press('Escape'));
    await page.waitForTimeout(800);
    await page.getByRole('button', { name: 'Likes' }).click();
    await page.getByRole('heading', { name: 'Your Likes' }).waitFor();
    await page.waitForTimeout(1500); // logos
    await shot(page, 'likes');
    await page.context().close();
  }

  // The recap reel (the dev-only lab route with sample likes, as e2e/redteam.spec.ts uses).
  // Chromium here, since headless WebKit flattens the CSS 3D orbit (docs/phase-4.md)
  {
    const chrome = await chromium.launch();
    const context = await chrome.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: scheme });
    const page = await context.newPage();
    await page.goto(`${BASE}/lab/orbit?v=recap`);
    const reel = page.getByRole('dialog', { name: 'Your day in values' });
    await reel.getByText('Your day in values').waitFor();
    await shot(page, 'recap-intro');
    for (let i = 0; i < 6; i++) await reel.getByRole('button', { name: 'Next' }).click();
    await reel.getByText('What your likes say about you').waitFor();
    await page.waitForTimeout(3000);
    await shot(page, 'recap-insight');
    await chrome.close();
  }

  // Ask AI, signed in: a real answer, or the empty chat if Gemini stays busy
  {
    const page = await newPage(scheme);
    await page.addInitScript(() => {
      for (const k of ['coach_first_card', 'coach_first_details']) localStorage.setItem(k, 'seen');
      localStorage.setItem('ai_widget_opened', 'true');
      localStorage.setItem('ai_data_consent', 'true');
    });
    await page.goto(`${BASE}/auth?mode=signin`);
    await page.locator('#signin-email').fill(env.TEST_USER_EMAIL);
    await page.getByPlaceholder('Your password').fill(env.TEST_USER_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.locator('[data-swipe-card="top"]').or(page.getByText(/That's today's matches|come back tomorrow/i)).first().waitFor({ timeout: 30_000 });
    const panel = page.locator('div[data-ai-assistant].fixed');
    const question = 'What does a P/E ratio actually mean?';
    let answered = false;
    const attempts = Number(process.env.ASK_AI_ATTEMPTS ?? 3);
    for (let attempt = 1; attempt <= attempts && !answered; attempt++) {
      if (attempt > 1) {
        console.log(`  Ask AI busy, retrying (${attempt}/${attempts})`);
        await page.waitForTimeout(20_000);
        await page.reload();
        await page.waitForTimeout(3000);
      }
      await page.getByRole('button', { name: /Ask AI/ }).first().click();
      await page.getByPlaceholder('Ask about a company or term…').fill(question);
      await page.getByRole('button', { name: 'Send message' }).click();
      // The panel's footer already says "not investment advice", so wait for the reply bubble itself
      answered = await page.waitForFunction(() => {
        const p = document.querySelector('div[data-ai-assistant].fixed');
        const text = p?.innerText ?? '';
        return !/Connecting|Thinking/.test(text) && (text.match(/not investment advice/gi) ?? []).length >= 2;
      }, null, { timeout: 60_000 }).then(() => true, () => false);
    }
    await page.waitForTimeout(5000); // the welcome toast clears
    if (answered) await panel.getByText(question).last().evaluate(el => el.scrollIntoView({ block: 'start' }));
    else console.log('  Ask AI did not answer; capturing what is on screen');
    await shot(page, answered ? 'ask-ai' : 'ask-ai-empty');
    await page.context().close();
  }
}
await browser.close();
