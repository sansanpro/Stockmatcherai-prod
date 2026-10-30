#!/usr/bin/env node
// Checks the Today's thought library and picker (src/lib/quotes.ts).
// Run: node scripts/test-quotes.mjs   (exits non-zero on any failure)
import { QUOTES, pickQuote, quoteTieIn } from '../src/lib/quotes.ts';

let failures = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : `  ${detail}`}`);
  if (!ok) failures++;
};

const CAUSES = ['beat_cancer', 'live_healthier', 'clean_energy', 'keeping_safe', 'mental_health', 'clean_food', 'clean_water'];
const THEMES = new Set([...CAUSES, 'risk_low', 'risk_high', 'patience', 'learning', 'beginner', 'purpose', 'income']);

// The library
const ids = QUOTES.map(q => q.id);
const texts = QUOTES.map(q => q.text.toLowerCase());
check(`${QUOTES.length} quotes, at least 50`, QUOTES.length >= 50);
check('every id is unique', new Set(ids).size === ids.length, ids.filter((id, i) => ids.indexOf(id) !== i).join(', '));
check('every quote is unique', new Set(texts).size === texts.length);
check('every quote has an author, a source and a lesson', QUOTES.every(q => q.author && q.source && q.lesson && q.text));
check('every theme is known', QUOTES.every(q => q.themes.length && q.themes.every(t => THEMES.has(t))), QUOTES.filter(q => !q.themes.every(t => THEMES.has(t))).map(q => q.id).join(', '));
for (const c of CAUSES) {
  const n = QUOTES.filter(q => q.themes.includes(c)).length;
  check(`cause ${c} has at least 5 quotes`, n >= 5, `has ${n}`);
}
for (const t of ['risk_low', 'risk_high', 'patience', 'learning', 'beginner', 'purpose', 'income']) {
  const n = QUOTES.filter(q => q.themes.includes(t)).length;
  check(`profile theme ${t} has at least 5 quotes`, n >= 5, `has ${n}`);
}
// Educational, never advice or promises
const ADVICE = /\b(you should (buy|sell)|buy now|sell now|guarantee|can't lose|beat the market|get rich|will (rise|go up|double))\b/i;
check('no lesson recommends a trade or promises results', QUOTES.every(q => !ADVICE.test(q.lesson)), QUOTES.filter(q => ADVICE.test(q.lesson)).map(q => q.id).join(', '));
check('lessons are short (under 260 characters)', QUOTES.every(q => q.lesson.length < 260), QUOTES.filter(q => q.lesson.length >= 260).map(q => `${q.id} ${q.lesson.length}`).join(', '));
// Famous misattributions stay out
const MISATTRIBUTED = [/let food be thy medicine/i, /compound interest/i, /be fearful when others are greedy/i, /between stimulus and response/i];
check('no well-known misattributed quotes', QUOTES.every(q => !MISATTRIBUTED.some(r => r.test(q.text))));

// The picker
const base = { likedCauses: [], causes: ['clean_water', 'beat_cancer'], risk: 'medium', goal: 'growth', experience: 'few', date: '2026-10-30' };
{
  const q = pickQuote({ ...base, likedCauses: ['clean_water', 'clean_water', 'beat_cancer'] }, []);
  check("today's most-liked cause leads the choice", q.themes.includes('clean_water'), q.id);
}
{
  const q = pickQuote({ ...base, causes: ['beat_cancer'], likedCauses: [] }, []);
  check('with no likes, the top profile cause leads', q.themes.includes('beat_cancer'), q.id);
}
{
  const a = pickQuote(base, []), b = pickQuote(base, []);
  check('the same day gives the same quote', a.id === b.id);
}
{
  // A year of daily use: no repeats until every quote has been shown
  const seen = [];
  for (let d = 0; d < QUOTES.length; d++) {
    const date = new Date(Date.UTC(2026, 0, 1 + d)).toISOString().slice(0, 10);
    const likes = [CAUSES[d % 7], CAUSES[(d * 3) % 7]];
    seen.push(pickQuote({ ...base, likedCauses: likes, date }, seen).id);
  }
  check(`no repeats across ${QUOTES.length} days`, new Set(seen).size === QUOTES.length, `${new Set(seen).size} distinct`);
  const next = pickQuote({ ...base, date: '2027-06-01' }, seen);
  check('after all are seen, an older one comes back (not one from the last few weeks)', !seen.slice(-Math.floor(QUOTES.length / 2)).includes(next.id), next.id);
}
{
  const water = QUOTES.find(q => q.id === 'auden-water');
  const label = id => ({ clean_water: 'Clean water' })[id];
  check('tie-in names the cause when all likes share it', quoteTieIn(water, ['clean_water', 'clean_water'], label) === 'You liked 2 companies today, all working on Clean water.');
  check('tie-in counts the matching likes', quoteTieIn(water, ['clean_water', 'beat_cancer', 'beat_cancer'], label) === 'You liked 3 companies today, 1 of them working on Clean water.');
  check('tie-in for a day with no likes', quoteTieIn(water, [], label).startsWith('You passed on every company today.'));
}

console.log(failures ? `\n${failures} check(s) failed` : '\nAll quote checks passed');
process.exit(failures ? 1 : 0);
