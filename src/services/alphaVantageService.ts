
interface AlphaVantageQuote {
  '01. symbol': string;
  '02. open': string;
  '03. high': string;
  '04. low': string;
  '05. price': string;
  '06. volume': string;
  '07. latest trading day': string;
  '08. previous close': string;
  '09. change': string;
  '10. change percent': string;
}

interface AlphaVantageOverview {
  Symbol: string;
  Name: string;
  Description: string;
  Sector: string;
  Industry: string;
  MarketCapitalization: string;
  PERatio: string;
  DividendYield: string;
  '52WeekHigh': string;
  '52WeekLow': string;
  Beta: string;
}

const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

export class AlphaVantageService {
  private apiKey: string;
  private cache: Map<string, any> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async fetchWithCache(url: string, cacheKey: string) {
    const now = Date.now();
    const cachedData = this.cache.get(cacheKey);
    const expiry = this.cacheExpiry.get(cacheKey);

    if (cachedData && expiry && now < expiry) {
      return cachedData;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Check for API error messages
      if (data['Error Message'] || data['Note']) {
        throw new Error(data['Error Message'] || data['Note']);
      }

      this.cache.set(cacheKey, data);
      this.cacheExpiry.set(cacheKey, now + this.CACHE_DURATION);
      
      return data;
    } catch (error) {
      console.error(`Alpha Vantage API error for ${cacheKey}:`, error);
      throw error;
    }
  }

  async getQuote(symbol: string): Promise<AlphaVantageQuote | null> {
    const url = `${ALPHA_VANTAGE_BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.apiKey}`;
    const cacheKey = `quote_${symbol}`;

    try {
      const data = await this.fetchWithCache(url, cacheKey);
      return data['Global Quote'] || null;
    } catch (error) {
      console.error(`Failed to get quote for ${symbol}:`, error);
      return null;
    }
  }

  async getCompanyOverview(symbol: string): Promise<AlphaVantageOverview | null> {
    const url = `${ALPHA_VANTAGE_BASE_URL}?function=OVERVIEW&symbol=${symbol}&apikey=${this.apiKey}`;
    const cacheKey = `overview_${symbol}`;

    try {
      const data = await this.fetchWithCache(url, cacheKey);
      return data.Symbol ? data : null;
    } catch (error) {
      console.error(`Failed to get overview for ${symbol}:`, error);
      return null;
    }
  }

  async getMultipleQuotes(symbols: string[]): Promise<Map<string, AlphaVantageQuote>> {
    const quotes = new Map<string, AlphaVantageQuote>();
    
    // Limit to 20 requests per day for free tier, leaving 5 for overviews
    const maxQuoteRequests = 20;
    const limitedSymbols = symbols.slice(0, maxQuoteRequests);
    
    console.log(`Fetching quotes for ${limitedSymbols.length} symbols (limited for free tier)`);
    
    for (const symbol of limitedSymbols) {
      try {
        const quote = await this.getQuote(symbol);
        if (quote) {
          quotes.set(symbol, quote);
        }
        
        // Increased delay to 15 seconds to respect free tier limits (25 requests/day)
        await new Promise(resolve => setTimeout(resolve, 15000));
      } catch (error) {
        console.error(`Quote fetch error for ${symbol}:`, error);
        // If we hit rate limit, stop trying
        if (error.message.includes('rate limit')) {
          console.log('Rate limit hit, stopping quote requests');
          break;
        }
      }
    }
    
    console.log(`Completed fetching quotes: ${quotes.size}/${limitedSymbols.length} successful`);
    return quotes;
  }

  async getMultipleOverviews(symbols: string[]): Promise<Map<string, AlphaVantageOverview>> {
    const overviews = new Map<string, AlphaVantageOverview>();
    
    // Only fetch overviews for symbols we got quotes for, limit to 5 for free tier
    const maxOverviewRequests = 5;
    const limitedSymbols = symbols.slice(0, maxOverviewRequests);
    
    console.log(`Fetching overviews for ${limitedSymbols.length} symbols (limited for free tier)`);
    
    for (const symbol of limitedSymbols) {
      try {
        const overview = await this.getCompanyOverview(symbol);
        if (overview) {
          overviews.set(symbol, overview);
        }
        
        // 15 second delay between overview requests
        await new Promise(resolve => setTimeout(resolve, 15000));
      } catch (error) {
        console.error(`Overview fetch error for ${symbol}:`, error);
        // If we hit rate limit, stop trying
        if (error.message.includes('rate limit')) {
          console.log('Rate limit hit, stopping overview requests');
          break;
        }
      }
    }
    
    console.log(`Completed fetching overviews: ${overviews.size}/${limitedSymbols.length} successful`);
    return overviews;
  }
}

export const createAlphaVantageService = (apiKey: string) => {
  return new AlphaVantageService(apiKey);
};
