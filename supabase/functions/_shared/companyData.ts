// Company profile + news request handler, served by the company-data function
// (and the legacy fmp-data alias for already-installed app builds).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { FinnhubClient, FinnhubNewsItem, FinnhubRateLimitError } from './finnhub.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

async function withCache<T>(cacheKey: string, ttl: number, fetcher: () => Promise<T>): Promise<T> {
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  const data = await fetcher();
  if (data !== null && data !== undefined) {
    cache.set(cacheKey, { data, timestamp: Date.now() });
  }
  return data;
}

interface StoredCompanyProfile {
  description: string;
  full_time_employees: number | null;
  city: string | null;
  state: string | null;
  country: string;
  industry: string | null;
  website: string | null;
  ipo_date: string | null;
  logo_url: string | null;
  finnhub_synced_at: string | null;
}

const db = () => createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

// Company facts live in the company_profiles table so profile views don't spend Finnhub's
// shared 60 calls/min. Finnhub is only called once per ticker to fill industry, website,
// IPO date and logo, and the result is stored.
async function getStoredProfile(symbol: string): Promise<StoredCompanyProfile | null> {
  const { data, error } = await db()
    .from('company_profiles')
    .select('description, full_time_employees, city, state, country, industry, website, ipo_date, logo_url, finnhub_synced_at')
    .eq('ticker', symbol)
    .maybeSingle();
  if (error) {
    console.error(`[company-data] company_profiles lookup failed for ${symbol}:`, error);
    return null;
  }
  return data;
}

async function syncFromFinnhub(finnhub: FinnhubClient, symbol: string, stored: StoredCompanyProfile | null) {
  let profile = null;
  try {
    profile = await finnhub.getProfile(symbol);
  } catch (error) {
    // Rate limited or down: serve what we have and try again on a later request
    console.warn(`[company-data] Finnhub profile unavailable for ${symbol}:`, error instanceof Error ? error.message : error);
    return null;
  }
  if (!profile) return null;

  const fields = {
    industry: profile.finnhubIndustry || null,
    website: profile.weburl || null,
    ipo_date: profile.ipo || null,
    logo_url: profile.logo || null,
    finnhub_synced_at: new Date().toISOString(),
  };
  // Only update existing rows; new tickers need a description written before they get a row
  if (stored) {
    const { error } = await db().from('company_profiles').update(fields).eq('ticker', symbol);
    if (error) console.error(`[company-data] Failed to store Finnhub fields for ${symbol}:`, error);
  }
  return { ...fields, name: profile.name, country: profile.country };
}

// Maps to the CompanyProfile shape in src/hooks/useCompanyProfile.ts
async function getCompanyProfile(finnhub: FinnhubClient, symbol: string) {
  const stored = await getStoredProfile(symbol);
  const synced = stored?.finnhub_synced_at
    ? null
    : await withCache(`finnhub_profile_${symbol}`, CACHE_DURATION, () => syncFromFinnhub(finnhub, symbol, stored));
  if (!stored && !synced) return null;

  // Outside the US there is no state, so show the country after the city instead
  const region = stored?.state ?? (stored && stored.country !== 'US' ? stored.country : undefined);
  return {
    symbol,
    companyName: synced?.name ?? symbol,
    description: stored?.description ?? '',
    sector: stored?.industry ?? synced?.industry ?? '',
    industry: stored?.industry ?? synced?.industry ?? '',
    country: stored?.country ?? synced?.country ?? '',
    fullTimeEmployees: stored?.full_time_employees?.toString() ?? '',
    website: stored?.website ?? synced?.website ?? '',
    mktCap: 0, // not shown in the app
    ipoDate: stored?.ipo_date ?? synced?.ipo_date ?? '',
    image: stored?.logo_url || synced?.logo_url || `https://images.financialmodelingprep.com/symbol/${symbol}.png`,
    city: stored?.city ?? undefined,
    state: region,
  };
}

// Shared Finnhub response cache in market_data_cache: every user and function instance reads
// the same row, so Finnhub is called at most once per key per TTL. If a refresh fails (e.g.
// Finnhub's rate limit), the stale copy is served rather than an error.
async function withSharedCache<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const { data: row } = await db().from('market_data_cache').select('data, fetched_at').eq('cache_key', key).maybeSingle();
  if (row && Date.now() - new Date(row.fetched_at).getTime() < ttlMs) return row.data as T;
  try {
    const fresh = await fetcher();
    await db().from('market_data_cache').upsert({ cache_key: key, data: fresh, fetched_at: new Date().toISOString() });
    return fresh;
  } catch (error) {
    if (row) {
      console.warn(`[company-data] Serving stale ${key}:`, error instanceof Error ? error.message : error);
      return row.data as T;
    }
    throw error;
  }
}

const NEWS_TTL = 15 * 60 * 1000;
const PERFORMANCE_TTL = 6 * 60 * 60 * 1000;

const round = (n: unknown) => typeof n === 'number' && Number.isFinite(n) ? Number(n.toFixed(2)) : null;

