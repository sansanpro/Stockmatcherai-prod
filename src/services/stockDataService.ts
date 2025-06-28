
import { StockRecommendation } from '@/types/stock-matcher';
import { createAlphaVantageService } from './alphaVantageService';

// Popular stocks to fetch data for
const STOCK_SYMBOLS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX',
  'JNJ', 'UNH', 'PFE', 'ABBV', 'LLY', 'MRK', 'TMO',
  'JPM', 'BAC', 'WFC', 'GS', 'MS', 'V', 'MA', 'PYPL',
  'KO', 'PEP', 'WMT', 'HD', 'TGT', 'COST', 'LOW',
  'XOM', 'CVX', 'COP', 'EOG', 'SLB',
  'VZ', 'T', 'NEE', 'DUK', 'SO',
  'ADBE', 'CRM', 'ORCL', 'INTC', 'AMD', 'IBM',
  'UBER', 'LYFT', 'SPOT', 'SNAP', 'ZM', 'SQ'
];

// CEO data mapping (since Alpha Vantage doesn't provide CEO info)
const CEO_DATA: Record<string, { name: string; highlights: string }> = {
  'AAPL': {
    name: 'Tim Cook',
    highlights: 'Led Apple through its most profitable era with services expansion and iPhone evolution. 13+ years as CEO with consistent innovation and market leadership.'
  },
  'MSFT': {
    name: 'Satya Nadella',
    highlights: 'Transformed Microsoft into cloud computing leader. Increased market cap by 5x since becoming CEO in 2014. Strong focus on AI and enterprise solutions.'
  },
  'GOOGL': {
    name: 'Sundar Pichai',
    highlights: 'Leading Google through AI revolution and cloud expansion. Former product management executive who became CEO in 2015, driving innovation in search and AI.'
  },
  'AMZN': {
    name: 'Andy Jassy',
    highlights: 'Former AWS CEO leading Amazon\'s continued expansion in cloud services and e-commerce. 24+ years with company, architect of AWS business model.'
  },
  'TSLA': {
    name: 'Elon Musk',
    highlights: 'Revolutionized electric vehicle industry and autonomous driving. Built Tesla into most valuable automaker globally with expansion into energy storage.'
  },
  'NVDA': {
    name: 'Jensen Huang',
    highlights: 'Pioneered GPU computing and AI revolution. Led NVIDIA to become most valuable semiconductor company with breakthrough innovations in machine learning.'
  },
  'META': {
    name: 'Mark Zuckerberg',
    highlights: 'Co-founder leading Meta through metaverse transformation and AI development. Focus on virtual reality and next-generation social platforms.'
  },
  // Add more CEO data as needed
};

const getRiskLevel = (beta: number | null, volatility: number): 'low' | 'medium' | 'high' => {
  if (beta === null) {
    return volatility > 20 ? 'high' : volatility > 10 ? 'medium' : 'low';
  }
  
  if (beta > 1.5) return 'high';
  if (beta > 1.0) return 'medium';
  return 'low';
};

const calculateOneYearReturn = (currentPrice: number, previousClose: number): number => {
  return ((currentPrice - previousClose) / previousClose) * 100;
};

export class StockDataService {
  private alphaVantageService: any;

  constructor(apiKey: string) {
    this.alphaVantageService = createAlphaVantageService(apiKey);
  }

  async getStockData(): Promise<Omit<StockRecommendation, 'whyItFits'>[]> {
    console.log('Fetching live stock data from Alpha Vantage...');
    
    try {
      // Get quotes for all symbols
      const quotes = await this.alphaVantageService.getMultipleQuotes(STOCK_SYMBOLS);
      console.log(`Retrieved ${quotes.size} stock quotes`);
      
      // Get company overviews for detailed information
      const overviews = await this.alphaVantageService.getMultipleOverviews(STOCK_SYMBOLS);
      console.log(`Retrieved ${overviews.size} company overviews`);
      
      const stockData: Omit<StockRecommendation, 'whyItFits'>[] = [];
      
      for (const symbol of STOCK_SYMBOLS) {
        const quote = quotes.get(symbol);
        const overview = overviews.get(symbol);
        
        if (quote && overview) {
          try {
            const currentPrice = parseFloat(quote['05. price']);
            const previousClose = parseFloat(quote['08. previous close']);
            const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));
            
            const peRatio = overview.PERatio === 'None' ? 0 : parseFloat(overview.PERatio) || 0;
            const dividendYield = overview.DividendYield === 'None' ? 0 : parseFloat(overview.DividendYield) * 100 || 0;
            const beta = overview.Beta === 'None' ? null : parseFloat(overview.Beta);
            
            const riskLevel = getRiskLevel(beta, Math.abs(changePercent));
            
            const stock: Omit<StockRecommendation, 'whyItFits'> = {
              id: symbol,
              companyName: overview.Name,
              ticker: symbol,
              sector: overview.Sector || 'Technology',
              ceoName: CEO_DATA[symbol]?.name || 'Leadership Team',
              ceoHighlights: CEO_DATA[symbol]?.highlights || 'Experienced leadership driving company growth and innovation.',
              peRatio: peRatio,
              marketCap: this.formatMarketCap(overview.MarketCapitalization),
              oneYearReturn: changePercent, // Using daily change as approximation
              riskLevel: riskLevel,
              pricePerShare: currentPrice,
              dividendYield: dividendYield,
              esgScore: this.getDefaultESGScore(symbol)
            };
            
            stockData.push(stock);
          } catch (error) {
            console.error(`Error processing data for ${symbol}:`, error);
          }
        }
      }
      
      console.log(`Successfully processed ${stockData.length} stocks`);
      return stockData;
      
    } catch (error) {
      console.error('Error fetching stock data:', error);
      throw new Error('Failed to fetch stock data from Alpha Vantage');
    }
  }

  private formatMarketCap(marketCap: string): string {
    const value = parseFloat(marketCap);
    if (isNaN(value)) return 'N/A';
    
    if (value >= 1e12) {
      return `$${(value / 1e12).toFixed(1)}T`;
    } else if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(1)}B`;
    } else if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(1)}M`;
    }
    return `$${value.toFixed(0)}`;
  }

  private getDefaultESGScore(symbol: string): number {
    // Default ESG scores for common stocks (in a real app, you'd get this from a dedicated ESG API)
    const esgScores: Record<string, number> = {
      'AAPL': 82, 'MSFT': 85, 'GOOGL': 79, 'AMZN': 74, 'TSLA': 72,
      'JNJ': 78, 'UNH': 81, 'PFE': 76, 'KO': 80, 'PEP': 82,
      'JPM': 75, 'V': 83, 'MA': 84, 'WMT': 77, 'HD': 79
    };
    return esgScores[symbol] || 70;
  }
}

export const createStockDataService = (apiKey: string) => {
  return new StockDataService(apiKey);
};
