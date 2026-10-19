#!/usr/bin/env node
// Fills Finnhub's static fields (industry, website, IPO date, logo) into company_profiles for
// any ticker not synced yet, by requesting each profile through the company-data function,
// which stores what it fetches. Paced under Finnhub's 60 calls/min free limit.
// Usage: node scripts/sync-company-profiles.mjs TICKER [TICKER...]
//   (pass the tickers to sync; e.g. from: select ticker from company_profiles where finnhub_synced_at is null)
import { readFileSync } from 'node:fs';

const env = {};
for (const line of readFileSync('.env', 'utf8').split('\n')) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (match) env[match[1]] = match[2].replace(/^"|"$/g, '');
}

const tickers = process.argv.slice(2);
if (tickers.length === 0) {
  console.error('Pass the tickers to sync.');
  process.exit(1);
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
let failed = [];
for (const [i, ticker] of tickers.entries()) {
  const response = await fetch(`${env.VITE_SUPABASE_URL}/functions/v1/company-data`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'company_profile', symbol: ticker }),
  });
  const body = await response.json().catch(() => ({}));
  const ok = response.ok && body.data?.image && !body.data.image.includes('financialmodelingprep');
  if (!ok) failed.push(ticker);
  console.log(`${i + 1}/${tickers.length} ${ticker} ${response.status}${ok ? '' : ' (not synced)'}`);
  await sleep(1300);
}
console.log(failed.length ? `Not synced: ${failed.join(' ')}` : 'All synced');
