import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

// Sector mapping based on FMP industry data
const sectorMapping: Record<string, string> = {
  'technology': 'technology_stocks',
  'software': 'technology_stocks',
  'semiconductors': 'technology_stocks',
  'communication': 'technology_stocks',
  'healthcare': 'healthcare_stocks',
  'biotechnology': 'healthcare_stocks',
  'pharmaceuticals': 'healthcare_stocks',
  'medical': 'healthcare_stocks',
  'financial': 'finance_stocks',
  'banks': 'finance_stocks',
  'insurance': 'finance_stocks',
  'energy': 'energy_stocks',
  'oil': 'energy_stocks',
  'gas': 'energy_stocks',
  'consumer': 'consumer_stocks',
  'retail': 'consumer_stocks',
  'utilities': 'utilities_stocks',
  'electric': 'utilities_stocks',
  'water': 'utilities_stocks',
};

function determineSectorTable(industry: string, sector: string): string {
  const searchText = `${industry} ${sector}`.toLowerCase();
  
  for (const [key, table] of Object.entries(sectorMapping)) {
    if (searchText.includes(key)) {
      return table;
    }
  }
  
  // Default to technology if can't determine
  return 'technology_stocks';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Admin-only: this writes to the stock tables with the service role, so require the
  // service role key itself (verify_jwt is off, and the anon key ships in the app)
  if (req.headers.get('Authorization') !== `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { tickers, mode = 'manual' } = body;
    
    const fmpApiKey = Deno.env.get('FMP_API_KEY');
    if (!fmpApiKey) {
      return new Response(
        JSON.stringify({ error: 'FMP_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let tickersToAdd: string[] = [];

    // Auto mode: fetch popular stocks from FMP
    if (mode === 'auto') {
      console.log('🤖 Auto mode: Fetching popular stocks from FMP...');
      
      // Fetch stock gainers (popular/trending stocks)
      const gainersUrl = `${FMP_BASE_URL}/stock_market/gainers?apikey=${fmpApiKey}`;
      const gainersResponse = await fetch(gainersUrl);
      const gainersData = await gainersResponse.json();
      
      // Get top 10 gainers
      tickersToAdd = gainersData.slice(0, 10).map((stock: any) => stock.symbol);
      console.log(`📈 Found ${tickersToAdd.length} trending stocks:`, tickersToAdd);
    } else {
      // Manual mode: use provided tickers
      if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Please provide an array of ticker symbols' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      tickersToAdd = tickers;
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if update is currently running
    const { data: runningUpdates } = await supabase
      .from('stock_update_logs')
      .select('id')
      .eq('status', 'running')
      .gte('started_at', new Date(Date.now() - 5 * 60 * 1000).toISOString());
    
    if (runningUpdates && runningUpdates.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Stock update is currently running. Please wait a few minutes and try again.',
          isUpdateRunning: true
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🎯 Adding ${tickersToAdd.length} stocks:`, tickersToAdd);

    const results = [];
    const delayBetweenCalls = 200; // 200ms = 5 calls/sec

    for (let i = 0; i < tickersToAdd.length; i++) {
      const ticker = tickersToAdd[i].toUpperCase().trim();
      
      try {
        // Add delay between calls (except first)
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenCalls));
        }

        // Check if stock already exists
        const allTables = [
          'technology_stocks', 'healthcare_stocks', 'finance_stocks',
          'energy_stocks', 'consumer_stocks', 'utilities_stocks'
        ];
        
        let existsInTable = null;
        for (const table of allTables) {
          const { data } = await supabase.from(table).select('ticker').eq('ticker', ticker).single();
          if (data) {
            existsInTable = table;
            break;
          }
        }

        if (existsInTable) {
          results.push({
            ticker,
            success: false,
            error: `Already exists in ${existsInTable}`,
            alreadyExists: true
          });
          continue;
        }

        // Fetch quote data
        const quoteUrl = `${FMP_BASE_URL}/quote/${ticker}?apikey=${fmpApiKey}`;
        const quoteResponse = await fetch(quoteUrl);
        const quoteData = await quoteResponse.json();

        if (!quoteData || quoteData.length === 0) {
          results.push({
            ticker,
            success: false,
            error: 'Stock not found'
          });
          continue;
        }

        const quote = quoteData[0];

        // Add delay before profile call
        await new Promise(resolve => setTimeout(resolve, delayBetweenCalls));

        // Fetch profile data
        const profileUrl = `${FMP_BASE_URL}/profile/${ticker}?apikey=${fmpApiKey}`;
        const profileResponse = await fetch(profileUrl);
        const profileData = await profileResponse.json();

        const profile = profileData && profileData.length > 0 ? profileData[0] : null;

        // Determine sector table
        const industry = profile?.industry || 'Technology';
        const sector = profile?.sector || 'Technology';
        const sectorTable = determineSectorTable(industry, sector);

        // Calculate risk level based on beta
        const beta = quote.beta || 1.0;
        let riskLevel = 'medium';
        if (beta < 0.8) riskLevel = 'low';
        else if (beta > 1.2) riskLevel = 'high';

        // Prepare stock data
        const stockData = {
          id: `${ticker}-${Date.now()}`,
          ticker: ticker,
          company_name: quote.name || ticker,
          pe_ratio: quote.pe || 0,
          market_cap: profile?.mktCap ? `$${(profile.mktCap / 1e9).toFixed(2)}B` : 'N/A',
          one_year_return: quote.changesPercentage || 0,
          price_per_share: quote.price || 0,
          dividend_yield: profile?.lastDiv || 0,
          risk_level: riskLevel,
          ceo_name: profile?.ceo || 'N/A',
          ceo_highlights: profile?.description?.substring(0, 200) || 'No information available',
          esg_score: 75,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_updated: new Date().toISOString()
        };

        // Insert into appropriate sector table
        const { error: insertError } = await supabase
          .from(sectorTable)
          .insert(stockData);

        if (insertError) {
          results.push({
            ticker,
            success: false,
            error: insertError.message
          });
        } else {
          results.push({
            ticker,
            success: true,
            sector: sectorTable.replace('_stocks', ''),
            companyName: stockData.company_name,
            price: stockData.price_per_share
          });
        }

      } catch (error) {
        results.push({
          ticker,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Added ${successCount} stocks, ${failCount} failed`,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error adding stocks:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
