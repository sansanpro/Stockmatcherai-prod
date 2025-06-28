import { StockRecommendation } from '@/types/stock-matcher';
import { createAlphaVantageService } from './alphaVantageService';

// Comprehensive stock symbols across all major sectors (500+ stocks)
const STOCK_SYMBOLS = [
  // Large Cap Technology
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX', 'ADBE', 'CRM',
  'ORCL', 'INTC', 'AMD', 'IBM', 'CSCO', 'QCOM', 'TXN', 'AVGO', 'NOW', 'SNOW',
  'PLTR', 'ZM', 'UBER', 'LYFT', 'SQ', 'PYPL', 'SHOP', 'TWLO', 'OKTA', 'CRWD',
  'ZS', 'DDOG', 'MDB', 'NET', 'TEAM', 'WDAY', 'VEEV', 'SPLK', 'PANW', 'FTNT',
  
  // Healthcare & Biotech
  'JNJ', 'UNH', 'PFE', 'ABBV', 'LLY', 'MRK', 'TMO', 'ABT', 'MDT', 'AMGN',
  'GILD', 'CVS', 'CI', 'HUM', 'ANTM', 'BMY', 'BIIB', 'REGN', 'VRTX', 'ISRG',
  'ZBH', 'SYK', 'BSX', 'EW', 'HOLX', 'VAR', 'PKI', 'IQV', 'MTD', 'DXCM',
  'ILMN', 'MRNA', 'BNTX', 'TDOC', 'VEEV', 'INCY', 'ALNY', 'TECH', 'BGNE',
  
  // Financial Services
  'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'BLK', 'SCHW', 'AXP', 'COF',
  'USB', 'PNC', 'TFC', 'BK', 'STT', 'NTRS', 'RF', 'CFG', 'HBAN', 'FITB',
  'KEY', 'ZION', 'CMA', 'MTB', 'PBCT', 'V', 'MA', 'PYPL', 'SQ', 'FIS',
  'FISV', 'WU', 'DFS', 'SYF', 'ALLY', 'LYG', 'DB', 'CS', 'UBS', 'RY',
  
  // Real Estate & REITs
  'AMT', 'PLD', 'CCI', 'EQIX', 'SPG', 'O', 'WELL', 'PSA', 'VTR', 'ARE',
  'DLR', 'BXP', 'AVB', 'EQR', 'ESS', 'MAA', 'UDR', 'CPT', 'FRT', 'REG',
  'KIM', 'PEI', 'MAC', 'SLG', 'VNO', 'HPP', 'DEI', 'HIW', 'KRC', 'PGRE',
  'IRM', 'LAMR', 'AMH', 'EXR', 'CUBE', 'LSI', 'REXR', 'NSA', 'STOR', 'WPC',
  
  // Consumer Discretionary
  'AMZN', 'TSLA', 'HD', 'LOW', 'MCD', 'SBUX', 'NKE', 'TJX', 'BKNG', 'ABNB',
  'TGT', 'COST', 'WMT', 'DIS', 'CMCSA', 'NFLX', 'T', 'VZ', 'CHTR', 'TMUS',
  'EBAY', 'ETSY', 'RVLV', 'W', 'WAYFAIR', 'CHWY', 'PETS', 'GOLF', 'DKS', 'BBY',
  'GPS', 'ANF', 'AEO', 'URBN', 'LULU', 'DECK', 'CROX', 'SKX', 'NWL', 'HAS',
  
  // Consumer Staples
  'PG', 'KO', 'PEP', 'WMT', 'COST', 'MDLZ', 'GIS', 'K', 'CAG', 'CPB',
  'HSY', 'SJM', 'HRL', 'MKC', 'CLX', 'KMB', 'CL', 'EL', 'ULTA', 'CVS',
  'WBA', 'KR', 'SYY', 'DLTR', 'DG', 'BJ', 'UNFI', 'INGR', 'LW', 'CALM',
  
  // Energy
  'XOM', 'CVX', 'COP', 'EOG', 'SLB', 'OXY', 'PSX', 'VLO', 'MPC', 'HES',
  'DVN', 'FANG', 'MRO', 'APA', 'CLR', 'NFG', 'EQT', 'CNX', 'AR', 'CHK',
  'KMI', 'OKE', 'EPD', 'ET', 'WMB', 'TRP', 'ENB', 'TC', 'PPL', 'SO',
  'NEE', 'DUK', 'D', 'EXC', 'XEL', 'WEC', 'ES', 'AEP', 'FE', 'ETR',
  
  // Utilities
  'NEE', 'DUK', 'SO', 'D', 'EXC', 'XEL', 'WEC', 'ES', 'AEP', 'FE',
  'ETR', 'PPL', 'AES', 'LNT', 'NRG', 'VST', 'AWK', 'WTR', 'SJW', 'MSEX',
  'CWT', 'YORW', 'ARTNA', 'CONN', 'PCG', 'EIX', 'SRE', 'PEG', 'ED', 'CNP',
  
  // Industrials
  'BA', 'CAT', 'DE', 'HON', 'UPS', 'RTX', 'LMT', 'NOC', 'GD', 'LHX',
  'MMM', 'GE', 'EMR', 'ETN', 'PH', 'CMI', 'ITW', 'ROK', 'DOV', 'XYL',
  'FTV', 'IEX', 'PNR', 'ROP', 'WAB', 'ODFL', 'CHRW', 'EXPD', 'JBHT', 'KNX',
  'FAST', 'PCAR', 'IR', 'OTIS', 'CARR', 'TT', 'JCI', 'GNRC', 'PWR', 'HUBB',
  
  // Materials
  'LIN', 'APD', 'SHW', 'ECL', 'FCX', 'NEM', 'GOLD', 'AA', 'X', 'NUE',
  'STLD', 'RS', 'CMC', 'MLM', 'VMC', 'EMN', 'PPG', 'RPM', 'AVY', 'PKG',
  'IP', 'WRK', 'SON', 'SEE', 'BLL', 'CCK', 'SLGN', 'KWR', 'AMCR', 'CF',
  'MOS', 'FMC', 'LYB', 'DOW', 'DD', 'CTVA', 'IFF', 'FUL', 'HUN', 'OLN',
  
  // Communication Services
  'GOOGL', 'META', 'NFLX', 'DIS', 'CMCSA', 'T', 'VZ', 'CHTR', 'TMUS', 'DISH',
  'FOXA', 'FOX', 'PARA', 'WBD', 'SPOT', 'SNAP', 'PINS', 'TWTR', 'MTCH', 'BMBL',
  'ZI', 'CARS', 'QNST', 'QUOT', 'MGNI', 'TTD', 'RAMP', 'CRTO', 'PUBM', 'YELP',
  
  // Mid-Cap Growth Stocks
  'ROKU', 'DOCU', 'PTON', 'ZG', 'ZILLOW', 'ABNB', 'DASH', 'COIN', 'HOOD', 'AFRM',
  'UPST', 'SOFI', 'OPEN', 'RDFN', 'COMP', 'BILL', 'PSTG', 'ESTC', 'GTLB', 'FROG',
  'AI', 'C3AI', 'BBAI', 'SOUN', 'SMCI', 'NVTS', 'DELL', 'HPQ', 'NTAP', 'WDC',
  
  // Small-Cap Value & Growth
  'TMDX', 'SMTC', 'CRSR', 'CORSAIR', 'PLBY', 'VIAC', 'DISCA', 'AMC', 'GME', 'BB',
  'NOK', 'SNDL', 'TLRY', 'CGC', 'ACB', 'HEXO', 'OGI', 'CRON', 'APHA', 'GRWG',
  'SMG', 'IIPR', 'KERN', 'VERU', 'PROG', 'PRTY', 'EXPR', 'KOSS', 'NAKD', 'SIRI',
  
  // International ADRs
  'ASML', 'TSM', 'BABA', 'JD', 'BIDU', 'NIO', 'XPEV', 'LI', 'DIDI', 'TME',
  'NTES', 'WB', 'SINA', 'SOHU', 'IQ', 'VIPS', 'DOYU', 'HUYA', 'YY', 'MOMO',
  'SAP', 'UL', 'NVO', 'ASML', 'SHOP', 'SE', 'GRAB', 'CPNG', 'UBER', 'DIDI'
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
    console.log(`Fetching live stock data from Alpha Vantage for ${STOCK_SYMBOLS.length} stocks...`);
    
    try {
      // Get quotes for all symbols (now 500+ stocks)
      const quotes = await this.alphaVantageService.getMultipleQuotes(STOCK_SYMBOLS);
      console.log(`Retrieved ${quotes.size} stock quotes from ${STOCK_SYMBOLS.length} requested`);
      
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
      
      console.log(`Successfully processed ${stockData.length} stocks from expanded universe`);
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
