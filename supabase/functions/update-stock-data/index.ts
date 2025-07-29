
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
    console.log('🚀 Stock data update function started');
    
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

    // Get all stocks older than 4 hours
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    console.log(`⏰ Looking for stocks updated before: ${fourHoursAgo}`);

    let allStaleStocks: DatabaseStock[] = [];
    
    for (const table of sectorTables) {
      try {
        const { data: staleStocks, error } = await supabase
          .from(table)
          .select('*')
          .lt('updated_at', fourHoursAgo);

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
      console.log('✅ All stock data is up to date (less than 4 hours old)');
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

    // Extract unique tickers
    const uniqueTickers = [...new Set(allStaleStocks.map(stock => stock.ticker))];
    console.log(`📈 Unique tickers to update: ${uniqueTickers.length}`, uniqueTickers.slice(0, 10));

    // Batch update process
    let successCount = 0;
    let failCount = 0;
    const batchSize = 5; // Process in smaller batches to avoid overwhelming the API

    for (let i = 0; i < uniqueTickers.length; i += batchSize) {
      const batchTickers = uniqueTickers.slice(i, i + batchSize);
      console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(uniqueTickers.length / batchSize)}: ${batchTickers.join(', ')}`);

      for (const ticker of batchTickers) {
        try {
          console.log(`📊 Fetching data for ${ticker}...`);
          
          // Get fresh quote data
          const quote = await fmpService.getQuote(ticker);
          
          if (!quote) {
            console.log(`⚠️ No quote data received for ${ticker}`);
            failCount++;
            continue;
          }

          // Parse quote data
          const currentPrice = parseFloat(quote['05. price'] || '0');
          const changePercent = parseFloat((quote['10. change percent'] || '0%').replace('%', ''));
          
          if (currentPrice <= 0) {
            console.log(`⚠️ Invalid price data for ${ticker}: ${currentPrice}`);
            failCount++;
            continue;
          }

          console.log(`💰 ${ticker}: $${currentPrice} (${changePercent > 0 ? '+' : ''}${changePercent}%)`);

          // Update all instances of this ticker across all tables
          const stocksToUpdate = allStaleStocks.filter(stock => stock.ticker === ticker);
          
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
                failCount++;
              } else {
                console.log(`✅ Updated ${ticker} in ${stock.table}`);
                successCount++;
              }
            } catch (updateErr) {
              console.error(`❌ Exception updating ${ticker} in ${stock.table}:`, updateErr);
              failCount++;
            }
          }

          // Rate limiting - wait 2 seconds between API calls
          console.log('⏳ Waiting 2 seconds before next API call...');
          await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
          console.error(`❌ Error processing ${ticker}:`, error);
          failCount++;
        }
      }

      // Longer pause between batches
      if (i + batchSize < uniqueTickers.length) {
        console.log('⏳ Waiting 5 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
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
