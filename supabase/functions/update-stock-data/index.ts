import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Alpha Vantage service implementation
class AlphaVantageService {
  private apiKey: string;
  private baseUrl = 'https://www.alphavantage.co/query';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getQuote(symbol: string) {
    try {
      const url = `${this.baseUrl}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      
      // Handle rate limit errors - log and return null instead of throwing
      if (data['Note'] && data['Note'].includes('API call frequency')) {
        console.log(`Rate limit hit for ${symbol}, skipping this call...`);
        return null;
      }
      
      if (data['Error Message']) {
        console.log(`API error for ${symbol}: ${data['Error Message']}`);
        return null;
      }
      
      return data['Global Quote'] || null;
    } catch (error) {
      console.error(`Network error for ${symbol}:`, error);
      return null;
    }
  }

  async getCompanyOverview(symbol: string) {
    try {
      const url = `${this.baseUrl}?function=OVERVIEW&symbol=${symbol}&apikey=${this.apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data['Error Message'] || data['Note']) {
        throw new Error(data['Error Message'] || data['Note']);
      }
      
      return data.Symbol ? data : null;
    } catch (error) {
      console.error(`Failed to get overview for ${symbol}:`, error);
      return null;
    }
  }
}

// Comprehensive stock symbols for expansion (500+ stocks across sectors)
const STOCK_EXPANSION_SYMBOLS = [
  // Large Cap Technology
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX', 'ADBE', 'CRM',
  'ORCL', 'INTC', 'AMD', 'IBM', 'CSCO', 'QCOM', 'TXN', 'AVGO', 'NOW', 'SNOW',
  'PLTR', 'ZM', 'UBER', 'LYFT', 'SQ', 'PYPL', 'SHOP', 'TWLO', 'OKTA', 'CRWD',
  'ZS', 'DDOG', 'MDB', 'NET', 'TEAM', 'WDAY', 'VEEV', 'SPLK', 'PANW', 'FTNT',
  
  // Healthcare & Biotech
  'JNJ', 'UNH', 'PFE', 'ABBV', 'LLY', 'MRK', 'TMO', 'ABT', 'MDT', 'AMGN',
  'GILD', 'CVS', 'CI', 'HUM', 'ANTM', 'BMY', 'BIIB', 'REGN', 'VRTX', 'ISRG',
  'ZBH', 'SYK', 'BSX', 'EW', 'HOLX', 'VAR', 'PKI', 'IQV', 'MTD', 'DXCM',
  
  // Financial Services
  'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'BLK', 'SCHW', 'AXP', 'COF',
  'USB', 'PNC', 'TFC', 'BK', 'STT', 'NTRS', 'RF', 'CFG', 'HBAN', 'FITB',
  'V', 'MA', 'PYPL', 'SQ', 'FIS', 'FISV', 'DFS', 'SYF', 'ALLY',
  
  // Consumer Discretionary & Staples
  'HD', 'LOW', 'MCD', 'SBUX', 'NKE', 'TJX', 'BKNG', 'ABNB', 'TGT', 'COST',
  'WMT', 'DIS', 'PG', 'KO', 'PEP', 'MDLZ', 'GIS', 'K', 'CAG', 'HSY',
  
  // Energy
  'XOM', 'CVX', 'COP', 'EOG', 'SLB', 'OXY', 'PSX', 'VLO', 'MPC', 'HES',
  'DVN', 'FANG', 'MRO', 'APA', 'CLR', 'KMI', 'OKE', 'EPD', 'ET', 'WMB',
  
  // Utilities
  'NEE', 'DUK', 'SO', 'D', 'EXC', 'XEL', 'WEC', 'ES', 'AEP', 'FE',
  'ETR', 'PPL', 'AES', 'LNT', 'NRG', 'VST', 'AWK', 'WTR'
];

