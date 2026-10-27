#!/usr/bin/env node
// Checks that every claim in one or more universe JSON files is backed by the pages it cites:
// each source must load, and the claim's numbers and names must appear on at least one of them.
// It's a first pass: anything it flags gets read by a person (or Claude) before it ships.
//
//   node scripts/check-universe-sources.mjs file1.json [file2.json ...] [--out report.json]
//
// Files hold { "companies": [ ... ] } in the launch-universe format.
import { readFileSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const outAt = args.indexOf('--out');
const out = outAt >= 0 ? args.splice(outAt, 2)[1] : null;
const companies = args.flatMap(f => JSON.parse(readFileSync(f, 'utf8')).companies ?? []);

// The claims a user can read, each with the pages cited for it
const claims = [];
for (const c of companies) {
  const s = c.sources ?? {};
  const add = (field, text, urls) => text && claims.push({ ticker: c.ticker, field, text, urls: (urls ?? []).filter(Boolean) });
  add('story', c.mission_story, s.story);
  add('proof', c.proof, s.proof);
  (c.things_to_know ?? []).forEach((t, i) => add(`things_to_know[${i}]`, t, s.things_to_know?.[i]));
  (c.missions ?? []).forEach(m => add(`mission:${m.cause}`, m.evidence, [m.source_url]));
  (c.flags ?? []).forEach(f => add(`flag:${f.dealbreaker}`, f.evidence, [f.source_url]));
  if (c.profile?.description) add('profile', c.profile.description, s.profile);
  if (c.caution) {
    add('caution:headline', c.caution.headline, [c.caution.data_url]);
    add('caution:reason', c.caution.reason, [c.caution.source_url]);
  }
}

// --- fetch every page once ---
const BROWSER_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
// SEC asks automated tools to identify themselves
const SEC_UA = 'StockMatcher research support@stockmatcherai.com';
const pages = new Map();
const strip = (html) => html
  .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&#8217;|&rsquo;/g, "'").replace(/&#36;/g, '$')
  .replace(/\s+/g, ' ');
async function load(url) {
  const ua = /(^|\.)sec\.gov\//.test(new URL(url).hostname + '/') ? SEC_UA : BROWSER_UA;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': ua, Accept: 'text/html,application/xhtml+xml,*/*' }, redirect: 'follow', signal: controller.signal });
    const body = res.ok ? await res.text() : '';
    return { status: res.status, text: strip(body).toLowerCase() };
  } catch (e) {
    return { status: 0, text: '', error: String(e?.name || e) };
  } finally {
    clearTimeout(timer);
  }
}
const urls = [...new Set(claims.flatMap(c => c.urls))];
let next = 0;
await Promise.all(Array.from({ length: 8 }, async () => {
  while (next < urls.length) {
    const url = urls[next++];
    pages.set(url, await load(url));
    // be gentle with SEC (10 requests a second at most)
    if (url.includes('sec.gov')) await new Promise(r => setTimeout(r, 250));
  }
}));

// Pages that block plain requests (bot checks) or build their text with scripts: open them in a
// real browser instead
const retry = urls.filter(u => { const p = pages.get(u); return !(p.status >= 200 && p.status < 300) || p.text.length < 2000; });
if (retry.length) {
  const { webkit } = await import('@playwright/test');
  const browser = await webkit.launch();
  const context = await browser.newContext({ userAgent: BROWSER_UA, locale: 'en-US' });
  let at = 0;
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (at < retry.length) {
      const url = retry[at++];
      const page = await context.newPage();
      try {
        const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await page.waitForTimeout(1500);
        const text = (await page.evaluate(() => document.body?.innerText ?? '')).replace(/\s+/g, ' ').toLowerCase();
        const status = res?.status() ?? 0;
        if (text.length > (pages.get(url).text.length)) pages.set(url, { status: status >= 400 && text.length > 2000 ? 200 : status, text, via: 'browser' });
      } catch { /* keep the first result */ }
      await page.close();
    }
  }));
  await browser.close();
}

// --- compare claims with pages ---
const STOP = new Set('the this that these those its it his her their about every each from with into over under after before when where which while also only more most much many some such than then there very just like into across among within without'.split(' '));
const numbersIn = (text) => [...text.replace(/(\d),(\d{3})/g, '$1$2').matchAll(/\d+(?:\.\d+)?/g)].map(m => Number(m[0]));
function check(claim) {
  const loaded = claim.urls.map(u => ({ url: u, ...pages.get(u) }));
  const ok = loaded.filter(p => p.status >= 200 && p.status < 300 && p.text.length > 200);
  if (!ok.length) return { verdict: 'unreachable', statuses: loaded.map(p => `${p.status || p.error} ${p.url}`) };
  const text = ok.map(p => p.text).join(' ').replace(/[-\u2010-\u2014]/g, ' ');
  const pageNumbers = numbersIn(text);
  const missing = [];
  // numbers: years must appear as written; other numbers within 6% (rounding like "about $1.2 billion")
  for (const n of numbersIn(claim.text)) {
    if (n >= 1900 && n <= 2100 && Number.isInteger(n)) {
      if (!text.includes(String(n))) missing.push(String(n));
    } else if (n !== 0 && !pageNumbers.some(p => Math.abs(p - n) <= Math.abs(n) * 0.06)) {
      missing.push(String(n));
    }
  }
  // names: capitalized words (not at the very start) and acronyms
  const words = claim.text.replace(/[^\p{L}\p{N}\s'-]/gu, ' ').split(/\s+/).slice(1);
  for (const w of words) {
    const clean = w.replace(/'s$/, '');
    if (clean.length < 3 || STOP.has(clean.toLowerCase())) continue;
    if (/^[A-Z]/.test(clean) && !text.includes(clean.toLowerCase().replace(/[-\u2010-\u2014]/g, ' '))) missing.push(clean);
  }
  return { verdict: missing.length ? 'check' : 'ok', missing: [...new Set(missing)] };
}
const results = claims.map(c => ({ ...c, ...check(c) }));
const by = (v) => results.filter(r => r.verdict === v);
console.log(`${companies.length} companies, ${claims.length} claims, ${urls.length} pages`);
console.log(`ok ${by('ok').length} · check ${by('check').length} · unreachable ${by('unreachable').length}`);
for (const r of [...by('unreachable'), ...by('check')]) {
  console.log(`- ${r.ticker} ${r.field} [${r.verdict}] ${r.missing?.length ? `missing: ${r.missing.join(', ')}` : r.statuses?.join(' | ')}`);
}
if (out) writeFileSync(out, JSON.stringify(results, null, 1));
