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
      
      if (data['Error Message'] || data['Note']) {
        throw new Error(data['Error Message'] || data['Note']);
      }
      
      return data['Global Quote'] || null;
    } catch (error) {
      console.error(`Failed to get quote for ${symbol}:`, error);
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

// Priority stocks that get updated more frequently
const PRIORITY_STOCKS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX',
  'JPM', 'BAC', 'WFC', 'GS', 'JNJ', 'PFE', 'UNH', 'ABBV'
];

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

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const alphaVantageKey = Deno.env.get('VITE_ALPHA_VANTAGE_API_KEY');

    if (!alphaVantageKey) {
      throw new Error('Alpha Vantage API key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const alphaVantage = new AlphaVantageService(alphaVantageKey);

    const { sector, updateType = 'scheduled', priority = false } = await req.json().catch(() => ({}));
    
    // Determine which sector to update
    const currentHour = new Date().getHours();
    const currentMinute = new Date().getMinutes();
    
    let targetSector = sector;
    
    // If no sector specified, determine based on schedule
    if (!targetSector) {
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

    console.log(`Starting ${updateType} update for ${targetSector} sector`);

    // Create update log entry
    const { data: logEntry } = await supabase
      .from('stock_update_logs')
      .insert({
        sector: targetSector,
        update_type: updateType,
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

    // Limit number of stocks to update based on API limits
    const maxStocks = priority ? 10 : 15; // Fewer for priority to allow more frequent updates
    stocksToUpdate = stocksToUpdate.slice(0, maxStocks);

    console.log(`Updating ${stocksToUpdate.length} stocks from ${targetSector} sector`);

    let updatedCount = 0;
    let failedCount = 0;
    let apiCallsUsed = 0;

    // Update stocks with rate limiting
    for (const stock of stocksToUpdate) {
      try {
        // Get quote data
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
            console.error(`Failed to update ${stock.ticker}:`, updateError);
            failedCount++;
          } else {
            updatedCount++;
            console.log(`Updated ${stock.ticker}: $${currentPrice} (${changePercent}%)`);
          }
        } else {
          failedCount++;
        }

        // Rate limiting: wait 12 seconds between API calls (5 calls per minute)
        if (apiCallsUsed < stocksToUpdate.length) {
          await new Promise(resolve => setTimeout(resolve, 12000));
        }

      } catch (error) {
        console.error(`Error updating ${stock.ticker}:`, error);
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

    const response = {
      success: true,
      sector: targetSector,
      updateType,
      priority,
      stocksUpdated: updatedCount,
      stocksFailed: failedCount,
      apiCallsUsed,
      message: `Updated ${updatedCount} stocks in ${targetSector} sector`
    };

    console.log('Update completed:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Update function error:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});