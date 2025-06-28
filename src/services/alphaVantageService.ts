
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
    const batchSize = 5; // Alpha Vantage free tier has rate limits
    
    console.log(`Fetching quotes for ${symbols.length} symbols in batches of ${batchSize}`);
    
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      const promises = batch.map(symbol => this.getQuote(symbol));
      
      try {
        const results = await Promise.all(promises);
        results.forEach((quote, index) => {
          if (quote) {
            quotes.set(batch[index], quote);
          }
        });
        
        console.log(`Processed batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(symbols.length/batchSize)} - ${quotes.size} successful quotes so far`);
        
        // Rate limiting - wait 1 second between batches for free tier
        if (i + batchSize < symbols.length) {
          await new Promise(resolve => setTimeout(resolve, 1200)); // Slightly longer delay for safety
        }
      } catch (error) {
        console.error(`Batch quote fetch error for batch starting at index ${i}:`, error);
      }
    }
    
    console.log(`Completed fetching quotes: ${quotes.size}/${symbols.length} successful`);
    return quotes;
  }

  async getMultipleOverviews(symbols: string[]): Promise<Map<string, AlphaVantageOverview>> {
    const overviews = new Map<string, AlphaVantageOverview>();
    const batchSize = 5;
    
    console.log(`Fetching overviews for ${symbols.length} symbols in batches of ${batchSize}`);
    
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      const promises = batch.map(symbol => this.getCompanyOverview(symbol));
      
      try {
        const results = await Promise.all(promises);
        results.forEach((overview, index) => {
          if (overview) {
            overviews.set(batch[index], overview);
          }
        });
        
        console.log(`Processed overview batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(symbols.length/batchSize)} - ${overviews.size} successful overviews so far`);
        
        // Rate limiting
        if (i + batchSize < symbols.length) {
          await new Promise(resolve => setTimeout(resolve, 1200));
        }
      } catch (error) {
        console.error(`Batch overview fetch error for batch starting at index ${i}:`, error);
      }
    }
    
    console.log(`Completed fetching overviews: ${overviews.size}/${symbols.length} successful`);
    return overviews;
  }
}

export const createAlphaVantageService = (apiKey: string) => {
  return new AlphaVantageService(apiKey);
};
