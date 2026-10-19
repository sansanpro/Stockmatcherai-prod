#!/usr/bin/env node
// Checks match-feed's deck composition rules across example profiles, using made-up companies.
// Run: node scripts/test-feed.mjs   (exits non-zero on any failure)
import { buildDeck, passesHardFilters, scoreCandidate } from '../supabase/functions/_shared/matching.ts';

const CAUSES = ['beat_cancer', 'live_healthier', 'clean_energy', 'keeping_safe'];
const SECTOR_BY_CAUSE = { beat_cancer: 'healthcare', live_healthier: 'healthcare', clean_energy: 'energy', keeping_safe: 'technology' };

// 12 companies per cause with varied size, beta, dividends; a few flags and a few dual-cause companies
const candidates = [];
CAUSES.forEach((cause, ci) => {
  for (let i = 0; i < 12; i++) {
    const ticker = `${cause.slice(0, 2).toUpperCase()}${i}`;
    const cap = [1.2e9, 3e9, 8e9, 15e9, 40e9, 150e9, 600e9, 2e12][i % 8];
    candidates.push({
      ticker,
      companyName: `${cause} co ${i}`,
      sector: i % 3 === 0 && ci < 2 ? 'technology' : SECTOR_BY_CAUSE[cause], // some sector variety
      missions: [
        { cause, exposure: i % 4 === 3 ? 'partial' : 'core', whyLine: `Works on ${cause}` },
        ...(i === 5 ? [{ cause: CAUSES[(ci + 1) % 4], exposure: 'partial' }] : []),
        ...(i === 11 ? [{ cause: CAUSES[(ci + 2) % 4], exposure: 'peripheral' }] : []),
      ],
      flags: i === 2 && cause === 'beat_cancer' ? ['animal_testing'] : i === 7 && cause === 'keeping_safe' ? ['weapons'] : [],
      marketCapUsd: cap,
      beta: [0.6, 0.9, 1.1, 1.4, 1.8][i % 5],
      dividendYield: [0, 0.5, 1.8, 3.2][i % 4],
      revenueGrowth: [-5, 4, 12, 30][i % 4],
      grossMargin: [20, 45, 70][i % 3],
      debtToEquity: [0.3, 1.2, 4][i % 3],
      binaryOutcome: cause === 'beat_cancer' && i === 1,
    });
  }
});
const byTicker = new Map(candidates.map(c => [c.ticker, c]));
const emptyHistory = () => ({ liked: new Set(), recentlySeen: new Set(), passedLongAgo: new Set() });
const OPTS = { size: 7, updateCards: 2 };

