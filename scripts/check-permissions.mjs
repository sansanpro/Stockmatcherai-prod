#!/usr/bin/env node
// Checks what the public API allows, as a signed-out visitor and as the test account:
// public reads work, analytics are insert-only, decks/swipes can't be written by users,
// the old swipe counter can't be reset, and old app builds can still read the sector tables.
// Usage: node scripts/check-permissions.mjs   (exits non-zero on failure; needs .env and .env.test.local)
import { readFileSync } from 'node:fs';

function loadEnv(path) {
  const env = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) env[match[1]] = match[2].replace(/^"|"$/g, '');
  }
  return env;
}
const env = { ...loadEnv('.env'), ...loadEnv('.env.test.local') };
const base = env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;

let failures = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : `  ${detail}`}`);
  if (!ok) failures++;
};

const rest = async (path, { token = anonKey, method = 'GET', body, prefer } = {}) => {
  const res = await fetch(`${base}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json().catch(() => null) };
};

// Signed out
{
  const stocks = await rest('stocks?select=ticker,price_per_share&in_feed=eq.true&limit=5');
  check('signed out: launch companies are readable', stocks.status === 200 && stocks.body.length === 5);
  const causes = await rest('cause_company_counts?select=cause,companies&is_live=eq.true');
  check('signed out: live causes and their counts are readable', causes.status === 200 && causes.body.length === 7 && causes.body.every(c => c.companies > 0), JSON.stringify(causes.body));
  const pending = await rest("stock_missions?select=ticker&status=neq.approved&limit=1");
  check('signed out: unapproved mission tags are hidden', pending.status === 200 && pending.body.length === 0);
  const legacy = await rest('healthcare_stocks?select=ticker,price_per_share&limit=3');
  check('old app builds: sector tables still return prices', legacy.status === 200 && legacy.body.length === 3 && legacy.body.every(r => r.price_per_share > 0));
  const event = await rest('analytics_events', {
    method: 'POST', prefer: 'return=minimal',
    body: { event: 'app_open', anonymous_id: `e2e-perm-${Date.now()}`, platform: 'web', app_version: 'check', props: {} },
  });
  check('signed out: analytics events can be added', event.status === 201, `${event.status} ${JSON.stringify(event.body)}`);
  const readEvents = await rest('analytics_events?select=id&limit=1');
  check('signed out: analytics events cannot be read', readEvents.status !== 200 || readEvents.body.length === 0, `${readEvents.status}`);
}

// Signed in as the test account
const auth = await fetch(`${base}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: { apikey: anonKey, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: env.TEST_USER_EMAIL, password: env.TEST_USER_PASSWORD }),
}).then(r => r.json());
const token = auth.access_token;
const userId = auth.user?.id;
{
  const today = new Date().toISOString().slice(0, 10);
  const swipe = await rest('swipes', { token, method: 'POST', body: { user_id: userId, ticker: 'MRK', liked: true, deck_date: today } });
  check('signed in: swipes can only be written by match-feed', swipe.status === 401 || swipe.status === 403, `${swipe.status}`);
  const deck = await rest('daily_decks', { token, method: 'POST', body: { user_id: userId, deck_date: '2099-01-01', cards: [] } });
  check('signed in: decks can only be written by match-feed', deck.status === 401 || deck.status === 403, `${deck.status}`);
  const otherProfile = await rest(`user_profiles?select=user_id&user_id=neq.${userId}&limit=1`, { token });
  check("signed in: other users' profiles are hidden", otherProfile.status === 200 && otherProfile.body.length === 0);

  // The old client-side counter (used by older builds) can't be reset or jumped
  const before = await rest(`daily_swipe_limits?select=swipes_used&user_id=eq.${userId}&date=eq.${today}`, { token });
  const start = before.body?.[0]?.swipes_used;
  await rest('daily_swipe_limits?on_conflict=user_id,date', {
    token, method: 'POST', prefer: 'resolution=merge-duplicates,return=minimal',
    body: { user_id: userId, date: today, swipes_used: 0 },
  });
  const reset = await rest(`daily_swipe_limits?select=swipes_used&user_id=eq.${userId}&date=eq.${today}`, { token });
  const afterReset = reset.body?.[0]?.swipes_used;
  check('signed in: the old swipe counter cannot be lowered', start === undefined ? afterReset <= 1 : afterReset >= start, `${start} -> ${afterReset}`);
  await rest(`daily_swipe_limits?user_id=eq.${userId}&date=eq.${today}`, { token, method: 'PATCH', body: { swipes_used: 500 } });
  const jumped = await rest(`daily_swipe_limits?select=swipes_used&user_id=eq.${userId}&date=eq.${today}`, { token });
  check('signed in: the old swipe counter only goes up by one at a time', jumped.body?.[0]?.swipes_used <= (afterReset ?? 0) + 1, `${afterReset} -> ${jumped.body?.[0]?.swipes_used}`);
}

console.log(failures ? `\n${failures} check(s) failed` : '\nAll permission checks passed');
process.exit(failures ? 1 : 0);
