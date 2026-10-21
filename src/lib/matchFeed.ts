// Client for the match-feed function (today's values-matched deck), the causes users pick from,
// and the swipe history kept on the device before sign-in.
import { supabase } from '@/integrations/supabase/client';
import type { MatchedCause, StockRecommendation } from '@/types/stock-matcher';
import { toPrefs, type OnboardingAnswers } from '@/lib/onboarding';

export interface FeedCard {
  type: 'company' | 'update';
  ticker: string;
  cause?: string;
  matchedCauses?: MatchedCause[];
  score?: number;
  recycled?: boolean;
  headline?: string;
  source?: string;
  url?: string;
  publishedAt?: string;
  companyName?: string;
  sector?: string;
  logoUrl?: string | null;
  pricePerShare?: number | null;
  lastUpdated?: string | null;
  oneYearReturn?: number | null;
  peRatio?: number | null;
  marketCap?: string | null;
  dividendYield?: number | null;
  riskLevel?: string | null;
  missionStory?: string | null;
  proof?: string | null;
  proofSourceUrl?: string | null;
  thingsToKnow?: string[];
  ceoName?: string | null;
}

export interface FeedDeck {
  deckDate: string;
  cards: FeedCard[];
  swiped: { ticker: string; liked: boolean }[];
  signedIn: boolean;
}

export class FeedError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

// Decks roll over at midnight US Eastern, the same as on the server
export const feedDate = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('match-feed', { body });
  if (error) {
    // FunctionsHttpError carries the response; surface its status and message
    const response = (error as { context?: Response }).context;
    let message = error.message;
    let status = 500;
    if (response instanceof Response) {
      status = response.status;
      message = (await response.clone().json().catch(() => null))?.error ?? message;
    }
    throw new FeedError(message, status);
  }
  return data as T;
}

export const fetchSignedInDeck = (rebuild = false) => call<FeedDeck>({ action: 'deck', ...(rebuild ? { rebuild: true } : {}) });

export const fetchSignedOutDeck = (answers: OnboardingAnswers, seen: string[], liked: string[]) =>
  call<FeedDeck>({ action: 'deck', prefs: toPrefs(answers), seen, liked });

export const recordSwipe = (ticker: string, liked: boolean) =>
  call<{ ok: boolean; remaining: number }>({ action: 'swipe', ticker, liked });

export const importDeviceSwipes = (liked: string[], passed: string[]) =>
  call<{ ok: boolean; imported: number }>({ action: 'import', liked, passed });

// The card shape the deck UI renders
export function cardToRecommendation(card: FeedCard): StockRecommendation {
  const matched = card.matchedCauses ?? [];
  const why = card.type === 'update'
    ? card.headline ?? ''
    : [matched[0]?.whyLine, matched.length > 1 ? `It also matches ${matched.slice(1).map(m => m.label).join(' and ')}.` : null]
        .filter(Boolean).join(' ') || card.missionStory || '';
  const risk = card.riskLevel === 'low' || card.riskLevel === 'high' ? card.riskLevel : 'medium';
  return {
    id: card.ticker,
    ticker: card.ticker,
    companyName: card.companyName ?? card.ticker,
    sector: card.sector ?? '',
    ceoName: card.ceoName ?? '',
    ceoHighlights: '',
    peRatio: card.peRatio ?? 0,
    marketCap: card.marketCap ?? '',
    oneYearReturn: card.oneYearReturn ?? 0,
    riskLevel: risk,
    pricePerShare: card.pricePerShare ?? 0,
    dividendYield: card.dividendYield ?? 0,
    whyItFits: why,
    lastUpdated: card.lastUpdated ?? undefined,
    logoUrl: card.logoUrl ?? undefined,
    cardType: card.type,
    cause: card.cause,
    matchedCauses: matched,
    missionStory: card.missionStory ?? undefined,
    proof: card.proof ?? undefined,
    proofSourceUrl: card.proofSourceUrl ?? undefined,
    thingsToKnow: card.thingsToKnow ?? [],
    update: card.type === 'update'
      ? { headline: card.headline ?? '', source: card.source, url: card.url, publishedAt: card.publishedAt }
      : undefined,
  };
}

