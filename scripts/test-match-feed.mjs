#!/usr/bin/env node
// End-to-end checks of the deployed match-feed function, signed out and as the test account.
// Usage: node scripts/test-match-feed.mjs   (exits non-zero on failure)
// Needs .env and .env.test.local. The test account's profile must have causes set.
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

const call = async (body, token = anonKey) => {
  const res = await fetch(`${base}/functions/v1/match-feed`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
};

// Signed out
{
  const prefs = { causes: ['beat_cancer', 'clean_energy'], dealbreakers: ['fossil_fuels'], risk: 'medium', goal: 'growth' };
  const { status, body } = await call({ action: 'deck', prefs });
  check('signed out: deck builds from onboarding answers', status === 200 && Array.isArray(body.cards), `${status} ${JSON.stringify(body).slice(0, 200)}`);
  const cards = body.cards ?? [];
  check('signed out: every card matches a chosen cause', cards.length > 0 && cards.every(c => c.matchedCauses?.some(m => prefs.causes.includes(m.cause))));
  check('signed out: dealbreaker-flagged companies are excluded', cards.every(c => c.ticker !== 'NEE'), JSON.stringify(cards.map(c => c.ticker)));
  check('signed out: cards include display data', cards.every(c => c.companyName && c.pricePerShare > 0 && c.matchedCauses[0].label));
  const { status: s2 } = await call({ action: 'deck', prefs: { causes: [] } });
  check('signed out: no causes -> 400', s2 === 400);
  const { status: s3 } = await call({ action: 'swipe', ticker: 'MRK', liked: true });
  check('signed out: swipes need an account', s3 === 401);
}

// Signed in as the test account
const auth = await fetch(`${base}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: { apikey: anonKey, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: env.TEST_USER_EMAIL, password: env.TEST_USER_PASSWORD }),
}).then(r => r.json());
const token = auth.access_token;
{
  const { status, body } = await call({ action: 'deck' }, token);
  if (status === 409) {
    check('signed in: profile has causes (set them on the test profile first)', false, JSON.stringify(body));
  } else {
    check('signed in: deck builds', status === 200 && body.cards?.length > 0, `${status} ${JSON.stringify(body).slice(0, 200)}`);
    const again = await call({ action: 'deck' }, token);
    check('signed in: same deck all day', JSON.stringify(again.body.cards?.map(c => c.ticker)) === JSON.stringify(body.cards?.map(c => c.ticker)));

    const target = body.cards.find(c => c.type === 'company' && !body.swiped.some(s => s.ticker === c.ticker));
    if (target) {
      const like = await call({ action: 'swipe', ticker: target.ticker, liked: true }, token);
      check(`signed in: like ${target.ticker} accepted`, like.status === 200 && like.body.ok, JSON.stringify(like.body));
      const dup = await call({ action: 'swipe', ticker: target.ticker, liked: true }, token);
      check('signed in: swiping the same card twice is refused', dup.status === 409, `${dup.status}`);
    }
    const outside = await call({ action: 'swipe', ticker: 'ZZZZ', liked: true }, token);
    check("signed in: a card outside today's deck can't be swiped", outside.status === 403, `${outside.status}`);
    const after = await call({ action: 'deck' }, token);
    check('signed in: deck reports swiped cards', after.body.swiped?.length >= 1);
  }
}

console.log(failures ? `\n${failures} check(s) failed` : '\nAll match-feed checks passed');
process.exit(failures ? 1 : 0);
