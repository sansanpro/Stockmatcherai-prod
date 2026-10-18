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
}

// Static facts Finnhub's free profile lacks (description, employees, HQ) live in the
// company_profiles table, so no API call is needed for them.
async function getStoredProfile(symbol: string): Promise<StoredCompanyProfile | null> {
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data, error } = await supabase
    .from('company_profiles')
    .select('description, full_time_employees, city, state, country')
    .eq('ticker', symbol)
    .maybeSingle();
  if (error) {
    console.error(`[company-data] company_profiles lookup failed for ${symbol}:`, error);
    return null;
  }
  return data;
}

// Maps to the CompanyProfile shape in src/hooks/useCompanyProfile.ts
async function getCompanyProfile(finnhub: FinnhubClient, symbol: string) {
  const [profile, stored] = await Promise.all([
    withCache(`profile_${symbol}`, CACHE_DURATION, () => finnhub.getProfile(symbol)),
    getStoredProfile(symbol),
  ]);
  if (!profile && !stored) return null;

  // Outside the US there is no state, so show the country after the city instead
  const region = stored?.state ?? (stored && stored.country !== 'US' ? stored.country : undefined);
  return {
    symbol,
    companyName: profile?.name ?? symbol,
    description: stored?.description ?? '',
    sector: profile?.finnhubIndustry ?? '',
    industry: profile?.finnhubIndustry ?? '',
    country: stored?.country ?? profile?.country ?? '',
    fullTimeEmployees: stored?.full_time_employees?.toString() ?? '',
    website: profile?.weburl ?? '',
    mktCap: (profile?.marketCapitalization ?? 0) * 1_000_000,
    ipoDate: profile?.ipo ?? '',
    image: profile?.logo || `https://images.financialmodelingprep.com/symbol/${symbol}.png`,
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
