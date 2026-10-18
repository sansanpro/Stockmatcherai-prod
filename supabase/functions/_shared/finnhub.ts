// Finnhub API client shared by edge functions.
// Free tier: ~60 calls/min. Docs: https://finnhub.io/docs/api

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

export interface FinnhubQuote {
  c: number;   // current price
  d: number | null;   // change
  dp: number | null;  // percent change (today)
  h: number;   // day high
  l: number;   // day low
  o: number;   // open
  pc: number;  // previous close
  t: number;   // unix timestamp (seconds)
}

export interface FinnhubProfile {
  country?: string;
  currency?: string;
  exchange?: string;
  finnhubIndustry?: string;
  ipo?: string;
  logo?: string;
  marketCapitalization?: number; // millions
  name?: string;
  shareOutstanding?: number;
  ticker?: string;
  weburl?: string;
}

export interface FinnhubNewsItem {
  category: string;
  datetime: number; // unix seconds
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

// Subset of /stock/metric?metric=all we use
export interface FinnhubMetrics {
  '52WeekPriceReturnDaily'?: number; // percent
  peTTM?: number;
  peBasicExclExtraTTM?: number;
  currentDividendYieldTTM?: number;  // percent
  marketCapitalization?: number;     // millions
  [key: string]: unknown;
}

export class FinnhubRateLimitError extends Error {
  constructor() {
    super('Finnhub rate limit exceeded (429)');
  }
}

export class FinnhubClient {
  constructor(private apiKey: string) {}

  private async get<T>(path: string, params: Record<string, string>): Promise<T | null> {
    const url = `${FINNHUB_BASE_URL}${path}?${new URLSearchParams(params)}`;
    // Token goes in a header so it never shows up in logged URLs
    const response = await fetch(url, { headers: { 'X-Finnhub-Token': this.apiKey } });

    if (response.status === 429) {
      throw new FinnhubRateLimitError();
    }
    if (!response.ok) {
      console.error(`[finnhub] ${path} ${params.symbol ?? ''} failed: ${response.status} ${await response.text()}`);
      return null;
    }
    return await response.json() as T;
  }

  // Finnhub returns all zeros for unknown symbols, so treat a 0 price as no data
  async getQuote(symbol: string): Promise<FinnhubQuote | null> {
    const quote = await this.get<FinnhubQuote>('/quote', { symbol });
    return quote && quote.c > 0 ? quote : null;
  }

  async getMetrics(symbol: string): Promise<FinnhubMetrics | null> {
    const data = await this.get<{ metric?: FinnhubMetrics }>('/stock/metric', { symbol, metric: 'all' });
    return data?.metric ?? null;
  }

  async getProfile(symbol: string): Promise<FinnhubProfile | null> {
    const profile = await this.get<FinnhubProfile>('/stock/profile2', { symbol });
    return profile && profile.ticker ? profile : null;
  }

  async getCompanyNews(symbol: string, daysBack = 7): Promise<FinnhubNewsItem[]> {
    const to = new Date();
    const from = new Date(to.getTime() - daysBack * 24 * 60 * 60 * 1000);
    const news = await this.get<FinnhubNewsItem[]>('/company-news', {
      symbol,
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0],
    });
    return Array.isArray(news) ? news : [];
  }

  async getMarketNews(category = 'general'): Promise<FinnhubNewsItem[]> {
    const news = await this.get<FinnhubNewsItem[]>('/news', { category });
    return Array.isArray(news) ? news : [];
  }
}

// Formats a market cap given in millions (Finnhub's unit) like the existing "$260B" values
export function formatMarketCap(millions: number): string {
  if (millions >= 1_000_000) return `$${(millions / 1_000_000).toFixed(1)}T`;
  if (millions >= 1_000) return `$${Math.round(millions / 1_000)}B`;
  return `$${Math.round(millions)}M`;
}
