import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const alphaVantageKey = Deno.env.get('ALPHA_VANTAGE_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

type SectorTable = 'technology_stocks' | 'healthcare_stocks' | 'finance_stocks' | 'energy_stocks' | 'consumer_stocks' | 'utilities_stocks';

const sectorTables: SectorTable[] = [
  'technology_stocks',
  'healthcare_stocks', 
  'finance_stocks',
  'energy_stocks',
  'consumer_stocks',
  'utilities_stocks'
];

interface AlphaVantageCompanyOverview {
  Symbol: string;
  Name: string;
  Description: string;
  CEO?: string;
  Industry: string;
  Sector: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting CEO data update process...');
    
    let totalUpdated = 0;
    let totalFailed = 0;
    const results = [];

    // Process each sector table
    for (const table of sectorTables) {
      console.log(`Processing ${table}...`);
      
      // Get stocks with generic CEO data
      const { data: stocks, error: fetchError } = await supabase
        .from(table)
        .select('*')
        .or('ceo_name.eq.Management Team,ceo_name.eq.Leadership Team,ceo_highlights.ilike.%Experienced leadership driving company growth%');

      if (fetchError) {
        console.error(`Error fetching from ${table}:`, fetchError);
        continue;
      }

      if (!stocks || stocks.length === 0) {
        console.log(`No stocks with generic CEO data found in ${table}`);
        continue;
      }

      console.log(`Found ${stocks.length} stocks with generic CEO data in ${table}`);

      // Update each stock
      for (const stock of stocks) {
        try {
          console.log(`Fetching CEO data for ${stock.ticker}...`);
          
          // Call Alpha Vantage COMPANY_OVERVIEW
          const response = await fetch(
            `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${stock.ticker}&apikey=${alphaVantageKey}`
          );
          
          if (!response.ok) {
            throw new Error(`Alpha Vantage API error: ${response.status}`);
          }
          
          const data: AlphaVantageCompanyOverview = await response.json();
          
          // Check for API errors or rate limits
          if (data.hasOwnProperty('Note') || data.hasOwnProperty('Information')) {
            console.log(`API rate limit or error for ${stock.ticker}, skipping...`);
            continue;
          }
          
          // Extract CEO name and create highlights from description
          const ceoName = data.CEO || 'Leadership Team';
          let ceoHighlights = stock.ceo_highlights;
          
          // If we got a valid CEO name, create better highlights
          if (data.CEO && data.CEO !== 'N/A' && data.CEO.trim() !== '') {
            const description = data.Description || '';
            const industry = data.Industry || '';
            const sector = data.Sector || '';
            
            // Create CEO highlights based on company info
            ceoHighlights = `${ceoName} leads ${data.Name || stock.company_name} as Chief Executive Officer. ` +
              `Under their leadership, the company operates in the ${industry} industry` +
              (sector ? ` within the ${sector} sector` : '') + '. ' +
              (description.length > 0 ? 
                description.split('.').slice(0, 2).join('.') + '.' : 
                'The executive team focuses on driving strategic growth and operational excellence.'
              );
          }
          
          // Update the stock record
          const { error: updateError } = await supabase
            .from(table)
            .update({
              ceo_name: ceoName,
              ceo_highlights: ceoHighlights,
              updated_at: new Date().toISOString()
            })
            .eq('ticker', stock.ticker);

          if (updateError) {
            console.error(`Error updating ${stock.ticker}:`, updateError);
            totalFailed++;
          } else {
            console.log(`Successfully updated CEO data for ${stock.ticker}: ${ceoName}`);
            totalUpdated++;
          }

          // Rate limiting - wait 12 seconds between requests (Alpha Vantage free tier: 5 calls/minute)
          await new Promise(resolve => setTimeout(resolve, 12000));

        } catch (error) {
          console.error(`Error processing ${stock.ticker}:`, error);
          totalFailed++;
        }
      }
    }

    // Log the update operation
    await supabase
      .from('stock_update_logs')
      .insert({
        sector: 'all_sectors',
        update_type: 'ceo_data',
        status: 'completed',
        stocks_updated: totalUpdated,
        stocks_failed: totalFailed,
        completed_at: new Date().toISOString(),
        api_calls_used: totalUpdated + totalFailed
      });

    const summary = {
      message: 'CEO data update completed',
      totalUpdated,
      totalFailed,
      results
    };

    console.log('CEO update summary:', summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in update-ceo-data function:', error);
    
    // Log the failed operation
    await supabase
      .from('stock_update_logs')
      .insert({
        sector: 'all_sectors',
        update_type: 'ceo_data',
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString()
      });

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});