// --- Swipes made before sign-in, kept on this device ---

interface DeviceFeed {
  deck?: { date: string; cards: FeedCard[]; swiped: { ticker: string; liked: boolean }[] };
  liked: string[];  // every company liked on this device
  passed: string[]; // every company passed on this device
}

const DEVICE_FEED_KEY = 'device_feed_v1';

export function loadDeviceFeed(): DeviceFeed {
  try {
    const raw = localStorage.getItem(DEVICE_FEED_KEY);
    if (raw) return { liked: [], passed: [], ...JSON.parse(raw) };
  } catch { /* storage blocked or corrupt */ }
  return { liked: [], passed: [] };
}

export function saveDeviceFeed(feed: DeviceFeed) {
  try { localStorage.setItem(DEVICE_FEED_KEY, JSON.stringify(feed)); } catch { /* storage blocked */ }
}

export function clearDeviceFeed() {
  try { localStorage.removeItem(DEVICE_FEED_KEY); } catch { /* storage blocked */ }
}

export function recordDeviceSwipe(ticker: string, liked: boolean) {
  const feed = loadDeviceFeed();
  if (feed.deck && !feed.deck.swiped.some(s => s.ticker === ticker)) feed.deck.swiped.push({ ticker, liked });
  feed.liked = feed.liked.filter(t => t !== ticker);
  feed.passed = feed.passed.filter(t => t !== ticker);
  (liked ? feed.liked : feed.passed).push(ticker);
  saveDeviceFeed(feed);
}

// --- Causes ---

export interface CauseInfo {
  id: string;
  label: string;
  tagline: string;
  icon: string;
  companies: number;
}

let causesCache: Promise<CauseInfo[]> | null = null;

// Live causes with how many reviewed companies work on each, in display order
export function fetchCauses(): Promise<CauseInfo[]> {
  causesCache ??= (async () => {
    const [{ data: causes, error }, { data: counts }] = await Promise.all([
      supabase.from('causes').select('id, label, tagline, icon, sort_order').eq('is_live', true).order('sort_order'),
      supabase.from('cause_company_counts').select('cause, companies'),
    ]);
    if (error || !causes) {
      causesCache = null;
      throw error ?? new Error('Could not load causes');
    }
    const byCause = new Map((counts ?? []).map(c => [c.cause, Number(c.companies) || 0]));
    return causes.map(c => ({ id: c.id, label: c.label, tagline: c.tagline, icon: c.icon, companies: byCause.get(c.id) ?? 0 }));
  })();
  return causesCache;
}

// Companies working on any of these causes, minus those flagged with a dealbreaker, with a few logos
export async function previewMatches(causes: string[], dealbreakers: string[]) {
  if (causes.length === 0) return { count: 0, logos: [] as string[] };
  const [{ data: missions }, { data: flags }] = await Promise.all([
    supabase.from('stock_missions').select('ticker').eq('status', 'approved').in('cause', causes).in('exposure', ['core', 'partial']),
    dealbreakers.length
      ? supabase.from('stock_flags').select('ticker').in('dealbreaker', dealbreakers)
      : Promise.resolve({ data: [] as { ticker: string }[] }),
  ]);
  const excluded = new Set((flags ?? []).map(f => f.ticker));
  const tickers = [...new Set((missions ?? []).map(m => m.ticker))].filter(t => !excluded.has(t));
  const { data: stocks } = tickers.length
    ? await supabase.from('stocks').select('ticker, logo_url').in('ticker', tickers.slice(0, 40)).not('logo_url', 'is', null)
    : { data: [] as { ticker: string; logo_url: string | null }[] };
  const logos = (stocks ?? []).map(s => s.logo_url).filter((u): u is string => !!u).slice(0, 8);
  return { count: tickers.length, logos };
}
