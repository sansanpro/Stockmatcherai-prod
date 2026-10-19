// Values-first matching: hard filters, scoring and daily deck composition.
// Pure functions (no database or network) so the rules can be tested with example profiles
// (scripts/test-feed.mjs) and reused by the match-feed function.

export type Exposure = 'core' | 'partial' | 'peripheral';
export type Risk = 'low' | 'medium' | 'high';
export type Goal = 'growth' | 'income' | 'short_term' | 'learning';

export interface MissionTag {
  cause: string;
  exposure: Exposure;
  whyLine?: string | null;
}

export interface Candidate {
  ticker: string;
  companyName: string;
  sector: string;
  missions: MissionTag[];        // approved tags only
  flags: string[];               // dealbreaker categories
  marketCapUsd: number | null;
  beta: number | null;
  dividendYield: number | null;  // percent
  revenueGrowth: number | null;  // percent, trailing twelve months year over year
  grossMargin: number | null;    // percent
  debtToEquity: number | null;
  binaryOutcome?: boolean;       // e.g. single-product biotech awaiting a key approval
}

export interface UserPrefs {
  causes: string[];              // ranked, best first (max 3)
  dealbreakers: string[];
  risk: Risk;
  goal: Goal;
}

export interface SwipeHistory {
  liked: Set<string>;                     // never shown again as a company card
  recentlySeen: Set<string>;              // shown or passed in the last RECYCLE_AFTER_DAYS
  passedLongAgo: Set<string>;             // passed more than RECYCLE_AFTER_DAYS ago
}

export interface NewsUpdate {
  ticker: string;
  companyName: string;
  headline: string;
  source: string;
  url: string;
  publishedAt: string;
}

export interface ScoreBreakdown {
  total: number;      // 0-100
  values: number;     // 0-50
  fit: number;        // 0-20
  discovery: number;  // 0-15
  quality: number;    // 0-15
  matchedCauses: { cause: string; exposure: Exposure; whyLine?: string | null }[];
}

export type DeckCard =
  | { type: 'company'; ticker: string; cause: string; matchedCauses: ScoreBreakdown['matchedCauses']; score: number; recycled?: boolean }
  | { type: 'update'; ticker: string; companyName: string; headline: string; source: string; url: string; publishedAt: string };

export const RECYCLE_AFTER_DAYS = 21;
export const MID_CAP_MIN_USD = 2e9;
export const MID_CAP_MAX_USD = 20e9;
const SMALL_CAP_MAX_USD = 2e9;

const CAUSE_RANK_WEIGHT = [1.0, 0.7, 0.5];
const EXPOSURE_WEIGHT: Record<Exposure, number> = { core: 1.0, partial: 0.6, peripheral: 0 };

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

// Stage 1: hard filters. Companies that fail any of these never appear for this user.
export function passesHardFilters(c: Candidate, prefs: UserPrefs): boolean {
  // Must match one of the user's causes with core or partial exposure (never off-cause)
  if (!c.missions.some(m => prefs.causes.includes(m.cause) && m.exposure !== 'peripheral')) return false;
  if (c.flags.some(f => prefs.dealbreakers.includes(f))) return false;
  if (prefs.risk === 'low') {
    if (c.marketCapUsd !== null && c.marketCapUsd < SMALL_CAP_MAX_USD) return false;
    if (c.binaryOutcome) return false;
  }
  return true;
}

