// FMP (Financial Modeling Prep) Service for client-side data fetching
// Used for company information and market news

const FMP_BASE_URL = 'https://financialmodelingprep.com/stable';

export interface FMPCompanyProfile {
  symbol: string;
  companyName: string;
  description: string;
  ceo: string;
  sector: string;
  industry: string;
  country: string;
  fullTimeEmployees: string;
  website: string;
  mktCap: number;
  beta: number;
  lastDiv: number;
  ipoDate: string;
  exchange: string;
  image: string;
  city?: string;
  state?: string;
  address?: string;
}

export interface FMPNewsItem {
  title: string;
  text: string;
  publishedDate: string;
  site: string;
  url: string;
  symbol: string;
  image?: string;
}

export interface FMPMarketNews {
  title: string;
  text: string;
  publishedDate: string;
  site: string;
  url: string;
  image?: string;
}

// Cache for company data and news to reduce API calls
const companyCache = new Map<string, { data: FMPCompanyProfile; timestamp: number }>();
const newsCache = new Map<string, { data: FMPNewsItem[]; timestamp: number }>();
const marketNewsCache: { data: FMPMarketNews[]; timestamp: number } | null = null;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export class FMPClientService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getCompanyProfile(symbol: string): Promise<FMPCompanyProfile | null> {
    const cacheKey = symbol.toUpperCase();
    const cached = companyCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await fetch(
        `${FMP_BASE_URL}/profile?symbol=${symbol}&apikey=${this.apiKey}`
      );
      
      if (!response.ok) {
        console.error('FMP profile fetch failed:', response.status);
        return null;
      }
      
      const data = await response.json();
      if (!data || !Array.isArray(data) || data.length === 0) {
        return null;
      }

      const profile = data[0] as FMPCompanyProfile;
      companyCache.set(cacheKey, { data: profile, timestamp: Date.now() });
      return profile;
    } catch (error) {
      console.error('FMP profile error:', error);
      return null;
    }
  }

  async getCompanyNews(symbol: string, limit: number = 5): Promise<FMPNewsItem[]> {
    const cacheKey = symbol.toUpperCase();
    const cached = newsCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data.slice(0, limit);
    }

    try {
      const response = await fetch(
        `${FMP_BASE_URL}/stock-news?symbol=${symbol}&limit=${limit}&apikey=${this.apiKey}`
      );
      
      if (!response.ok) {
        console.error('FMP news fetch failed:', response.status);
        return [];
      }
      
      const data = await response.json();
      if (!data || !Array.isArray(data)) {
        return [];
      }

      const newsItems = data as FMPNewsItem[];
      newsCache.set(cacheKey, { data: newsItems, timestamp: Date.now() });
      return newsItems.slice(0, limit);
    } catch (error) {
      console.error('FMP news error:', error);
      return [];
    }
  }

  async getMarketNews(limit: number = 10): Promise<FMPMarketNews[]> {
    try {
      const response = await fetch(
        `${FMP_BASE_URL}/general-news?limit=${limit}&apikey=${this.apiKey}`
      );
      
      if (!response.ok) {
        console.error('FMP market news fetch failed:', response.status);
        return [];
      }
      
      const data = await response.json();
      if (!data || !Array.isArray(data)) {
        return [];
      }

      return data as FMPMarketNews[];
    } catch (error) {
      console.error('FMP market news error:', error);
      return [];
    }
  }

  // Extract key insights from company description for explanation generation
  extractCompanyInsights(profile: FMPCompanyProfile): {
    businessFocus: string;
    employeeScale: string;
    marketPosition: string;
    industryContext: string;
  } {
    const description = profile.description || '';
    
    // Extract first meaningful sentence as business focus
    const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const businessFocus = sentences[0]?.trim() || `${profile.companyName} operates in ${profile.industry}`;
    
    // Categorize employee count
    const employees = parseInt(profile.fullTimeEmployees || '0');
    let employeeScale = 'growing company';
    if (employees > 100000) employeeScale = 'global enterprise';
    else if (employees > 10000) employeeScale = 'large corporation';
    else if (employees > 1000) employeeScale = 'established company';
    else if (employees > 100) employeeScale = 'mid-sized company';
    
    // Market position based on market cap
    const mktCap = profile.mktCap || 0;
    let marketPosition = 'emerging player';
    if (mktCap > 200e9) marketPosition = 'industry leader';
    else if (mktCap > 50e9) marketPosition = 'major player';
    else if (mktCap > 10e9) marketPosition = 'significant player';
    
    // Industry context
    const industryContext = profile.industry 
      ? `the ${profile.industry.toLowerCase()} space`
      : profile.sector 
        ? `the ${profile.sector.toLowerCase()} sector`
        : 'the market';
    
    return {
      businessFocus: businessFocus.slice(0, 150), // Limit length
      employeeScale,
      marketPosition,
      industryContext,
    };
  }

  // Extract sentiment from recent news
  extractNewsSentiment(news: FMPNewsItem[]): {
    sentiment: 'positive' | 'neutral' | 'negative';
    latestHeadline: string;
    newsContext: string;
  } {
    if (!news || news.length === 0) {
      return {
        sentiment: 'neutral',
        latestHeadline: '',
        newsContext: 'in recent market activity',
      };
    }

    const latestNews = news[0];
    const latestHeadline = latestNews.title || '';
    
    // Simple sentiment analysis based on keywords
    const positiveWords = ['surge', 'gain', 'rise', 'beat', 'strong', 'growth', 'record', 'upgrade', 'buy', 'bullish', 'soar', 'rally'];
    const negativeWords = ['fall', 'drop', 'decline', 'miss', 'weak', 'cut', 'downgrade', 'sell', 'bearish', 'crash', 'plunge', 'loss'];
    
    const headlineLower = latestHeadline.toLowerCase();
    const positiveCount = positiveWords.filter(w => headlineLower.includes(w)).length;
    const negativeCount = negativeWords.filter(w => headlineLower.includes(w)).length;
    
    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (positiveCount > negativeCount) sentiment = 'positive';
    else if (negativeCount > positiveCount) sentiment = 'negative';
    
    // Create news context for explanations
    let newsContext = 'with recent market developments';
    if (sentiment === 'positive') {
      newsContext = 'amid positive news momentum';
    } else if (sentiment === 'negative') {
      newsContext = 'presenting potential value opportunity';
    }
    
    return {
      sentiment,
      latestHeadline: latestHeadline.slice(0, 100),
      newsContext,
    };
  }
}

// Factory function
export const createFMPClientService = (apiKey: string): FMPClientService => {
  return new FMPClientService(apiKey);
};
