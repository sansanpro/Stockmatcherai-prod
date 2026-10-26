// Makes App Store screenshots (6.9", 1320x2868) and the landing page showcase images from the
// real app: walks a new user's onboarding in WebKit at iPhone 17 Pro Max size, captures each
// screen, then frames it under a caption.
//
//   npm run dev            (in another terminal, or let this script find it on :8080)
//   node scripts/make-screenshots.mjs      (ASK_AI_ATTEMPTS=1 to give up on a busy Gemini sooner)
//
// Output: marketing/app-store/*.jpg (upload these) and src/assets/showcase-*.jpg (landing page).
// Signed-out screens use a throwaway install marked e2e- so analytics ignore it; the Ask AI
// screen signs in as the test account from .env.test.local.
import { webkit } from '@playwright/test';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const BASE = 'http://localhost:8080';
const W = 440, SCREEN_H = 956, STATUS_H = 62; // iPhone 17 Pro Max points; status bar drawn later
const RAW = 'marketing/raw';
mkdirSync(RAW, { recursive: true });
mkdirSync('marketing/app-store', { recursive: true });

const env = Object.fromEntries(readFileSync('.env.test.local', 'utf8').split('\n')
  .map(l => l.match(/^([A-Z0-9_]+)=(.*)$/)).filter(Boolean).map(m => [m[1], m[2]]));

const browser = await webkit.launch();
const newPage = async () => {
  const context = await browser.newContext({
    viewport: { width: W, height: SCREEN_H - STATUS_H }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
  });
  await context.addInitScript(() => {
    if (!localStorage.getItem('analytics_install_id')) {
      localStorage.setItem('analytics_install_id', `e2e-shots-${Math.random().toString(36).slice(2, 10)}`);
    }
    localStorage.setItem('att_status', 'authorized');
  });
  return context.newPage();
};
// Company logos fade in once loaded (initials show until then), so wait for every one on screen
const logosLoaded = (page) => page.waitForFunction(() =>
  [...document.querySelectorAll('img')].filter(img => img.getBoundingClientRect().top < innerHeight)
    .every(img => img.complete && img.naturalWidth > 0), null, { timeout: 15_000 }).catch(() => console.log('  (some images still loading)'));