// Stage 2: score (0-100). Values match dominates; the rest only orders companies within it.
export function scoreCandidate(c: Candidate, prefs: UserPrefs): ScoreBreakdown {
  // Values (50): best-matching cause, plus 20% for each additional cause matched
  const matches = c.missions
    .filter(m => prefs.causes.includes(m.cause) && m.exposure !== 'peripheral')
    .map(m => ({ ...m, weight: CAUSE_RANK_WEIGHT[prefs.causes.indexOf(m.cause)] * EXPOSURE_WEIGHT[m.exposure] }))
    .sort((a, b) => b.weight - a.weight);
  const valuesRaw = matches.length ? clamp01(matches[0].weight * (1 + 0.2 * (matches.length - 1))) : 0;

  // Fit (20): risk via beta, plus goal
  const targetBeta = prefs.risk === 'low' || prefs.goal === 'short_term' ? 0.8 : prefs.risk === 'medium' ? 1.0 : 1.3;
  const riskFit = c.beta === null ? 0.5 : 1 - clamp01(Math.abs(c.beta - targetBeta));
  let goalFit = 0.5;
  if (prefs.goal === 'income') goalFit = c.dividendYield === null ? 0 : clamp01(c.dividendYield / 3);
  else if (prefs.goal === 'growth') goalFit = c.revenueGrowth === null ? 0.5 : clamp01(c.revenueGrowth / 20);
  else if (prefs.goal === 'short_term') goalFit = c.beta === null ? 0.5 : clamp01(1.5 - c.beta);
  else if (prefs.goal === 'learning') goalFit = c.marketCapUsd === null ? 0.5 : clamp01(Math.log10(c.marketCapUsd / 1e9) / 3); // well-known = bigger
  const fitRaw = (riskFit + goalFit) / 2;

  // Discovery (15): smaller companies get a boost (inverse log of market cap, $1B..$3T)
  const discoveryRaw = c.marketCapUsd === null || c.marketCapUsd <= 0
    ? 0.5
    : clamp01((Math.log10(3e12) - Math.log10(c.marketCapUsd)) / (Math.log10(3e12) - Math.log10(1e9)));

  // Quality guardrail (15): a floor, never shown as a rating
  const checks = [
    c.revenueGrowth === null ? null : c.revenueGrowth > 0,
    c.grossMargin === null ? null : c.grossMargin > 0,
    c.debtToEquity === null ? null : c.debtToEquity < 3,
  ].filter((x): x is boolean => x !== null);
  const qualityRaw = checks.length ? checks.filter(Boolean).length / checks.length : 0.5;

  const values = valuesRaw * 50;
  const fit = fitRaw * 20;
  const discovery = discoveryRaw * 15;
  const quality = qualityRaw * 15;
  return {
    total: Math.round((values + fit + discovery + quality) * 10) / 10,
    values: Math.round(values * 10) / 10,
    fit: Math.round(fit * 10) / 10,
    discovery: Math.round(discovery * 10) / 10,
    quality: Math.round(quality * 10) / 10,
    matchedCauses: matches.map(({ cause, exposure, whyLine }) => ({ cause, exposure, whyLine })),
  };
}

const isMidCap = (c: Candidate) =>
  c.marketCapUsd !== null && c.marketCapUsd >= MID_CAP_MIN_USD && c.marketCapUsd <= MID_CAP_MAX_USD;

// How many of the company cards each cause gets, by rank (7 cards, 3 causes -> 4/2/1;
// 5 cards -> 3/1/1). No cause gets more than half (rounded up) when others can take the rest,
// so "no two in a row from the same cause" stays possible.
function causeQuotas(causes: string[], companyCards: number): Map<string, number> {
  const shares = [0.5, 0.3, 0.2].slice(0, causes.length);
  const total = shares.reduce((a, b) => a + b, 0);
  const quotas = causes.map((_, i) => Math.floor((shares[i] / total) * companyCards));
  for (let i = 0, assigned = quotas.reduce((a, b) => a + b, 0); assigned < companyCards; i = (i + 1) % causes.length, assigned++) {
    quotas[i]++;
  }
  const cap = Math.ceil(companyCards / 2);
  if (causes.length > 1) {
    for (let i = 0; i < quotas.length; i++) {
      while (quotas[i] > cap) {
        quotas[i]--;
        quotas[(i + 1) % quotas.length]++;
      }
    }
  }
  return new Map(causes.map((cause, i) => [cause, quotas[i]]));
}

// Orders cards so no two in a row share a cause or a sector. Searches for a clash-free order
// (decks are small: 7 cards is at most 5,040 orders), keeping the score order where it can;
// falls back to the order with the fewest clashes.
function spreadOut<T extends { cause?: string; sector?: string }>(cards: T[]): T[] {
  const clash = (a: T, b: T) => a.cause === b.cause || a.sector === b.sector;
  if (cards.length > 9) return cards; // larger decks: keep score order (not used today)

  let best: T[] = cards;
  let bestClashes = Infinity;
  const used = new Array(cards.length).fill(false);
  const path: T[] = [];
  const search = (clashes: number): boolean => {
    if (clashes >= bestClashes) return false;
    if (path.length === cards.length) {
      best = [...path];
      bestClashes = clashes;
      return clashes === 0;
    }
    for (let i = 0; i < cards.length; i++) {
      if (used[i]) continue;
      const prev = path[path.length - 1];
      used[i] = true;
      path.push(cards[i]);
      const done = search(clashes + (prev && clash(prev, cards[i]) ? 1 : 0));
      path.pop();
      used[i] = false;
      if (done) return true;
    }
    return false;
  };
  search(0);
  return best;
}