// Real price returns over several periods (Finnhub's free tier has no price history for charts)
async function getPricePerformance(finnhub: FinnhubClient, symbol: string) {
  const m = await finnhub.getMetrics(symbol);
  if (!m) return null;
  return {
    symbol,
    returns: [
      { period: '5D', percent: round(m['5DayPriceReturnDaily']) },
      { period: 'MTD', percent: round(m['monthToDatePriceReturnDaily']) },
      { period: '3M', percent: round(m['13WeekPriceReturnDaily']) },
      { period: '6M', percent: round(m['26WeekPriceReturnDaily']) },
      { period: 'YTD', percent: round(m['yearToDatePriceReturnDaily']) },
      { period: '1Y', percent: round(m['52WeekPriceReturnDaily']) },
    ].filter(r => r.percent !== null),
    fiftyTwoWeekHigh: round(m['52WeekHigh']),
    fiftyTwoWeekLow: round(m['52WeekLow']),
    beta: round(m['beta']),
  };
}

// Finnhub tags any article that mentions a ticker (market wraps, competitor stories), so prefer
// articles that name the company (headline matches first); fall back to everything if few match.
const NAME_SUFFIXES = /\b(inc|incorporated|corp|corporation|co|company|plc|ltd|holdings|group|the|class [a-z].*)\b\.?/gi;
function relevantNews<T extends { title: string; text?: string }>(items: T[], symbol: string, companyName?: string): T[] {
  const name = companyName?.replace(NAME_SUFFIXES, '').replace(/[,.&]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
  const firstWord = name?.split(' ')[0];
  const terms = [
    name,
    // A distinctive first word ("Fortinet", "Nvidia") also counts; skip generic ones like "Bank"
    firstWord && firstWord.length >= 4 && !['bank', 'first', 'american', 'united', 'general'].includes(firstWord) ? firstWord : null,
  ].filter(Boolean) as string[];
  const tickerPattern = new RegExp(`\\b${symbol}\\b`);
  const mentions = (text: string) => tickerPattern.test(text) || terms.some(term => text.toLowerCase().includes(term));
  // Headline mentions first (stable, so newest-first order is kept within each group)
  const inHeadline = items.filter(item => mentions(item.title));
  const inSummaryOnly = items.filter(item => !mentions(item.title) && mentions(item.text ?? ''));
  const matches = [...inHeadline, ...inSummaryOnly];
  return matches.length >= 2 ? matches : items;
}

// Maps to the NewsItem shape in src/hooks/useCompanyNews.ts
function toNewsItem(item: FinnhubNewsItem, symbol?: string) {
  return {
    title: item.headline,
    url: item.url,
    publishedDate: new Date(item.datetime * 1000).toISOString(),
    site: item.source,
    text: item.summary,
    image: item.image,
    symbol: symbol ?? item.related,
  };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export async function handleCompanyDataRequest(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const finnhubApiKey = Deno.env.get('FINNHUB_API_KEY');
    if (!finnhubApiKey) {
      return jsonResponse({ error: 'FINNHUB_API_KEY not configured' }, 500);
    }
    const finnhub = new FinnhubClient(finnhubApiKey);

    const { action, symbol, limit = 5, companyName } = await req.json();
    console.log(`[company-data] Action: ${action}, Symbol: ${symbol}`);

    let result: any = null;

    switch (action) {
      case 'company_profile':
        if (!symbol) return jsonResponse({ error: 'Symbol required' }, 400);
        result = await getCompanyProfile(finnhub, symbol.trim().toUpperCase());
        break;

      case 'company_news': {
        if (!symbol) return jsonResponse({ error: 'Symbol required' }, 400);
        const sym = symbol.trim().toUpperCase();
        // Finnhub returns newest first
        const news = await withSharedCache(`news:${sym}`, NEWS_TTL,
          async () => (await finnhub.getCompanyNews(sym)).slice(0, 20).map(item => toNewsItem(item, sym)));
        result = relevantNews(news, sym, companyName).slice(0, limit);
        break;
      }

      case 'market_news': {
        const news = await withSharedCache('news:__market__', NEWS_TTL,
          async () => (await finnhub.getMarketNews()).slice(0, 20).map(item => toNewsItem(item)));
        result = news.slice(0, limit);
        break;
      }

      case 'price_performance': {
        if (!symbol) return jsonResponse({ error: 'Symbol required' }, 400);
        const sym = symbol.trim().toUpperCase();
        result = await withSharedCache(`performance:${sym}`, PERFORMANCE_TTL, () => getPricePerformance(finnhub, sym));
        break;
      }

      case 'batch_profiles': {
        // Fetch multiple company profiles at once (max 5 to respect rate limits)
        const symbols: string[] = symbol?.split(',').map((s: string) => s.trim().toUpperCase()).filter(Boolean).slice(0, 5) || [];
        if (symbols.length === 0) return jsonResponse({ error: 'Symbols required' }, 400);

        const profiles: Record<string, any> = {};
        for (const sym of symbols) {
          const profile = await getCompanyProfile(finnhub, sym);
          if (profile) profiles[sym] = profile;
        }
        result = profiles;
        break;
      }

      default:
        return jsonResponse({ error: 'Invalid action' }, 400);
    }

    return jsonResponse({ data: result });

  } catch (error) {
    if (error instanceof FinnhubRateLimitError) {
      return jsonResponse({ error: 'Rate limit exceeded, try again shortly' }, 429);
    }
    console.error('[company-data] Error:', error);
    return jsonResponse({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
}
