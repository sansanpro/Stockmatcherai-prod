import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FMP_BASE_URL = 'https://financialmodelingprep.com/stable';

// Cache for company data
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

async function fetchWithCache(url: string, cacheKey: string, apiKey: string) {
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`[fmp-data] Cache hit: ${cacheKey}`);
    return cached.data;
  }

  console.log(`[fmp-data] Fetching: ${url}`);
  const response = await fetch(`${url}&apikey=${apiKey}`);
  
  if (!response.ok) {
    console.error(`[fmp-data] API error: ${response.status}`);
    return null;
  }
  
  const data = await response.json();
  cache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const fmpApiKey = Deno.env.get('FMP_API_KEY');
    if (!fmpApiKey) {
      return new Response(JSON.stringify({ error: 'FMP API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, symbol, limit = 5 } = await req.json();
    console.log(`[fmp-data] Action: ${action}, Symbol: ${symbol}`);

    let result: any = null;

    switch (action) {
      case 'company_profile':
        if (!symbol) {
          return new Response(JSON.stringify({ error: 'Symbol required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        result = await fetchWithCache(
          `${FMP_BASE_URL}/profile?symbol=${symbol}`,
          `profile_${symbol}`,
          fmpApiKey
        );
        // Return first item if array
        if (Array.isArray(result) && result.length > 0) {
          result = result[0];
        }
        break;

      case 'company_news':
        if (!symbol) {
          return new Response(JSON.stringify({ error: 'Symbol required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        // Use correct endpoint: /stable/news with tickers parameter
        result = await fetchWithCache(
          `${FMP_BASE_URL}/news?tickers=${symbol}&limit=${limit}`,
          `news_${symbol}_${limit}`,
          fmpApiKey
        );
        break;

      case 'market_news':
        // Use correct endpoint: /stable/news without tickers for general news
        result = await fetchWithCache(
          `${FMP_BASE_URL}/news?limit=${limit}`,
          `market_news_${limit}`,
          fmpApiKey
        );
        break;

      case 'batch_profiles':
        // Fetch multiple company profiles at once (max 5 to respect rate limits)
        const symbols = symbol?.split(',').slice(0, 5) || [];
        if (symbols.length === 0) {
          return new Response(JSON.stringify({ error: 'Symbols required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        const profiles: Record<string, any> = {};
        for (const sym of symbols) {
          const profile = await fetchWithCache(
            `${FMP_BASE_URL}/profile?symbol=${sym.trim()}`,
            `profile_${sym.trim()}`,
            fmpApiKey
          );
          if (profile && Array.isArray(profile) && profile.length > 0) {
            profiles[sym.trim()] = profile[0];
          }
        }
        result = profiles;
        break;

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[fmp-data] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
