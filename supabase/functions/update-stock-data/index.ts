
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { FinnhubClient, FinnhubRateLimitError, formatMarketCap } from '../_shared/finnhub.ts';

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
  table: string;
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

    const finnhubApiKey = Deno.env.get('FINNHUB_API_KEY');
    if (!finnhubApiKey) {
      console.error('❌ FINNHUB_API_KEY is not set in environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'FINNHUB_API_KEY is not configured',
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

    const finnhub = new FinnhubClient(finnhubApiKey);

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

    // Finnhub free tier allows ~60 calls/min. Each ticker costs 2 calls (quote + metrics);
    // 1250ms spacing keeps us at ~48 calls/min, leaving headroom for the fmp-data function's user-facing calls.
    let successCount = 0;
    let failCount = 0;
    let processedCount = 0;
    let apiCalls = 0;
    const delayBetweenCalls = 1250;

    const pause = () => new Promise(resolve => setTimeout(resolve, delayBetweenCalls));
    const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

    for (const ticker of sortedTickers) {
      if (Date.now() - startTime > maxProcessingTime) {
        console.log(`⏰ Approaching time limit, stopping after ${processedCount} tickers`);
        break;
      }

      try {
        if (apiCalls > 0) await pause();
        const quote = await finnhub.getQuote(ticker);
        apiCalls++;

        if (!quote) {
          console.log(`⚠️ No quote data received for ${ticker}`);
          failCount++;
          processedCount++;
          continue;
        }

        await pause();
        const metrics = await finnhub.getMetrics(ticker);
        apiCalls++;

        const updates: Record<string, unknown> = {
          price_per_share: quote.c,
          updated_at: new Date().toISOString(),
        };
        // Only overwrite fields Finnhub actually returned, so missing metrics keep their last known value
        if (isNum(metrics?.['52WeekPriceReturnDaily'])) updates.one_year_return = Number(metrics!['52WeekPriceReturnDaily'].toFixed(2));
        const pe = metrics?.peTTM ?? metrics?.peBasicExclExtraTTM;
        if (isNum(pe) && pe > 0) updates.pe_ratio = Number(pe.toFixed(2));
        if (isNum(metrics?.currentDividendYieldTTM)) updates.dividend_yield = Number(metrics!.currentDividendYieldTTM!.toFixed(2));
        if (isNum(metrics?.marketCapitalization) && metrics!.marketCapitalization! > 0) updates.market_cap = formatMarketCap(metrics!.marketCapitalization!);

        console.log(`💰 ${ticker}: $${quote.c} (today ${quote.dp ?? 0}%, 1Y ${updates.one_year_return ?? 'n/a'}%)`);

        // Update every sector table this ticker appears in
        const tables = [...new Set(allStaleStocks.filter(stock => stock.ticker === ticker).map(stock => stock.table))];
        let updateCount = 0;
        for (const table of tables) {
          const { error: updateError } = await supabase.from(table).update(updates).eq('ticker', ticker);
          if (updateError) {
            console.error(`❌ Error updating ${ticker} in ${table}:`, updateError);
          } else {
            updateCount++;
          }
        }

        if (updateCount > 0) {
          successCount += updateCount;
        } else {
          failCount++;
        }
        processedCount++;
      } catch (error) {
        if (error instanceof FinnhubRateLimitError) {
          console.log('⚠️ Finnhub rate limit hit, stopping this run');
          break;
        }
        console.error(`❌ Error processing ${ticker}:`, error);
        failCount++;
        processedCount++;
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
          api_calls_used: apiCalls
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
        error: error instanceof Error ? error.message : String(error),
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
