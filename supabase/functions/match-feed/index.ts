// Today's values-matched deck, built on the server, and the swipes against it.
//   { action: 'deck', rebuild? }                         signed in: today's deck (built once per day;
//                                                        rebuild: true rebuilds it if nothing was swiped yet)
//   { action: 'deck', prefs, seen?, liked? }             signed out: a deck from onboarding answers
//   { action: 'swipe', ticker, liked }                   signed in: record a swipe on today's deck
//   { action: 'import', liked, passed }                  signed in: swipes made on this device before signing in
// Only cards in today's deck can be swiped, which is what enforces the daily limit.
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import {
  buildDeck, Candidate, DeckCard, Goal, NewsUpdate, RECYCLE_AFTER_DAYS, Risk, SwipeHistory, UserPrefs,
} from '../_shared/matching.ts';
import { cautionFor, latestMoves, moveWindowStart, PriceMove } from '../_shared/caution.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FREE_DECK_SIZE = 7;
const PREMIUM_DECK_SIZE = 12;
const UPDATE_CARDS = 2;
const UPDATE_MAX_AGE_DAYS = 3;
const MAX_IMPORT = 200;
const DEALBREAKERS = ['tobacco', 'weapons', 'fossil_fuels', 'gambling', 'factory_farming'];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

// Decks roll over at midnight US Eastern, so "today's matches" lines up with US mornings
const deckDate = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());

const num = (v: unknown): number | null => {
  const n = typeof v === 'string' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};

function normalizePrefs(input: Record<string, unknown>, liveCauses: Set<string>): UserPrefs | null {
  const causes = (Array.isArray(input.causes) ? input.causes : [])
    .filter((c): c is string => typeof c === 'string' && liveCauses.has(c))
    .slice(0, 3);
  if (causes.length === 0) return null;
  const dealbreakers = (Array.isArray(input.dealbreakers) ? input.dealbreakers : [])
    .filter((d): d is string => typeof d === 'string' && DEALBREAKERS.includes(d));
  const risk: Risk = input.risk === 'low' || input.risk === 'high' ? input.risk : 'medium';
  const goal: Goal = ['growth', 'income', 'short_term', 'learning'].includes(input.goal as string)
    ? input.goal as Goal : 'growth';
  return { causes, dealbreakers, risk, goal };
}

// Maps the stored profile (v1 or v2 answers) onto matching preferences
function prefsFromProfile(profile: Record<string, unknown>, liveCauses: Set<string>): UserPrefs | null {
  const goals = (profile.investment_goals as string[] | null) ?? [];
  const horizon = profile.horizon as string | null;
  const goal: Goal = horizon === 'short_term' ? 'short_term'
    : goals.includes('income') ? 'income'
    : goals.includes('none') || goals.includes('learning') ? 'learning'
    : goals.includes('short-term') ? 'short_term'
    : 'growth';
  return normalizePrefs({
    causes: profile.causes ?? [],
    dealbreakers: profile.dealbreakers ?? [],
    risk: profile.risk_tolerance,
    goal,
  }, liveCauses);
}

async function loadCandidates(db: SupabaseClient, causes: string[]): Promise<{ candidates: Candidate[]; stocks: Map<string, Record<string, unknown>> }> {
  const { data: missions } = await db.from('stock_missions')
    .select('ticker, cause, exposure, why_line')
    .eq('status', 'approved')
    .in('cause', causes)
    .neq('exposure', 'peripheral');
  const tickers = [...new Set((missions ?? []).map(m => m.ticker))];
  if (tickers.length === 0) return { candidates: [], stocks: new Map() };

  const [{ data: allMissions }, { data: stockRows }, { data: flags }, { data: metrics }] = await Promise.all([
    db.from('stock_missions').select('ticker, cause, exposure, why_line').eq('status', 'approved').in('ticker', tickers),
    db.from('stocks').select('*').in('ticker', tickers).eq('in_feed', true),
    db.from('stock_flags').select('ticker, dealbreaker').in('ticker', tickers),
    db.from('market_data_cache').select('cache_key, data').in('cache_key', tickers.map(t => `metrics:${t}`)),
  ]);

  const stocks = new Map((stockRows ?? []).map(s => [s.ticker as string, s as Record<string, unknown>]));
  const metricsByTicker = new Map((metrics ?? []).map(m => [(m.cache_key as string).slice('metrics:'.length), m.data as Record<string, unknown>]));
  const candidates: Candidate[] = [...stocks.values()]
    .filter(s => num(s.price_per_share) !== null) // needs a price before it can be shown
    .map(s => {
      const ticker = s.ticker as string;
      const m = metricsByTicker.get(ticker) ?? {};
      return {
        ticker,
        companyName: s.company_name as string,
        sector: s.sector as string,
        missions: (allMissions ?? []).filter(x => x.ticker === ticker)
          .map(x => ({ cause: x.cause, exposure: x.exposure, whyLine: x.why_line })),
        flags: (flags ?? []).filter(f => f.ticker === ticker).map(f => f.dealbreaker),
        marketCapUsd: num(s.market_cap_usd),
        beta: num(s.beta),
        dividendYield: num(s.dividend_yield),
        revenueGrowth: num(m.revenueGrowthTTMYoy),
        grossMargin: num(m.grossMarginTTM),
        debtToEquity: num(m['totalDebt/totalEquityQuarterly']),
      };
    });
  return { candidates, stocks };
}

