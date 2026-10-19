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

    const { action, symbol, limit = 5 } = await req.json();
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
        const news = await withCache(`news_${sym}`, CACHE_DURATION, () => finnhub.getCompanyNews(sym));
        // Finnhub returns newest first
        result = news.slice(0, limit).map(item => toNewsItem(item, sym));
        break;
      }

      case 'market_news': {
        const news = await withCache('market_news', CACHE_DURATION, () => finnhub.getMarketNews());
        result = news.slice(0, limit).map(item => toNewsItem(item));
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
