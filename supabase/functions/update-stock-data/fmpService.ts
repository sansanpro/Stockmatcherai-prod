// Financial Modeling Prep API Service
// Provides higher rate limits: 250 calls/day vs Alpha Vantage's 25 calls/day

interface FMPQuote {
  symbol: string;
  name: string;
  price: number;
  changesPercentage: number;
  change: number;
  dayLow: number;
  dayHigh: number;
  yearHigh: number;
  yearLow: number;
  marketCap: number;
  priceAvg50: number;
  priceAvg200: number;
  volume: number;
  avgVolume: number;
  exchange: string;
  open: number;
  previousClose: number;
  eps: number;
  pe: number;
  earningsAnnouncement: string;
  sharesOutstanding: number;
  timestamp: number;
}

interface FMPProfile {
  symbol: string;
  price: number;
  beta: number;
  volAvg: number;
  mktCap: number;
  lastDiv: number;
  range: string;
  changes: number;
  companyName: string;
  currency: string;
  cik: string;
  isin: string;
  cusip: string;
  exchange: string;
  exchangeShortName: string;
  industry: string;
  website: string;
  description: string;
  ceo: string;
  sector: string;
  country: string;
  fullTimeEmployees: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  dcfDiff: number;
  dcf: number;
  image: string;
  ipoDate: string;
  defaultImage: boolean;
  isEtf: boolean;
  isActivelyTrading: boolean;
  isAdr: boolean;
  isFund: boolean;
}

const FMP_BASE_URL = 'https://financialmodelingprep.com/stable';