export interface DeckOptions {
  size: number;          // total cards (7 free)
  updateCards: number;   // target update cards (~2)
}

// Stage 3: today's deck. ~5 new company cards across the user's causes (by rank) + ~2 update
// cards about companies they liked. When new companies run out: more update cards, then passed
// companies not seen in RECYCLE_AFTER_DAYS. Never off-cause companies.
export function buildDeck(
  candidates: Candidate[],
  prefs: UserPrefs,
  history: SwipeHistory,
  updates: NewsUpdate[],
  { size, updateCards }: DeckOptions,
): DeckCard[] {
  const eligible = candidates
    .filter(c => passesHardFilters(c, prefs))
    .map(c => ({ c, s: scoreCandidate(c, prefs) }))
    .sort((a, b) => b.s.total - a.s.total);

  const fresh = eligible.filter(({ c }) => !history.liked.has(c.ticker) && !history.recentlySeen.has(c.ticker) && !history.passedLongAgo.has(c.ticker));
  const recyclable = eligible.filter(({ c }) => history.passedLongAgo.has(c.ticker) && !history.recentlySeen.has(c.ticker) && !history.liked.has(c.ticker));

  const usableUpdates = updates.filter(u => history.liked.has(u.ticker));
  const companySlots = Math.max(0, size - Math.min(updateCards, usableUpdates.length));

  // Fill each cause's quota from its best-scoring fresh companies
  const quotas = causeQuotas(prefs.causes, companySlots);
  const picked: { c: Candidate; s: ScoreBreakdown; cause: string; recycled?: boolean }[] = [];
  const used = new Set<string>();
  const primaryCause = (s: ScoreBreakdown) => s.matchedCauses[0]?.cause;
  for (const cause of prefs.causes) {
    const quota = quotas.get(cause) ?? 0;
    for (const item of fresh.filter(e => primaryCause(e.s) === cause)) {
      if (picked.filter(p => p.cause === cause).length >= quota) break;
      if (used.has(item.c.ticker)) continue;
      picked.push({ ...item, cause });
      used.add(item.c.ticker);
    }
  }
  // Spare slots (a cause ran short): best remaining fresh companies from any of the user's causes
  for (const item of fresh) {
    if (picked.length >= companySlots) break;
    if (used.has(item.c.ticker)) continue;
    picked.push({ ...item, cause: primaryCause(item.s)! });
    used.add(item.c.ticker);
  }

  // At least one mid-cap when the risk gate allows and one is available
  if (prefs.risk !== 'low' && picked.length && !picked.some(p => isMidCap(p.c))) {
    const mid = fresh.find(e => isMidCap(e.c) && !used.has(e.c.ticker));
    if (mid) {
      const dropped = picked.pop()!;
      used.delete(dropped.c.ticker);
      picked.push({ ...mid, cause: primaryCause(mid.s)! });
      used.add(mid.c.ticker);
    }
  }

  // Out of new companies: update cards first, then passed companies from 21+ days ago
  const updateTarget = Math.min(usableUpdates.length, size - picked.length);
  const chosenUpdates = usableUpdates.slice(0, updateTarget);
  for (const item of recyclable) {
    if (picked.length + chosenUpdates.length >= size) break;
    if (used.has(item.c.ticker)) continue;
    picked.push({ ...item, cause: primaryCause(item.s)!, recycled: true });
    used.add(item.c.ticker);
  }

  const companyCards = spreadOut(picked.map(p => ({
    type: 'company' as const,
    ticker: p.c.ticker,
    cause: p.cause,
    sector: p.c.sector,
    matchedCauses: p.s.matchedCauses,
    score: p.s.total,
    ...(p.recycled ? { recycled: true } : {}),
  })));

  // Interleave updates: after the 2nd company card, then near the end
  const deck: DeckCard[] = companyCards.map(({ sector: _sector, ...card }) => card);
  chosenUpdates.forEach((u, i) => {
    const position = Math.min(deck.length, i === 0 ? 2 : deck.length - 1);
    deck.splice(position, 0, { type: 'update', ...u });
  });
  return deck.slice(0, size);
}