async function loadHistory(db: SupabaseClient, userId: string): Promise<SwipeHistory> {
  const [{ data: swipes }, { data: legacyLikes }] = await Promise.all([
    db.from('swipes').select('ticker, liked, created_at').eq('user_id', userId).eq('card_type', 'company'),
    // Likes made before match-feed existed
    db.from('user_matches').select('ticker').eq('user_id', userId).eq('is_match', true),
  ]);
  const cutoff = Date.now() - RECYCLE_AFTER_DAYS * 24 * 60 * 60 * 1000;
  const liked = new Set<string>((legacyLikes ?? []).map(l => l.ticker));
  const recentlySeen = new Set<string>();
  const passedLongAgo = new Set<string>();
  for (const s of swipes ?? []) {
    if (s.liked) liked.add(s.ticker);
    else if (new Date(s.created_at).getTime() >= cutoff) recentlySeen.add(s.ticker);
    else passedLongAgo.add(s.ticker);
  }
  for (const t of recentlySeen) passedLongAgo.delete(t);
  return { liked, recentlySeen, passedLongAgo };
}

// News already cached for liked companies (no market-data calls while building a deck)
async function loadUpdates(db: SupabaseClient, liked: Set<string>, names: Map<string, string>): Promise<NewsUpdate[]> {
  if (liked.size === 0) return [];
  const { data } = await db.from('market_data_cache').select('cache_key, data')
    .in('cache_key', [...liked].map(t => `news:${t}`));
  const since = Date.now() - UPDATE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  const updates: NewsUpdate[] = [];
  for (const row of data ?? []) {
    const ticker = (row.cache_key as string).slice('news:'.length);
    const latest = ((row.data as Array<Record<string, string>>) ?? [])
      .find(n => n.title && new Date(n.publishedDate).getTime() >= since);
    if (latest) {
      updates.push({
        ticker,
        companyName: names.get(ticker) ?? ticker,
        headline: latest.title,
        source: latest.site,
        url: latest.url,
        publishedAt: latest.publishedDate,
      });
    }
  }
  return updates.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

// The Likes list (user_matches) gets one row per liked company
async function saveLikes(db: SupabaseClient, userId: string, tickers: string[], reasons: Map<string, string | null> = new Map()) {
  if (tickers.length === 0) return;
  const [{ data: existing }, { data: stocks }] = await Promise.all([
    db.from('user_matches').select('ticker').eq('user_id', userId).eq('is_match', true).in('ticker', tickers),
    db.from('stocks').select('ticker, company_name, sector, price_per_share, one_year_return').in('ticker', tickers),
  ]);
  const have = new Set((existing ?? []).map(r => r.ticker));
  const rows = (stocks ?? []).filter(s => !have.has(s.ticker)).map(s => ({
    user_id: userId,
    ticker: s.ticker,
    company_name: s.company_name ?? s.ticker,
    is_match: true,
    match_reason: reasons.get(s.ticker) ?? null,
    stock_data: { ticker: s.ticker, companyName: s.company_name, sector: s.sector, pricePerShare: s.price_per_share, oneYearReturn: s.one_year_return },
  }));
  if (rows.length) {
    const { error } = await db.from('user_matches').insert(rows);
    if (error) throw error;
  }
}

// Adds what the app needs to render each card
async function enrichCards(db: SupabaseClient, cards: DeckCard[], stocks: Map<string, Record<string, unknown>>) {
  const missing = cards.map(c => c.ticker).filter(t => !stocks.has(t));
  if (missing.length) {
    const { data } = await db.from('stocks').select('*').in('ticker', missing);
    for (const s of data ?? []) stocks.set(s.ticker, s);
  }
  const [{ data: causes }, { data: moves }] = await Promise.all([
    db.from('causes').select('id, label, icon'),
    db.from('price_moves').select('ticker, move_date, pct').in('ticker', cards.map(c => c.ticker)).gte('move_date', moveWindowStart()),
  ]);
  const causeInfo = new Map((causes ?? []).map(c => [c.id, c]));
  const recentMoves = latestMoves((moves ?? []) as PriceMove[]);
  return cards.map(card => {
    const s = stocks.get(card.ticker) ?? {};
    const company = {
      companyName: s.company_name,
      sector: s.sector,
      logoUrl: s.logo_url,
      pricePerShare: num(s.price_per_share),
      lastUpdated: s.updated_at,
      oneYearReturn: num(s.one_year_return),
      peRatio: num(s.pe_ratio),
      marketCap: s.market_cap,
      dividendYield: num(s.dividend_yield),
      riskLevel: s.risk_level,
      caution: cautionFor(s, recentMoves.get(card.ticker)),
    };
    if (card.type === 'update') return { ...card, ...company, missionStory: s.mission_story };
    return {
      ...card,
      ...company,
      missionStory: s.mission_story,
      proof: s.proof,
      proofSourceUrl: s.proof_source_url,
      thingsToKnow: s.things_to_know ?? [],
      ceoName: s.ceo_name,
      matchedCauses: card.matchedCauses.map(m => ({
        ...m,
        label: causeInfo.get(m.cause)?.label ?? m.cause,
        icon: causeInfo.get(m.cause)?.icon ?? '',
      })),
    };
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  try {
    const body = await req.json().catch(() => ({}));
    const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
    // The anon key is also a JWT; only a real user session resolves to a user
    const { data: { user } } = await db.auth.getUser(token).catch(() => ({ data: { user: null } }));
    const { data: causeRows } = await db.from('causes').select('id').eq('is_live', true);
    const liveCauses = new Set((causeRows ?? []).map(c => c.id as string));
    const today = deckDate();

    if (body.action === 'swipe') {
      if (!user) return json({ error: 'Sign in to save swipes' }, 401);
      const ticker = String(body.ticker ?? '').toUpperCase();
      const { data: deck } = await db.from('daily_decks').select('cards').eq('user_id', user.id).eq('deck_date', today).maybeSingle();
      const card = ((deck?.cards ?? []) as DeckCard[]).find(c => c.ticker === ticker);
      if (!card) return json({ error: "That card isn't in today's matches" }, 403);

      const { error } = await db.from('swipes').insert({
        user_id: user.id,
        ticker,
        liked: body.liked === true,
        cause: card.type === 'company' ? card.cause : null,
        card_type: card.type,
        deck_date: today,
      });
      if (error?.code === '23505') return json({ error: 'Already swiped' }, 409);
      if (error) throw error;

      if (body.liked === true && card.type === 'company') {
        await saveLikes(db, user.id, [ticker], new Map([[ticker, card.matchedCauses[0]?.whyLine ?? null]]));
      }
      const { data: swipedToday } = await db.from('swipes').select('ticker').eq('user_id', user.id).eq('deck_date', today);
      const swipedTickers = new Set((swipedToday ?? []).map(s => s.ticker));
      return json({ ok: true, remaining: (deck!.cards as DeckCard[]).filter(c => !swipedTickers.has(c.ticker)).length });
    }

    // Swipes from onboarding (made before the account existed): they keep those companies out of
    // future decks, and the likes go to the Likes list. They don't count against today's deck.
    if (body.action === 'import') {
      if (!user) return json({ error: 'Sign in first' }, 401);
      const clean = (v: unknown) => [...new Set((Array.isArray(v) ? v : []).map(t => String(t).toUpperCase()))]
        .filter(t => /^[A-Z.]{1,6}$/.test(t)).slice(0, MAX_IMPORT);
      const liked = clean(body.liked);
      const passed = clean(body.passed).filter(t => !liked.includes(t));
      const all = [...liked, ...passed];
      if (all.length === 0) return json({ ok: true, imported: 0 });
      const { data: known } = await db.from('stocks').select('ticker').in('ticker', all);
      const knownTickers = new Set((known ?? []).map(s => s.ticker));
      const rows = all.filter(t => knownTickers.has(t)).map(t => ({
        user_id: user.id, ticker: t, liked: liked.includes(t), card_type: 'company', deck_date: today,
      }));
      if (rows.length) {
        const { error } = await db.from('swipes').upsert(rows, { onConflict: 'user_id,ticker,deck_date', ignoreDuplicates: true });
        if (error) throw error;
      }
      await saveLikes(db, user.id, liked.filter(t => knownTickers.has(t)));
      return json({ ok: true, imported: rows.length });
    }

    if (body.action !== 'deck') return json({ error: 'Unknown action' }, 400);

    // Signed out: build from onboarding answers; nothing is stored
    if (!user) {
      const prefs = normalizePrefs(body.prefs ?? {}, liveCauses);
      if (!prefs) return json({ error: 'Pick at least one cause' }, 400);
      const seen = new Set<string>((Array.isArray(body.seen) ? body.seen : []).map(String));
      const liked = new Set<string>((Array.isArray(body.liked) ? body.liked : []).map(String));
      const { candidates, stocks } = await loadCandidates(db, prefs.causes);
      const cards = buildDeck(candidates, prefs, { liked, recentlySeen: seen, passedLongAgo: new Set() }, [], { size: FREE_DECK_SIZE, updateCards: 0 });
      return json({ deckDate: today, cards: await enrichCards(db, cards, stocks), swiped: [], signedIn: false });
    }

    const { data: profile } = await db.from('user_profiles').select('*').eq('user_id', user.id).maybeSingle();
    const prefs = profile ? prefsFromProfile(profile, liveCauses) : null;
    if (!prefs) return json({ error: 'needs_causes' }, 409);

    const { data: swipedToday } = await db.from('swipes').select('ticker, liked').eq('user_id', user.id).eq('deck_date', today);
    const { data: existing } = await db.from('daily_decks').select('cards').eq('user_id', user.id).eq('deck_date', today).maybeSingle();
    let cards = existing?.cards as DeckCard[] | undefined;
    // After the user changes their causes: today's deck is rebuilt only if none of it was swiped
    // yet, so a rebuild can never add swipes to the day
    if (cards && body.rebuild === true) {
      const deckTickers = new Set(cards.map(c => c.ticker));
      if (!(swipedToday ?? []).some(s => deckTickers.has(s.ticker))) {
        await db.from('daily_decks').delete().eq('user_id', user.id).eq('deck_date', today);
        cards = undefined;
      }
    }
    let stocks = new Map<string, Record<string, unknown>>();

    if (!cards) {
      const { data: sub } = await db.from('subscribers').select('subscribed').eq('user_id', user.id).maybeSingle();
      const size = sub?.subscribed ? PREMIUM_DECK_SIZE : FREE_DECK_SIZE;
      const [loaded, history] = await Promise.all([loadCandidates(db, prefs.causes), loadHistory(db, user.id)]);
      stocks = loaded.stocks;
      const names = new Map([...stocks.values()].map(s => [s.ticker as string, s.company_name as string]));
      const updates = await loadUpdates(db, history.liked, names);
      cards = buildDeck(loaded.candidates, prefs, history, updates, { size, updateCards: UPDATE_CARDS });
      if (cards.length > 0) {
        // Another request may have built it at the same moment; keep whichever was saved first
        await db.from('daily_decks').upsert({ user_id: user.id, deck_date: today, cards }, { onConflict: 'user_id,deck_date', ignoreDuplicates: true });
        const { data: saved } = await db.from('daily_decks').select('cards').eq('user_id', user.id).eq('deck_date', today).maybeSingle();
        cards = (saved?.cards as DeckCard[]) ?? cards;
      }
    }

    return json({
      deckDate: today,
      cards: await enrichCards(db, cards, stocks),
      swiped: swipedToday ?? [],
      signedIn: true,
    });
  } catch (error) {
    console.error('[match-feed] error:', error);
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
