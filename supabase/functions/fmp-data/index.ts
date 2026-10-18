// Company profile + news for the app. Backed by Finnhub; the function keeps its original
// name and response shape so already-installed app builds keep working.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { FinnhubClient, FinnhubNewsItem, FinnhubRateLimitError } from '../_shared/finnhub.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Finnhub's free profile has no description, employee count or HQ city/state. If an FMP key
// is still configured we fill those from FMP's profile (cached for a day, failures ignored).
const FMP_BASE_URL = 'https://financialmodelingprep.com/stable';

const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const FMP_CACHE_DURATION = 24 * 60 * 60 * 1000; // 1 day

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

async function getFmpProfileDetails(symbol: string): Promise<Record<string, any> | null> {
  const fmpApiKey = Deno.env.get('FMP_API_KEY');
  if (!fmpApiKey) return null;
  try {
    return await withCache(`fmp_profile_${symbol}`, FMP_CACHE_DURATION, async () => {
      const response = await fetch(`${FMP_BASE_URL}/profile?symbol=${symbol}&apikey=${fmpApiKey}`);
      if (!response.ok) return null;
      const data = await response.json();
      return Array.isArray(data) && data.length > 0 ? data[0] : null;
    });
  } catch (error) {
    console.error(`[fmp-data] FMP profile fallback failed for ${symbol}:`, error);
    return null;
  }
}

// Maps to the CompanyProfile shape in src/hooks/useCompanyProfile.ts
async function getCompanyProfile(finnhub: FinnhubClient, symbol: string) {
  const profile = await withCache(`profile_${symbol}`, CACHE_DURATION, () => finnhub.getProfile(symbol));
  if (!profile) return null;

  const fmp = await getFmpProfileDetails(symbol);
  return {
    symbol: profile.ticker,
    companyName: profile.name ?? fmp?.companyName ?? symbol,
    description: fmp?.description ?? '',
    sector: fmp?.sector ?? profile.finnhubIndustry ?? '',
    industry: profile.finnhubIndustry ?? fmp?.industry ?? '',
    country: profile.country ?? fmp?.country ?? '',
    fullTimeEmployees: fmp?.fullTimeEmployees ?? '',
    website: profile.weburl ?? fmp?.website ?? '',
    mktCap: (profile.marketCapitalization ?? 0) * 1_000_000,
    ipoDate: profile.ipo ?? fmp?.ipoDate ?? '',
    image: profile.logo || fmp?.image || '',
    city: fmp?.city,
    state: fmp?.state,
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

serve(async (req) => {
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
    console.log(`[fmp-data] Action: ${action}, Symbol: ${symbol}`);

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
    console.error('[fmp-data] Error:', error);
    return jsonResponse({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
