// App Store screenshots for iPad (13", 2048x2732), plain captures of the real app walking a new
// user's onboarding. Run with `npm run dev` on :8080: node scripts/make-ipad-screenshots.mjs
// Output: marketing/app-store/ipad/*.jpg (JPEG: App Store Connect rejects an alpha channel)
import { webkit } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const OUT = 'marketing/app-store/ipad';
mkdirSync(OUT, { recursive: true });
const browser = await webkit.launch();
const context = await browser.newContext({
  viewport: { width: 1024, height: 1366 }, deviceScaleFactor: 2, hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
});
await context.addInitScript(() => {
  if (!localStorage.getItem('analytics_install_id')) localStorage.setItem('analytics_install_id', `e2e-shots-${Math.random().toString(36).slice(2, 10)}`);
  localStorage.setItem('att_status', 'authorized');
});
const page = await context.newPage();
const shot = async (name) => {
  await page.waitForFunction(() => [...document.querySelectorAll('img')].filter(i => i.getBoundingClientRect().top < innerHeight).every(i => i.complete && i.naturalWidth > 0), null, { timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/${name}.jpg`, type: 'jpeg', quality: 92 });
  console.log('captured', name);
};
await page.goto('http://localhost:8080/app');
await page.getByRole('button', { name: 'Find my matches' }).waitFor();
await shot('1-hook');
await page.getByRole('button', { name: 'Find my matches' }).click();
await page.getByRole('button', { name: /^Beat cancer & disease/ }).click();
await page.getByRole('button', { name: /^Clean energy & climate/ }).click();
await page.getByText(/\d+ companies match/).first().waitFor();
await shot('2-causes');
await page.getByRole('button', { name: 'Continue' }).click();
await page.getByRole('button', { name: /^(Skip|Continue)/ }).click();
await page.getByRole('radio', { name: 'Wait it out.' }).click();
await page.getByRole('radio', { name: 'A few times' }).click();
await page.getByRole('radio', { name: 'Growing it for the long haul (5+ years)' }).click();
await page.getByText('I invest in what I believe in:').waitFor();
await page.waitForTimeout(3500);
await shot('3-reveal');
await page.getByRole('button', { name: /^See my first/ }).click();
await page.getByRole('button', { name: 'Got it' }).click();
await page.getByText('P/E Ratio').first().waitFor();
await shot('4-card');
await page.getByRole('button', { name: 'Like this company' }).click();
await page.getByRole('button', { name: 'Not now' }).click();
await page.waitForTimeout(700);
await page.getByRole('button', { name: 'Like this company' }).click();
await page.waitForTimeout(700);
await page.getByRole('button', { name: 'Like this company' }).click();
await page.getByRole('button', { name: 'Keep swiping without saving' }).click();
await page.getByRole('button', { name: 'Likes' }).click();
await page.getByRole('heading', { name: 'Your Likes' }).waitFor();
await page.waitForTimeout(1500);
await shot('5-likes');
await browser.close();
