import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const alphaVantageKey = Deno.env.get('ALPHA_VANTAGE_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol = 'AAPL' } = await req.json().catch(() => ({}));
    
    console.log(`Testing Alpha Vantage API for symbol: ${symbol}`);
    
    if (!alphaVantageKey) {
      throw new Error('ALPHA_VANTAGE_API_KEY not found');
    }

    // Test Alpha Vantage OVERVIEW function
    const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${alphaVantageKey}`;
    console.log(`Calling URL: ${url.replace(alphaVantageKey, 'HIDDEN_KEY')}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Alpha Vantage response for ${symbol}:`, JSON.stringify(data, null, 2));
    
    // Check what fields are available
    const availableFields = Object.keys(data);
    console.log(`Available fields: ${availableFields.join(', ')}`);
    
    // Look for CEO-related fields
    const ceoFields = availableFields.filter(field => 
      field.toLowerCase().includes('ceo') || 
      field.toLowerCase().includes('executive') || 
      field.toLowerCase().includes('management') ||
      field.toLowerCase().includes('officer')
    );
    console.log(`CEO-related fields: ${ceoFields.join(', ')}`);

    return new Response(JSON.stringify({
      symbol,
      success: true,
      data,
      availableFields,
      ceoFields,
      hasSymbol: !!data.Symbol,
      hasError: !!(data['Error Message'] || data['Note'] || data['Information'])
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in test-alpha-vantage function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});