export class FMPService {
  private apiKey: string;
  private cache = new Map<string, any>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async fetchWithCache(url: string, cacheKey: string) {
    // Check cache first
    const now = Date.now();
    if (this.cache.has(cacheKey) && this.cacheExpiry.get(cacheKey)! > now) {
      console.log(`Cache hit for ${cacheKey}`);
      return this.cache.get(cacheKey);
    }

    try {
      console.log(`Making FMP API call: ${url}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`FMP API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Handle rate limit responses
      if (data.error && data.error.includes('limit')) {
        console.log(`⚠️ FMP RATE LIMIT HIT: ${data.error}`);
        return null;
      }

      // Cache successful responses
      this.cache.set(cacheKey, data);
      this.cacheExpiry.set(cacheKey, now + this.CACHE_DURATION);

      return data;
    } catch (error) {
      console.error(`FMP API call failed for ${cacheKey}:`, error);
      throw error;
    }
  }

  async getQuote(symbol: string): Promise<any | null> {
    try {
      const url = `${FMP_BASE_URL}/quote?symbol=${symbol}&apikey=${this.apiKey}`;
      const data = await this.fetchWithCache(url, `quote_${symbol}`);
      
      if (!data || !Array.isArray(data) || data.length === 0) {
        console.log(`⚠️ NO QUOTE DATA for ${symbol} - FMP returned:`, data);
        return null;
      }

      const quote = data[0];
      console.log(`✅ FMP Quote for ${symbol}: $${quote.price} (${quote.changesPercentage}%)`);
      
      // Convert FMP format to a compatible format
      return {
        '01. symbol': quote.symbol,
        '02. open': quote.open?.toString() || '0',
        '03. high': quote.dayHigh?.toString() || '0',
        '04. low': quote.dayLow?.toString() || '0',
        '05. price': quote.price?.toString() || '0',
        '06. volume': quote.volume?.toString() || '0',
        '07. latest trading day': new Date().toISOString().split('T')[0],
        '08. previous close': quote.previousClose?.toString() || '0',
        '09. change': quote.change?.toString() || '0',
        '10. change percent': `${quote.changesPercentage || 0}%`
      };
    } catch (error) {
      console.error(`Failed to get FMP quote for ${symbol}:`, error);
      return null;
    }
  }

  async getCompanyProfile(symbol: string): Promise<any | null> {
    try {
      const url = `${FMP_BASE_URL}/profile?symbol=${symbol}&apikey=${this.apiKey}`;
      const data = await this.fetchWithCache(url, `profile_${symbol}`);
      
      if (!data || !Array.isArray(data) || data.length === 0) {
        console.log(`⚠️ NO PROFILE DATA for ${symbol} - FMP returned:`, data);
        return null;
      }

      const profile = data[0];
      console.log(`✅ FMP Profile for ${symbol}: ${profile.companyName} (${profile.sector})`);
      
      // Convert FMP format to a compatible format
      return {
        Symbol: profile.symbol,
        Name: profile.companyName,
        Description: profile.description,
        CIK: profile.cik,
        Exchange: profile.exchangeShortName,
        Currency: profile.currency,
        Country: profile.country,
        Sector: profile.sector,
        Industry: profile.industry,
        Address: profile.address,
        OfficialSite: profile.website,
        MarketCapitalization: profile.mktCap?.toString() || '0',
        EBITDA: 'N/A',
        PERatio: profile.beta?.toString() || 'N/A',
        PEGRatio: 'N/A',
        BookValue: 'N/A',
        DividendPerShare: profile.lastDiv?.toString() || '0',
        DividendYield: 'N/A',
        EPS: 'N/A',
        RevenuePerShareTTM: 'N/A',
        ProfitMargin: 'N/A',
        OperatingMarginTTM: 'N/A',
        ReturnOnAssetsTTM: 'N/A',
        ReturnOnEquityTTM: 'N/A',
        RevenueTTM: 'N/A',
        GrossProfitTTM: 'N/A',
        DilutedEPSTTM: 'N/A',
        QuarterlyEarningsGrowthYOY: 'N/A',
        QuarterlyRevenueGrowthYOY: 'N/A',
        AnalystTargetPrice: 'N/A',
        TrailingPE: 'N/A',
        ForwardPE: 'N/A',
        PriceToSalesRatioTTM: 'N/A',
        PriceToBookRatio: 'N/A',
        EVToRevenue: 'N/A',
        EVToEBITDA: 'N/A',
        Beta: profile.beta?.toString() || 'N/A',
        '52WeekHigh': 'N/A',
        '52WeekLow': 'N/A',
        '50DayMovingAverage': 'N/A',
        '200DayMovingAverage': 'N/A',
        SharesOutstanding: profile.mktCap && profile.price ? Math.round(profile.mktCap / profile.price).toString() : 'N/A',
        DividendDate: 'N/A',
        ExDividendDate: 'N/A'
      };
    } catch (error) {
      console.error(`Failed to get FMP profile for ${symbol}:`, error);
      return null;
    }
  }

  async getMultipleQuotes(symbols: string[]): Promise<Map<string, any>> {
    const quotes = new Map<string, any>();
    
    console.log(`Fetching quotes for ${symbols.length} symbols with rate limiting...`);
    
    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i];
      
      // Rate limiting: Increased to 5 seconds to avoid 429 errors on free tier
      if (i > 0) {
        console.log(`Rate limiting: waiting 5 seconds before quote ${i + 1}...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
      const quote = await this.getQuote(symbol);
      if (quote) {
        quotes.set(symbol, quote);
      }
    }
    
    return quotes;
  }

  async getMultipleProfiles(symbols: string[]): Promise<Map<string, any>> {
    const profiles = new Map<string, any>();
    
    console.log(`Fetching profiles for ${symbols.length} symbols with rate limiting...`);
    
    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i];
      
      // Rate limiting: Increased to 5 seconds to avoid 429 errors on free tier
      if (i > 0) {
        console.log(`Rate limiting: waiting 5 seconds before profile ${i + 1}...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
      const profile = await this.getCompanyProfile(symbol);
      if (profile) {
        profiles.set(symbol, profile);
      }
    }
    
    return profiles;
  }
}

export function createFMPService(apiKey: string): FMPService {
  return new FMPService(apiKey);
}