const shot = async (page, name) => {
  await logosLoaded(page);
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${RAW}/${name}.png` });
  console.log('captured', name);
};

// 1-5: a new user, no account
{
  const page = await newPage();
  await page.goto(`${BASE}/app`);
  await page.getByRole('button', { name: 'Find my matches' }).waitFor();
  await shot(page, '1-hook');
  await page.getByRole('button', { name: 'Find my matches' }).click();
  await page.getByRole('button', { name: /^Beat cancer & disease/ }).click();
  await page.getByRole('button', { name: /^Clean energy & climate/ }).click();
  await page.getByText(/\d+ companies match/).first().waitFor();
  await shot(page, '2-causes');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('checkbox', { name: 'Fossil fuels' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByText('Imagine a company you own drops 20% in a month.').waitFor();
  await page.waitForTimeout(900); // the art spins in
  await shot(page, '3-question');
  await page.getByRole('radio', { name: 'Wait it out.' }).click();
  await page.getByRole('radio', { name: 'Never' }).click();
  await page.getByRole('radio', { name: 'Growing it for the long haul (5+ years)' }).click();
  await page.getByText('I invest in what I believe in:').waitFor();
  await page.waitForTimeout(3500); // build animation and count
  await shot(page, '4-reveal');
  await page.getByRole('button', { name: /^See my first \d+ matches$/ }).click();
  await page.getByRole('button', { name: 'Got it' }).click();
  await page.getByText('P/E Ratio').first().waitFor();
  await shot(page, '5-card');
  // Like three companies (closing the save prompts a new user sees), then open Likes
  const like = () => page.getByRole('button', { name: 'Like this company' }).click();
  await like();
  await page.getByRole('button', { name: 'Not now' }).click();
  await like();
  await page.waitForTimeout(800);
  await like();
  await page.getByRole('button', { name: 'Keep swiping without saving' }).click();
  await page.getByRole('button', { name: 'Likes' }).click();
  await page.getByRole('heading', { name: 'Your Likes' }).waitFor();
  await page.waitForTimeout(1500); // logos
  await shot(page, '6-likes');
  await page.context().close();
}

// 6: Ask AI, signed in (a real answer; falls back to the empty chat if Gemini is busy)
{
  const page = await newPage();
  await page.addInitScript(() => {
    for (const k of ['coach_first_card', 'coach_first_details']) localStorage.setItem(k, 'seen');
    localStorage.setItem('ai_widget_opened', 'true');
    localStorage.setItem('ai_data_consent', 'true');
  });
  await page.goto(`${BASE}/auth?mode=signin`);
  await page.locator('#signin-email').fill(env.TEST_USER_EMAIL);
  await page.getByPlaceholder('Your password').fill(env.TEST_USER_PASSWORD);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.getByRole('button', { name: 'View stock details' }).first().waitFor({ timeout: 30_000 });
  // Gemini's free tier is often busy, so try a few times, a little apart
  const panel = page.locator('div[data-ai-assistant].fixed');
  let answered = false;
  const attempts = Number(process.env.ASK_AI_ATTEMPTS ?? 4);
  for (let attempt = 1; attempt <= attempts && !answered; attempt++) {
    if (attempt > 1) {
      console.log(`Ask AI busy, retrying (${attempt}/${attempts})`);
      await page.waitForTimeout(20_000);
      await page.reload();
      await page.getByRole('button', { name: 'View stock details' }).first().waitFor({ timeout: 30_000 });
    }
    await page.getByRole('button', { name: 'Open Ask AI' }).click();
    await page.getByPlaceholder('Ask about a company or term…').fill('How does First Solar connect to my causes?');
    await page.getByRole('button', { name: 'Send message' }).click();
    answered = await panel.getByText(/not investment advice/i).last()
      .waitFor({ timeout: 60_000 }).then(() => true, () => false);
  }
  if (answered) {
    // Start of the answer in view
    await panel.getByText('How does First Solar connect to my causes?').last().evaluate(el => el.scrollIntoView({ block: 'start' }));
    await shot(page, '7-ask-ai');
  } else {
    console.log('Ask AI did not answer (Gemini busy); capturing the empty chat instead');
    await page.reload();
    await page.getByRole('button', { name: 'Open Ask AI' }).click();
    await shot(page, '7-ask-ai');
  }
  await page.context().close();
}

// Frame each capture: caption on top, phone with a status bar below
const FRAMES = [
  ['1-hook', 'Invest in what', 'you believe in', 'invest-in-what-you-believe'],
  ['2-causes', 'Pick the causes', 'you care about', 'pick-your-causes'],
  ['3-question', 'Simple questions,', 'one at a time', 'one-question-at-a-time'],
  ['4-reveal', "See who's working", 'on them', 'see-who-is-working'],
  ['5-card', 'The story first,', 'then the numbers', 'story-first-card'],
  ['6-likes', "Keep the ones you'd", 'be proud to own', 'keep-your-likes'],
  ['7-ask-ai', 'Ask anything,', 'in plain English', 'ask-ai'],
];
const statusBar = `
  <div class="status"><span>9:41</span><span class="icons">
    <svg width="54" height="34" viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>
    <svg width="50" height="36" viewBox="0 0 16 12"><path d="M8 11.5 5.6 9a3.4 3.4 0 0 1 4.8 0zM3.4 6.8a6.5 6.5 0 0 1 9.2 0l-1.1 1.1a5 5 0 0 0-7 0zM1.1 4.6a9.7 9.7 0 0 1 13.8 0l-1.1 1.1a8.1 8.1 0 0 0-11.6 0z"/></svg>
    <svg width="80" height="38" viewBox="0 0 27 13"><rect x=".5" y=".5" width="23" height="12" rx="3.5" fill="none" stroke="currentColor" stroke-opacity=".4"/><rect x="2" y="2" width="20" height="9" rx="2"/><path d="M25 4.5v4c.8-.3 1.5-1.1 1.5-2s-.7-1.7-1.5-2z" fill-opacity=".4"/></svg>
  </span></div>`;
const frameHtml = (img, a, b, topColor, glyphs) => `<!doctype html><html><head><style>
  * { margin: 0; box-sizing: border-box; }
  body { width: 1320px; height: 2868px; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    background: radial-gradient(1100px 800px at 50% 0%, #FBE7DC 0%, rgba(251,231,220,0) 70%), radial-gradient(1000px 900px at 50% 75%, #F6D3C1 0%, rgba(246,211,193,0) 65%), #FAF6EF; }
  h1 { position: absolute; top: 150px; width: 100%; text-align: center; color: #1F1A15; font-size: 116px; line-height: 1.08;
    font-weight: 700; letter-spacing: -2px; }
  h1 span { display: block; color: #B54A22; }
  .phone { position: absolute; left: 50%; top: 610px; transform: translateX(-50%); width: 1034px; height: 2200px;
    background: #1F1A15; border-radius: 150px; padding: 20px; box-shadow: 0 0 0 4px #3a322b, 0 40px 120px rgba(120,72,40,.28); }
  .screen { position: relative; width: 994px; height: 2160px; border-radius: 132px; overflow: hidden; background: ${topColor}; }
  .screen img { position: absolute; left: 0; top: ${Math.round(2160 * STATUS_H / SCREEN_H)}px; width: 994px; }
  .status { position: absolute; top: 0; left: 0; right: 0; height: ${Math.round(2160 * STATUS_H / SCREEN_H)}px; z-index: 2;
    display: flex; align-items: center; justify-content: space-between; padding: 22px 92px 0 112px; color: #fff; font-size: 50px; font-weight: 600; }
  .status { color: ${glyphs}; } .status .icons { display: flex; gap: 14px; align-items: center; } .status svg { fill: ${glyphs}; }
  .island { position: absolute; top: 34px; left: 50%; transform: translateX(-50%); width: 280px; height: 82px; background: #000; border-radius: 41px; z-index: 3; }
</style></head><body>
  <h1>${a}<span>${b}</span></h1>
  <div class="phone"><div class="screen">${statusBar}<div class="island"></div><img src="${img}"></div></div>
</body></html>`;

const framer = await browser.newContext({ viewport: { width: 1320, height: 2868 }, deviceScaleFactor: 1 });
const landing = await browser.newContext({ viewport: { width: 1320, height: 2868 }, deviceScaleFactor: 885 / 1320 });
for (const [raw, a, b, slug] of FRAMES) {
  const file = path.resolve(`${RAW}/${raw}.png`);
  const dataUrl = `data:image/png;base64,${readFileSync(file).toString('base64')}`;
  // Fill the status bar area with the capture's own top color so the screen looks seamless
  const probe = await framer.newPage();
  await probe.setContent(`<img src="${dataUrl}">`);
  const topColor = await probe.evaluate(() => {
    const img = document.querySelector('img');
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = 4;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const [r, g, b] = ctx.getImageData(Math.floor(img.naturalWidth / 2), 1, 1, 1).data;
    return [r, g, b];
  });
  await probe.close();
  // Dark status bar glyphs on light screens, as iOS draws them
  const glyphs = (0.299 * topColor[0] + 0.587 * topColor[1] + 0.114 * topColor[2]) > 150 ? '#1F1A15' : '#FFFFFF';
  const html = frameHtml(dataUrl, a, b, `rgb(${topColor.join(',')})`, glyphs);
  // JPEG: App Store Connect rejects screenshots with an alpha channel, and it keeps the site light
  for (const [ctx, out, quality] of [[framer, `marketing/app-store/${raw}-${slug}.jpg`, 92], [landing, `src/assets/showcase-${slug}.jpg`, 82]]) {
    const page = await ctx.newPage();
    await page.setContent(html);
    await page.waitForTimeout(200);
    await page.screenshot({ path: out, type: 'jpeg', quality });
    await page.close();
  }
  console.log('framed', slug);
}
writeFileSync('marketing/README.md', `# Screenshots

Made by \`node scripts/make-screenshots.mjs\` from the real app (WebKit at iPhone 17 Pro Max size).

- \`app-store/\`: 1320×2868, the 6.9" size App Store Connect asks for (also used for smaller iPhones).
- \`raw/\` (not committed): the plain captures, before framing.

The landing page copies live in \`src/assets/showcase-*.jpg\`.
`);
await browser.close();