// Priority stocks that get updated more frequently
const PRIORITY_STOCKS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX',
  'JPM', 'BAC', 'WFC', 'GS', 'JNJ', 'PFE', 'UNH', 'ABBV'
];

// CEO data mapping
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
  }
};

// Sector update schedule (staggered throughout the day)
const SECTOR_SCHEDULE = {
  'technology': { hour: 9, minute: 30 },    // Market open
  'healthcare': { hour: 10, minute: 15 },
  'finance': { hour: 11, minute: 0 },
  'energy': { hour: 13, minute: 30 },       // After lunch
  'consumer': { hour: 14, minute: 15 },
  'utilities': { hour: 15, minute: 0 }      // Before market close
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Stock data update function called');

  // Background task function that handles the actual stock updates
  async function performStockUpdate() {
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const alphaVantageKey = Deno.env.get('ALPHA_VANTAGE_API_KEY');

      if (!alphaVantageKey) {
        throw new Error('Alpha Vantage API key not configured');
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const alphaVantage = new AlphaVantageService(alphaVantageKey);

      const requestBody = await req.json().catch(() => ({}));
      const { sector, updateType = 'scheduled', priority = false, expand = false, smartScheduling = false } = requestBody;
      
      console.log(`Background update started - Sector: ${sector}, UpdateType: ${updateType}, Priority: ${priority}, SmartScheduling: ${smartScheduling}`);
      
      let targetSector = sector;
      let sectorsToUpdate: string[] = [];
    
    // Smart scheduling: check all sectors for stale data (12+ hours old) and update ALL stale sectors
    if (smartScheduling) {
      const sectors = ['technology', 'healthcare', 'finance', 'energy', 'consumer', 'utilities'];
      
      console.log('Running smart scheduler - checking data age for all sectors...');
      
      for (const sectorName of sectors) {
        try {
          const tableName = `${sectorName}_stocks`;
          
          // Count stocks that need updating (older than 12 hours)
          const { data: staleStocks, error } = await supabase
            .from(tableName)
            .select('ticker, last_updated')
            .lt('last_updated', new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString());

          if (error) {
            console.error(`Error checking ${sectorName} sector:`, error);
            continue;
          }

          const staleCount = staleStocks?.length || 0;
          const needsUpdate = staleCount > 0;

          console.log(`${sectorName.toUpperCase()}: ${staleCount} stocks older than 12h, needs update: ${needsUpdate}`);

          if (needsUpdate) {
            sectorsToUpdate.push(sectorName);
          }
        } catch (error) {
          console.error(`Error processing ${sectorName}:`, error);
        }
      }
      
      if (sectorsToUpdate.length === 0) {
        return new Response(JSON.stringify({ 
          success: true,
          message: 'All sectors have fresh data (< 12 hours old)',
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      console.log(`Smart scheduler found ${sectorsToUpdate.length} sectors needing updates: ${sectorsToUpdate.join(', ')}`);
      // Process ALL sectors that need updating
      targetSector = 'all_stale_sectors';
    }
    
    // If no sector specified and not smart scheduling, determine based on schedule
    if (!targetSector && !smartScheduling) {
      const currentHour = new Date().getHours();
      const currentMinute = new Date().getMinutes();
      
      // Check if it's market hours (9:30 AM to 4:00 PM ET)
      const isMarketHours = (currentHour >= 9 && currentHour < 16) || 
                           (currentHour === 9 && currentMinute >= 30);
      
      if (!isMarketHours) {
        return new Response(JSON.stringify({ 
          message: 'Outside market hours, skipping update',
          marketHours: '9:30 AM - 4:00 PM ET'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Find the next sector to update based on schedule
      for (const [sectorName, schedule] of Object.entries(SECTOR_SCHEDULE)) {
        const scheduleTime = schedule.hour * 60 + schedule.minute;
        const currentTime = currentHour * 60 + currentMinute;
        
        // Update if we're within 15 minutes of the scheduled time
        if (Math.abs(currentTime - scheduleTime) <= 15) {
          targetSector = sectorName;
          break;
        }
      }
      
      if (!targetSector) {
        targetSector = 'technology'; // Default fallback
      }
    }

    console.log(`Starting ${updateType} update for ${targetSector}`);

    // Handle multi-sector updates when using smart scheduling
    if (targetSector === 'all_stale_sectors' && sectorsToUpdate.length > 0) {
      console.log(`Processing ${sectorsToUpdate.length} stale sectors: ${sectorsToUpdate.join(', ')}`);
      
      // Create update log entry for multi-sector update
      const { data: logEntry } = await supabase
        .from('stock_update_logs')
        .insert({
          sector: sectorsToUpdate.join(', '),
          update_type: updateType,
          status: 'running'
        })
        .select()
        .single();

      const logId = logEntry?.id;
      let totalUpdated = 0;
      let totalFailed = 0;
      let totalApiCalls = 0;

      // Process each stale sector
      for (const sectorName of sectorsToUpdate) {
        console.log(`\n--- Processing ${sectorName.toUpperCase()} sector ---`);
        
        const tableName = `${sectorName}_stocks`;
        
        // Get ONLY stocks that need updating (older than 12 hours)
        const { data: sectorStocks, error: fetchError } = await supabase
          .from(tableName)
          .select('ticker, last_updated')
          .lt('last_updated', new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString())
          .order('last_updated', { ascending: true });

        if (fetchError) {
          console.error(`Failed to fetch ${sectorName} stocks:`, fetchError);
          continue;
        }

        // Update ONLY stocks that are stale (12+ hours old)
        const stocksToUpdate = sectorStocks || [];
        console.log(`Updating ${stocksToUpdate.length} stale stocks (>12h old) in ${sectorName} sector`);

        let sectorUpdated = 0;
        let sectorFailed = 0;

        // Update stocks with proper rate limiting - wait BEFORE each API call
        for (let i = 0; i < stocksToUpdate.length; i++) {
          const stock = stocksToUpdate[i];
          
          try {
            // CRITICAL: Rate limit BEFORE making API call 
            // Alpha Vantage free tier: 5 calls per minute = 12+ second intervals
            if (totalApiCalls > 0) {
              console.log(`Rate limiting: waiting 13 seconds before API call ${totalApiCalls + 1}...`);
              await new Promise(resolve => setTimeout(resolve, 13000));
            }
            
            console.log(`Updating ${stock.ticker} (${i + 1}/${stocksToUpdate.length})...`);
            const quote = await alphaVantage.getQuote(stock.ticker);
            totalApiCalls++;
            
            if (quote) {
              const currentPrice = parseFloat(quote['05. price']);
              const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));
              
              const { error: updateError } = await supabase
                .from(tableName)
                .update({
                  price_per_share: currentPrice,
                  one_year_return: changePercent,
                  last_updated: new Date().toISOString()
                })
                .eq('ticker', stock.ticker);

              if (updateError) {
                console.error(`Failed to update ${stock.ticker}:`, updateError);
                sectorFailed++;
              } else {
                sectorUpdated++;
                console.log(`Updated ${stock.ticker}: $${currentPrice} (${changePercent}%)`);
              }
            } else {
              console.log(`No quote data received for ${stock.ticker}`);
              sectorFailed++;
            }

          } catch (error) {
            console.error(`Error updating ${stock.ticker}:`, error);
            sectorFailed++;
          }
        }
        
        totalUpdated += sectorUpdated;
        totalFailed += sectorFailed;
        console.log(`${sectorName.toUpperCase()} complete: ${sectorUpdated} updated, ${sectorFailed} failed`);
      }

      // Update log entry with totals
      if (logId) {
        await supabase
          .from('stock_update_logs')
          .update({
            stocks_updated: totalUpdated,
            stocks_failed: totalFailed,
            api_calls_used: totalApiCalls,
            completed_at: new Date().toISOString(),
            status: totalFailed > totalUpdated ? 'partial' : 'completed'
          })
          .eq('id', logId);
      }

      const response = {
        success: true,
        sector: `${sectorsToUpdate.length} sectors: ${sectorsToUpdate.join(', ')}`,
        updateType,
        priority: false,
        stocksUpdated: totalUpdated,
        stocksFailed: totalFailed,
        apiCallsUsed: totalApiCalls,
        message: `Smart update complete: ${totalUpdated} stocks updated across ${sectorsToUpdate.length} sectors`
      };

      console.log('Background multi-sector update completed:', response);
      return;
    }

    // Single sector update logic (existing behavior)
    // Check if we should expand the database first
    const shouldAutoExpand = await checkIfExpansionNeeded(supabase, targetSector);
    
    if (expand || shouldAutoExpand) {
      console.log(`Background expansion for ${targetSector} database started`);
      await expandSectorDatabase(supabase, alphaVantage, targetSector);
      console.log(`Background expansion for ${targetSector} database completed`);
    }

    // Create update log entry
    const { data: logEntry } = await supabase
      .from('stock_update_logs')
      .insert({
        sector: targetSector,
        update_type: expand || shouldAutoExpand ? 'expansion' : updateType,
        status: 'running'
      })
      .select()
      .single();

    const logId = logEntry?.id;

    // Get stocks from the target sector
    const tableName = `${targetSector}_stocks`;
    const { data: stocks, error: fetchError } = await supabase
      .from(tableName)
      .select('ticker, last_updated')
      .order('last_updated', { ascending: true });

    if (fetchError) {
      throw new Error(`Failed to fetch stocks: ${fetchError.message}`);
    }

    // Filter stocks for priority updates
    let stocksToUpdate = stocks || [];
    
    if (priority) {
      stocksToUpdate = stocksToUpdate.filter(stock => 
        PRIORITY_STOCKS.includes(stock.ticker)
      );
    }

    // Limit number of stocks to update based on API limits and timeout constraints
    const maxStocks = priority ? 5 : 8; // Reduced to prevent timeouts
    stocksToUpdate = stocksToUpdate.slice(0, maxStocks);

    console.log(`Background update: Processing ${stocksToUpdate.length} stocks from ${targetSector} sector`);

    let updatedCount = 0;
    let failedCount = 0;
    let apiCallsUsed = 0;

    // Update stocks with proper rate limiting
    for (let i = 0; i < stocksToUpdate.length; i++) {
      const stock = stocksToUpdate[i];
      
      try {
        // Rate limit BEFORE making API call
        if (apiCallsUsed > 0) {
          console.log(`Background rate limiting: waiting 13 seconds before API call ${apiCallsUsed + 1}...`);
          await new Promise(resolve => setTimeout(resolve, 13000));
        }
        
        console.log(`Background updating ${stock.ticker} (${i + 1}/${stocksToUpdate.length})...`);
        const quote = await alphaVantage.getQuote(stock.ticker);
        apiCallsUsed++;
        
        if (quote) {
          const currentPrice = parseFloat(quote['05. price']);
          const previousClose = parseFloat(quote['08. previous close']);
          const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));
          
          // Update stock data
          const { error: updateError } = await supabase
            .from(tableName)
            .update({
              price_per_share: currentPrice,
              one_year_return: changePercent,
              last_updated: new Date().toISOString()
            })
            .eq('ticker', stock.ticker);

          if (updateError) {
            console.error(`Background failed to update ${stock.ticker}:`, updateError);
            failedCount++;
          } else {
            updatedCount++;
            console.log(`Background updated ${stock.ticker}: $${currentPrice} (${changePercent}%)`);
          }
        } else {
          console.log(`Background: No quote data received for ${stock.ticker} (likely rate limited or API error)`);
          failedCount++;
        }

      } catch (error) {
        console.error(`Background error updating ${stock.ticker}:`, error);
        failedCount++;
      }
    }

    // Update log entry
    if (logId) {
      await supabase
        .from('stock_update_logs')
        .update({
          stocks_updated: updatedCount,
          stocks_failed: failedCount,
          api_calls_used: apiCallsUsed,
          completed_at: new Date().toISOString(),
          status: failedCount > updatedCount ? 'partial' : 'completed'
        })
        .eq('id', logId);
    }

    console.log(`Background update completed for ${targetSector}: ${updatedCount} updated, ${failedCount} failed, ${apiCallsUsed} API calls`);

    } catch (error) {
      console.error('Background stock update error:', error);
    }
  }

  try {
    // Parse request data for response
    const { sector, updateType = 'scheduled' } = await req.json().catch(() => ({}));
    
    // Start the background task without waiting for it
    EdgeRuntime.waitUntil(performStockUpdate());

    // Return immediate response to avoid timeout
    return new Response(JSON.stringify({
      success: true,
      message: sector 
        ? `Stock update for ${sector} sector started in background`
        : 'Smart stock update started in background (processing most stale sector)',
      status: 'processing'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Error starting stock update function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

// Helper function to check if database expansion is needed
async function checkIfExpansionNeeded(supabase: any, sector: string): Promise<boolean> {
  try {
    const tableName = `${sector}_stocks`;
    const { count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    // Each sector should have at least 50 stocks for good variety
    const threshold = 50;
    return (count || 0) < threshold;
  } catch (error) {
    console.error('Error checking expansion need:', error);
    return false;
  }
}

// Helper function to expand sector database with new stocks
async function expandSectorDatabase(supabase: any, alphaVantage: AlphaVantageService, sector: string): Promise<void> {
  try {
    const tableName = `${sector}_stocks`;
    
    // Get existing tickers to avoid duplicates
    const { data: existingStocks } = await supabase
      .from(tableName)
      .select('ticker');
    
    const existingTickers = new Set(existingStocks?.map((s: any) => s.ticker) || []);
    
    // Filter symbols for this sector and exclude existing ones
    const sectorSymbols = getSectorSymbols(sector)
      .filter(symbol => !existingTickers.has(symbol))
      .slice(0, 25); // Reduced to 25 to prevent timeouts
    
    console.log(`Adding ${sectorSymbols.length} new stocks to ${sector} sector`);
    
    let addedCount = 0;
    let apiCalls = 0;
    
    for (const symbol of sectorSymbols) {
      try {
        // Get quote and overview data
        const [quote, overview] = await Promise.all([
          alphaVantage.getQuote(symbol),
          alphaVantage.getCompanyOverview(symbol)
        ]);
        
        apiCalls += 2;
        
        if (quote && overview && overview.Name) {
          // Validate that this stock belongs to the target sector
          const isCorrectSector = validateSectorMatch(sector, overview.Sector, overview.Industry);
          
          if (!isCorrectSector) {
            console.log(`Skipping ${symbol} - doesn't match ${sector} sector (API Sector: ${overview.Sector}, Industry: ${overview.Industry})`);
            continue;
          }
          
          const currentPrice = parseFloat(quote['05. price']) || 100;
          const changePercent = parseFloat(quote['10. change percent']?.replace('%', '')) || 0;
          const peRatio = overview.PERatio === 'None' ? 0 : parseFloat(overview.PERatio) || 20;
          const dividendYield = overview.DividendYield === 'None' ? 0 : parseFloat(overview.DividendYield) * 100 || 0;
          const beta = overview.Beta === 'None' ? null : parseFloat(overview.Beta);
          
          const riskLevel = getRiskLevel(beta, Math.abs(changePercent));
          
          const stockData = {
            id: symbol,
            ticker: symbol,
            company_name: overview.Name,
            ceo_name: CEO_DATA[symbol]?.name || 'Leadership Team',
            ceo_highlights: CEO_DATA[symbol]?.highlights || 'Experienced leadership driving company growth and innovation.',
            pe_ratio: peRatio,
            market_cap: formatMarketCap(overview.MarketCapitalization),
            one_year_return: changePercent,
            risk_level: riskLevel,
            price_per_share: currentPrice,
            dividend_yield: dividendYield,
            esg_score: getDefaultESGScore(symbol)
          };
          
          const { error } = await supabase
            .from(tableName)
            .insert(stockData);
          
          if (!error) {
            addedCount++;
            console.log(`Added new stock: ${symbol} - ${overview.Name} (${overview.Sector})`);
          } else {
            console.error(`Failed to insert ${symbol}:`, error);
          }
        }
        
        // Rate limiting: 3 seconds between API calls for faster processing
        if (apiCalls < sectorSymbols.length * 2) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
      } catch (error) {
        console.error(`Error adding ${symbol}:`, error);
      }
    }
    
    console.log(`Successfully added ${addedCount} new stocks to ${sector} sector`);
    
  } catch (error) {
    console.error('Error in expandSectorDatabase:', error);
  }
}

// Helper function to get symbols for a specific sector
function getSectorSymbols(sector: string): string[] {
  const sectorMap: Record<string, string[]> = {
    'technology': [
      // Major Tech Companies
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'NFLX', 'ADBE', 'CRM',
      'ORCL', 'INTC', 'AMD', 'IBM', 'CSCO', 'QCOM', 'TXN', 'AVGO', 'NOW', 'SNOW',
      'PLTR', 'ZM', 'UBER', 'LYFT', 'SHOP', 'TWLO', 'OKTA', 'CRWD', 'ZS', 'DDOG',
      'MDB', 'NET', 'TEAM', 'WDAY', 'VEEV', 'PANW', 'FTNT', 'SPLK', 'DOCU', 'ZOOM'
    ],
    'healthcare': [
      // Healthcare & Biotech Companies
      'JNJ', 'UNH', 'PFE', 'ABBV', 'LLY', 'MRK', 'TMO', 'ABT', 'MDT', 'AMGN',
      'GILD', 'CVS', 'CI', 'HUM', 'BMY', 'BIIB', 'REGN', 'VRTX', 'ISRG', 'ZBH',
      'SYK', 'BSX', 'EW', 'HOLX', 'IQV', 'MTD', 'DXCM', 'MRNA', 'BNTX', 'ANTM'
    ],
    'finance': [
      // Financial Services Companies
      'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'BLK', 'SCHW', 'AXP', 'COF',
      'USB', 'PNC', 'TFC', 'BK', 'STT', 'NTRS', 'RF', 'CFG', 'HBAN', 'FITB',
      'V', 'MA', 'FIS', 'FISV', 'DFS', 'SYF', 'ALLY', 'TRV', 'ALL', 'PGR'
    ],
    'consumer': [
      // Consumer Discretionary & Staples
      'HD', 'LOW', 'MCD', 'SBUX', 'NKE', 'TJX', 'BKNG', 'ABNB', 'TGT', 'COST',
      'WMT', 'DIS', 'PG', 'KO', 'PEP', 'MDLZ', 'GIS', 'K', 'CAG', 'HSY',
      'F', 'GM', 'YUM', 'CMG', 'LULU', 'RCL', 'CCL', 'MAR', 'HLT'
    ],
    'energy': [
      // Energy Companies
      'XOM', 'CVX', 'COP', 'EOG', 'SLB', 'OXY', 'PSX', 'VLO', 'MPC', 'HES',
      'DVN', 'FANG', 'MRO', 'APA', 'CLR', 'KMI', 'OKE', 'EPD', 'ET', 'WMB',
      'HAL', 'BKR', 'FTI', 'NOV', 'RIG', 'CNX', 'AR', 'EQT', 'MTDR', 'SM'
    ],
    'utilities': [
      // Utilities Companies
      'NEE', 'DUK', 'SO', 'D', 'EXC', 'XEL', 'WEC', 'ES', 'AEP', 'FE',
      'ETR', 'PPL', 'AES', 'LNT', 'NRG', 'VST', 'AWK', 'WTR', 'SRE', 'PEG',
      'T', 'VZ', 'CMS', 'DTE', 'ED', 'PCG', 'EIX', 'NI', 'CNP', 'ATO'
    ]
  };
  
  return sectorMap[sector] || [];
}

// Helper function to determine risk level
function getRiskLevel(beta: number | null, volatility: number): 'low' | 'medium' | 'high' {
  if (beta === null) {
    return volatility > 20 ? 'high' : volatility > 10 ? 'medium' : 'low';
  }
  
  if (beta > 1.5) return 'high';
  if (beta > 1.0) return 'medium';
  return 'low';
}

// Helper function to format market cap
function formatMarketCap(marketCap: string): string {
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

// Helper function to validate that a stock belongs to the target sector
function validateSectorMatch(targetSector: string, apiSector: string, apiIndustry: string): boolean {
  if (!apiSector && !apiIndustry) return true; // If no sector data available, allow it
  
  const sector = apiSector?.toLowerCase() || '';
  const industry = apiIndustry?.toLowerCase() || '';
  
  const sectorMappings: Record<string, string[]> = {
    'technology': [
      'technology', 'software', 'semiconductors', 'electronic technology', 'telecommunications',
      'internet', 'information technology', 'computer', 'tech hardware', 'cloud computing',
      'artificial intelligence', 'cybersecurity', 'social media', 'e-commerce', 'fintech'
    ],
    'healthcare': [
      'healthcare', 'health care', 'pharmaceuticals', 'biotechnology', 'biotech', 'medical',
      'health technology', 'life sciences', 'medical devices', 'pharmaceutical preparations',
      'health services', 'hospital', 'drug', 'therapeutic', 'clinical', 'diagnostic'
    ],
    'finance': [
      'financial', 'finance', 'banking', 'insurance', 'investment', 'asset management',
      'credit', 'payments', 'financial services', 'capital markets', 'real estate investment',
      'mortgage', 'lending', 'wealth management', 'brokerage', 'fintech'
    ],
    'consumer': [
      'consumer', 'retail', 'food', 'beverage', 'restaurant', 'apparel', 'automotive',
      'entertainment', 'media', 'travel', 'leisure', 'hospitality', 'discretionary',
      'staples', 'goods', 'personal care', 'household', 'gaming'
    ],
    'energy': [
      'energy', 'oil', 'gas', 'petroleum', 'renewable energy', 'utilities', 'power',
      'coal', 'solar', 'wind', 'nuclear', 'electric', 'pipeline', 'refining',
      'exploration', 'drilling', 'fossil', 'alternative energy'
    ],
    'utilities': [
      'utilities', 'utility', 'electric', 'power', 'water', 'gas distribution',
      'telecommunications', 'telecom', 'wireless', 'broadband', 'infrastructure'
    ]
  };
  
  const targetKeywords = sectorMappings[targetSector] || [];
  
  // Check if any target keywords match the API sector or industry
  return targetKeywords.some(keyword => 
    sector.includes(keyword) || industry.includes(keyword)
  );
}

// Helper function to get default ESG score
function getDefaultESGScore(symbol: string): number {
  const esgScores: Record<string, number> = {
    'AAPL': 82, 'MSFT': 85, 'GOOGL': 79, 'AMZN': 74, 'TSLA': 72,
    'JNJ': 78, 'UNH': 81, 'PFE': 76, 'KO': 80, 'PEP': 82,
    'JPM': 75, 'V': 83, 'MA': 84, 'WMT': 77, 'HD': 79
  };
  return esgScores[symbol] || 70;
}