let failures = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : `  ${detail}`}`);
  if (!ok) failures++;
};

const companyCards = deck => deck.filter(c => c.type === 'company');
const adjacentClashes = deck => {
  const cards = companyCards(deck);
  let clashes = 0;
  for (let i = 1; i < cards.length; i++) {
    const a = byTicker.get(cards[i - 1].ticker), b = byTicker.get(cards[i].ticker);
    if (cards[i - 1].cause === cards[i].cause || a.sector === b.sector) clashes++;
  }
  return clashes;
};

// 1. Three causes, medium risk, growth
{
  const prefs = { causes: ['beat_cancer', 'clean_energy', 'keeping_safe'], dealbreakers: [], risk: 'medium', goal: 'growth' };
  const deck = buildDeck(candidates, prefs, emptyHistory(), [], OPTS);
  const cards = companyCards(deck);
  check('3 causes: 7 cards', deck.length === 7, `got ${deck.length}`);
  check('3 causes: every card matches one of the user causes', cards.every(c => prefs.causes.includes(c.cause)));
  const counts = Object.fromEntries(prefs.causes.map(c => [c, cards.filter(x => x.cause === c).length]));
  check('3 causes: cause #1 gets the most cards', counts.beat_cancer >= counts.clean_energy && counts.beat_cancer >= counts.keeping_safe, JSON.stringify(counts));
  check('3 causes: every cause appears', Object.values(counts).every(n => n > 0), JSON.stringify(counts));
  check('3 causes: no two in a row share a cause or sector', adjacentClashes(deck) === 0, `${adjacentClashes(deck)} clashes`);
  check('3 causes: at least one mid-cap ($2B-$20B)', cards.some(c => { const cap = byTicker.get(c.ticker).marketCapUsd; return cap >= 2e9 && cap <= 20e9; }));
  check('3 causes: no duplicate companies', new Set(cards.map(c => c.ticker)).size === cards.length);
}

// 2. Dealbreakers and low risk
{
  const prefs = { causes: ['beat_cancer', 'keeping_safe'], dealbreakers: ['animal_testing', 'weapons'], risk: 'low', goal: 'income' };
  const deck = buildDeck(candidates, prefs, emptyHistory(), [], OPTS);
  const cards = companyCards(deck);
  check('dealbreakers: no flagged company appears', cards.every(c => byTicker.get(c.ticker).flags.length === 0));
  check('low risk: no small caps (<$2B)', cards.every(c => byTicker.get(c.ticker).marketCapUsd >= 2e9));
  check('low risk: no binary-outcome biotech', cards.every(c => !byTicker.get(c.ticker).binaryOutcome));
  check('hard filter: flagged company is excluded', !passesHardFilters(byTicker.get('BE2'), prefs));
}

// 3. Peripheral tags never qualify a company for a cause
{
  const prefs = { causes: ['clean_energy'], dealbreakers: [], risk: 'high', goal: 'growth' };
  const peripheralOnly = candidates.filter(c => c.missions.some(m => m.cause === 'clean_energy' && m.exposure === 'peripheral') && !c.missions.some(m => m.cause === 'clean_energy' && m.exposure !== 'peripheral'));
  const deck = buildDeck(candidates, prefs, emptyHistory(), [], OPTS);
  check('peripheral: companies only peripherally tied to the cause never appear',
    peripheralOnly.length > 0 && companyCards(deck).every(c => !peripheralOnly.some(p => p.ticker === c.ticker)));
}

// 4. Update cards for liked companies with news
{
  const prefs = { causes: ['keeping_safe'], dealbreakers: [], risk: 'medium', goal: 'growth' };
  const history = emptyHistory();
  history.liked.add('KE0'); history.liked.add('KE1');
  const updates = [
    { ticker: 'KE0', companyName: 'x', headline: 'KE0 news', source: 'Src', url: 'https://example.com/1', publishedAt: '2026-10-19T10:00:00Z' },
    { ticker: 'KE1', companyName: 'y', headline: 'KE1 news', source: 'Src', url: 'https://example.com/2', publishedAt: '2026-10-19T09:00:00Z' },
    { ticker: 'NOTLIKED', companyName: 'z', headline: 'ignore me', source: 'Src', url: 'https://example.com/3', publishedAt: '2026-10-19T09:00:00Z' },
  ];
  const deck = buildDeck(candidates, prefs, history, updates, OPTS);
  const ups = deck.filter(c => c.type === 'update');
  check('updates: about 2 update cards appear', ups.length === 2, `got ${ups.length}`);
  check('updates: only about companies the user liked', ups.every(u => history.liked.has(u.ticker)));
  check('updates: about 5 new company cards', companyCards(deck).length === 5, `got ${companyCards(deck).length}`);
  check('updates: liked companies never repeat as company cards', companyCards(deck).every(c => !history.liked.has(c.ticker)));
}

// 5. Universe runs out: updates, then 21+ day old passes; never off-cause
{
  const prefs = { causes: ['keeping_safe'], dealbreakers: [], risk: 'high', goal: 'growth' };
  const onCause = candidates.filter(c => c.missions.some(m => m.cause === 'keeping_safe' && m.exposure !== 'peripheral'));
  const history = emptyHistory();
  onCause.forEach((c, i) => (i < 3 ? history.liked : i < 6 ? history.passedLongAgo : history.recentlySeen).add(c.ticker));
  const updates = [...history.liked].map((t, i) => ({ ticker: t, companyName: t, headline: `${t} news`, source: 'Src', url: `https://example.com/${i}`, publishedAt: '2026-10-19T09:00:00Z' }));
  const deck = buildDeck(candidates, prefs, history, updates, OPTS);
  const cards = companyCards(deck);
  check('ran out: never off-cause companies', cards.every(c => c.cause === 'keeping_safe' && byTicker.get(c.ticker).missions.some(m => m.cause === 'keeping_safe')));
  check('ran out: only passed-21+-days-ago companies recycle', cards.every(c => history.passedLongAgo.has(c.ticker) && c.recycled === true), JSON.stringify(cards.map(c => c.ticker)));
  check('ran out: fills with update cards', deck.filter(c => c.type === 'update').length === 3, `got ${deck.filter(c => c.type === 'update').length}`);
  check('ran out: no recently seen or liked company repeats', cards.every(c => !history.recentlySeen.has(c.ticker) && !history.liked.has(c.ticker)));
}

// 6. Scoring sanity: values dominate; a core match on cause #1 beats a partial match on cause #3
{
  const prefs = { causes: ['beat_cancer', 'clean_energy', 'keeping_safe'], dealbreakers: [], risk: 'medium', goal: 'growth' };
  const core1 = scoreCandidate({ ...byTicker.get('BE0'), missions: [{ cause: 'beat_cancer', exposure: 'core' }] }, prefs);
  const partial3 = scoreCandidate({ ...byTicker.get('BE0'), missions: [{ cause: 'keeping_safe', exposure: 'partial' }] }, prefs);
  check('score: core match on cause #1 > partial match on cause #3', core1.values > partial3.values, `${core1.values} vs ${partial3.values}`);
  const dual = scoreCandidate({ ...byTicker.get('BE0'), missions: [{ cause: 'beat_cancer', exposure: 'core' }, { cause: 'clean_energy', exposure: 'partial' }] }, prefs);
  check('score: matching two causes earns a bonus', dual.values >= core1.values && dual.matchedCauses.length === 2);
  check('score: total stays within 0-100', [core1, partial3, dual].every(s => s.total >= 0 && s.total <= 100));
}

console.log(failures ? `\n${failures} check(s) failed` : '\nAll deck composition checks passed');
process.exit(failures ? 1 : 0);
