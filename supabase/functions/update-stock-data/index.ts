
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { createFMPService } from './fmpService.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DatabaseStock {
  id: string;
  ticker: string;
  company_name: string;
  pe_ratio: number;
  market_cap: string;
  one_year_return: number;
  price_per_share: number;
  dividend_yield: number;
  risk_level: string;
  esg_score: number;
  ceo_name: string;
  ceo_highlights: string;
  created_at: string;
  updated_at: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body to get parameters from cron jobs
    let requestBody: any = {};
    try {
      if (req.method === 'POST') {
        const text = await req.text();
        if (text) {
          requestBody = JSON.parse(text);
        }
      }
    } catch (e) {
      console.log('📝 No request body or invalid JSON, proceeding with default parameters');
    }

    const updateType = requestBody.updateType || 'default';
    const source = requestBody.source || 'manual';
    const skipMarketCheck = requestBody.skipMarketCheck || false;
    
    console.log(`🚀 Stock data update function started - Type: ${updateType}, Source: ${source}`);
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get FMP API key
    const fmpApiKey = Deno.env.get('FMP_API_KEY');
    console.log('📊 FMP API Key status:', fmpApiKey ? `Present (${fmpApiKey.substring(0, 8)}...)` : 'MISSING');
    
    if (!fmpApiKey) {
      console.error('❌ FMP_API_KEY is not set in environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'FMP_API_KEY is not configured',
          success: false,
          updated: 0,
          failed: 0
        }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize FMP service
    const fmpService = createFMPService(fmpApiKey);

    // Define all sector tables
    const sectorTables = [
      'technology_stocks',
      'healthcare_stocks', 
      'finance_stocks',
      'energy_stocks',
      'consumer_stocks',
      'utilities_stocks'
    ];

    // Get all stocks older than 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    console.log(`⏰ Looking for stocks updated before: ${fifteenMinutesAgo}`);

    let allStaleStocks: DatabaseStock[] = [];
    
    for (const table of sectorTables) {
      try {
        const { data: staleStocks, error } = await supabase
          .from(table)
          .select('*')
          .lt('updated_at', fifteenMinutesAgo);

        if (error) {
          console.error(`❌ Error fetching stale stocks from ${table}:`, error);
          continue;
        }

        if (staleStocks && staleStocks.length > 0) {
          console.log(`📋 Found ${staleStocks.length} stale stocks in ${table}`);
          allStaleStocks = [...allStaleStocks, ...staleStocks.map(stock => ({ ...stock, table }))];
        }
      } catch (err) {
        console.error(`❌ Exception fetching from ${table}:`, err);
      }
    }

    console.log(`🔍 Total stale stocks found: ${allStaleStocks.length}`);

    if (allStaleStocks.length === 0) {
      console.log('✅ All stock data is up to date (less than 15 minutes old)');
      return new Response(
        JSON.stringify({ 
          message: 'All stock data is up to date',
          success: true,
          updated: 0,
          failed: 0,
          staleCount: 0
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract unique tickers and limit for wall-clock time constraints
    const uniqueTickers = [...new Set(allStaleStocks.map(stock => stock.ticker))];
    console.log(`📈 Unique tickers to update: ${uniqueTickers.length}`, uniqueTickers.slice(0, 10));

    // Calculate time constraints (leave 30 seconds buffer for processing)
    const startTime = Date.now();
    const maxProcessingTime = 120 * 1000; // 120 seconds, leaving 30s buffer
    
    // Ensure balanced sector representation by grouping by sector and taking oldest from each
    const tickersBySector = sectorTables.reduce((acc, table) => {
      const sectorStocks = allStaleStocks.filter(s => s.table === table);
      const sectorTickers = [...new Set(sectorStocks.map(s => s.ticker))];
      acc[table] = sectorTickers.sort((a, b) => {
        const aOldest = Math.min(...sectorStocks.filter(s => s.ticker === a).map(s => new Date(s.updated_at).getTime()));
        const bOldest = Math.min(...sectorStocks.filter(s => s.ticker === b).map(s => new Date(s.updated_at).getTime()));
        return aOldest - bOldest;
      });
      return acc;
    }, {} as Record<string, string[]>);

    // Create balanced selection: take ~8 from each sector to ensure all sectors get updates
    const tickersPerSector = Math.floor(50 / sectorTables.length);
    const sortedTickers: string[] = [];
    sectorTables.forEach(table => {
      const sectorTickers = tickersBySector[table] || [];
      sortedTickers.push(...sectorTickers.slice(0, tickersPerSector + 2)); // +2 for rounding
    });
    
    console.log(`⚖️ Balanced sector selection - ${sortedTickers.length} tickers distributed across all sectors`);

    // Check if another update is already running (lock mechanism)
    const { data: runningUpdates } = await supabase
      .from('stock_update_logs')
      .select('id')
      .eq('status', 'running')
      .gte('started_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Check last 5 minutes
    
    if (runningUpdates && runningUpdates.length > 0) {
      console.log('⚠️ Another update is already running, skipping to avoid rate limit conflicts');
      return new Response(
        JSON.stringify({ 
          message: 'Another update is already running',
          success: true,
          updated: 0,
          failed: 0
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create lock entry
    const { data: lockEntry } = await supabase
      .from('stock_update_logs')
      .insert({
        sector: 'all',
        update_type: updateType,
        status: 'running',
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    const lockId = lockEntry?.id;

    // Optimize for FMP premium plan (300 calls/min = 5 calls/sec)
    let successCount = 0;
    let failCount = 0;
    const batchSize = 50; // Larger batches for premium tier
    let processedCount = 0;
    const delayBetweenCalls = 200; // 200ms between calls (5 calls/sec)

    console.log(`⚡ Optimized for FMP premium - processing up to 150 stocks with rate limiting (5 calls/sec)`);

    for (let i = 0; i < sortedTickers.length && processedCount < 150; i += batchSize) {
      const currentTime = Date.now();
      const elapsedTime = currentTime - startTime;
      
      if (elapsedTime > maxProcessingTime) {
        console.log(`⏰ Approaching time limit (${elapsedTime}ms), stopping processing`);
        break;
      }

      const batchTickers = sortedTickers.slice(i, i + batchSize);
      console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}: ${batchTickers.join(', ')}`);

      // Process tickers with optimized rate limiting
      for (let tickerIndex = 0; tickerIndex < batchTickers.length; tickerIndex++) {
        const ticker = batchTickers[tickerIndex];
        
        // Add delay between API calls (200ms for premium tier - 5 calls/sec)
        if (i > 0 || tickerIndex > 0) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenCalls));
        }
        
        try {
          console.log(`📊 Fetching data for ${ticker}...`);
          
          // Get fresh quote data
          const quote = await fmpService.getQuote(ticker);
          
          if (!quote) {
            console.log(`⚠️ No quote data received for ${ticker}`);
            failCount++;
            processedCount++;
            continue;
          }

          // Parse quote data
          const currentPrice = parseFloat(quote['05. price'] || '0');
          const changePercent = parseFloat((quote['10. change percent'] || '0%').replace('%', ''));
          
          if (currentPrice <= 0) {
            console.log(`⚠️ Invalid price data for ${ticker}: ${currentPrice}`);
            failCount++;
            processedCount++;
            continue;
          }

          console.log(`💰 ${ticker}: $${currentPrice} (${changePercent > 0 ? '+' : ''}${changePercent}%)`);

          // Update all instances of this ticker across all tables
          const stocksToUpdate = allStaleStocks.filter(stock => stock.ticker === ticker);
          let updateCount = 0;
          let updateErrors = 0;
          
          for (const stock of stocksToUpdate) {
            try {
              const { error: updateError } = await supabase
                .from(stock.table)
                .update({
                  price_per_share: currentPrice,
                  one_year_return: changePercent,
                  updated_at: new Date().toISOString()
                })
                .eq('ticker', ticker);

              if (updateError) {
                console.error(`❌ Error updating ${ticker} in ${stock.table}:`, updateError);
                updateErrors++;
              } else {
                console.log(`✅ Updated ${ticker} in ${stock.table}`);
                updateCount++;
              }
            } catch (updateErr) {
              console.error(`❌ Exception updating ${ticker} in ${stock.table}:`, updateErr);
              updateErrors++;
            }
          }

          if (updateCount > 0) {
            successCount += updateCount;
          } else {
            failCount++;
          }
          processedCount++;

        } catch (error) {
          console.error(`❌ Error processing ${ticker}:`, error);
          failCount++;
          processedCount++;
        }
      }
    }

    // Release lock
    if (lockId) {
      await supabase
        .from('stock_update_logs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          stocks_updated: successCount,
          stocks_failed: failCount,
          api_calls_used: processedCount
        })
        .eq('id', lockId);
    }

    const summary = {
      message: 'Stock update process completed',
      success: true,
      staleStocksFound: allStaleStocks.length,
      uniqueTickersProcessed: uniqueTickers.length,
      updated: successCount,
      failed: failCount,
      updateTime: new Date().toISOString()
    };

    console.log('📊 Update Summary:', summary);

    return new Response(
      JSON.stringify(summary), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Fatal error in update-stock-data function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false,
        updated: 0,
        failed: 0
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
