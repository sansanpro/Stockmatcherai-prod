import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[AI-RECOMMEND] Function started');
    const startTime = Date.now();

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    console.log(`[AI-RECOMMEND] User authenticated: ${user.id}`);

    // Check subscription status
    const { data: subscription } = await supabase
      .from('subscribers')
      .select('subscribed, subscription_tier')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!subscription?.subscribed) {
      return new Response(
        JSON.stringify({ error: 'Premium subscription required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[AI-RECOMMEND] Premium user verified`);

    // Get request body
    const { userProfile, excludedStocks = [], sessionType = 'ai' } = await req.json();
    
    if (!userProfile) {
      throw new Error('User profile is required');
    }

    console.log(`[AI-RECOMMEND] Processing recommendation for profile:`, userProfile);

    // Fetch user's extended profile from database
    const { data: dbProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    // Fetch stock universe from all sector tables
    const stockTables = ['technology_stocks', 'finance_stocks', 'healthcare_stocks', 
                        'energy_stocks', 'consumer_stocks', 'utilities_stocks'];
    
    let allStocks: any[] = [];
    
    for (const table of stockTables) {
      const { data: stocks } = await supabase
        .from(table)
        .select('*')
        .limit(50); // Limit per sector for performance
      
      if (stocks) {
        allStocks = allStocks.concat(stocks.map(stock => ({
          ...stock,
          sector: table.replace('_stocks', '')
        })));
      }
    }

    console.log(`[AI-RECOMMEND] Loaded ${allStocks.length} stocks from database`);

    // Filter out excluded stocks
    const availableStocks = allStocks.filter(stock => 
      !excludedStocks.includes(stock.ticker)
    );

    if (availableStocks.length === 0) {
      throw new Error('No stocks available for recommendation');
    }

    // Create session record
    const sessionId = crypto.randomUUID();
    await supabase
      .from('recommendation_sessions')
      .insert({
        id: sessionId,
        user_id: user.id,
        session_type: sessionType
      });

    // Prepare prompt for GPT-4
    const prompt = createAIPrompt(userProfile, dbProfile, availableStocks.slice(0, 100));
    
    console.log(`[AI-RECOMMEND] Calling OpenAI with ${availableStocks.slice(0, 100).length} stocks`);

    // Call OpenAI GPT-4
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert financial advisor AI that analyzes user profiles and recommends personalized stock portfolios. Always return valid JSON responses with exactly the requested format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const aiContent = aiResponse.choices[0].message.content;
    
    console.log(`[AI-RECOMMEND] OpenAI response received`);

    // Parse AI response
    let recommendations: any[];
    try {
      const parsed = JSON.parse(aiContent);
      recommendations = parsed.recommendations || parsed;
    } catch (e) {
      console.error('[AI-RECOMMEND] Failed to parse AI response:', aiContent);
      throw new Error('Invalid AI response format');
    }

    // Apply diversification rules
    const diversifiedRecommendations = applyDiversificationRules(recommendations);
    
    // Calculate confidence and diversification scores
    const confidenceScore = calculateConfidenceScore(diversifiedRecommendations, userProfile);
    const diversificationScore = calculateDiversificationScore(diversifiedRecommendations);
    
    const processingTime = Date.now() - startTime;

    // Store AI recommendation in database
    const { data: aiRecommendation } = await supabase
      .from('ai_recommendations')
      .insert({
        user_id: user.id,
        session_id: sessionId,
        recommendations: diversifiedRecommendations,
        user_profile: { ...userProfile, ...dbProfile },
        confidence_score: confidenceScore,
        diversification_score: diversificationScore,
        processing_time_ms: processingTime
      })
      .select()
      .single();

    console.log(`[AI-RECOMMEND] Recommendation stored with ID: ${aiRecommendation.id}`);

    // Convert to StockRecommendation format
    const formattedRecommendations = diversifiedRecommendations.map((rec: any, index: number) => {
      const stock = availableStocks.find(s => s.ticker === rec.ticker);
      if (!stock) return null;

      return {
        id: stock.id,
        companyName: stock.company_name,
        ticker: stock.ticker,
        sector: stock.sector,
        ceoName: stock.ceo_name,
        ceoHighlights: stock.ceo_highlights,
        peRatio: stock.pe_ratio,
        marketCap: stock.market_cap,
        oneYearReturn: stock.one_year_return,
        riskLevel: stock.risk_level,
        pricePerShare: stock.price_per_share,
        dividendYield: stock.dividend_yield,
        esgScore: stock.esg_score,
        whyItFits: rec.explanation || rec.reason || 'AI-powered personalized recommendation',
        aiRecommendationId: aiRecommendation.id,
        confidenceScore: rec.confidence || confidenceScore
      };
    }).filter(Boolean);

    console.log(`[AI-RECOMMEND] Returning ${formattedRecommendations.length} recommendations`);

    return new Response(
      JSON.stringify({ 
        recommendations: formattedRecommendations,
        sessionId,
        confidenceScore,
        diversificationScore,
        processingTimeMs: processingTime,
        modelVersion: 'gpt-4'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[AI-RECOMMEND] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function createAIPrompt(userProfile: any, dbProfile: any, stocks: any[]): string {
  const stockList = stocks.map(s => 
    `${s.ticker} (${s.company_name}): ${s.sector} sector, P/E: ${s.pe_ratio}, Return: ${s.one_year_return}%, Risk: ${s.risk_level}, Price: $${s.price_per_share}, Dividend: ${s.dividend_yield}%`
  ).join('\n');

  return `
As an expert financial advisor, analyze this user profile and recommend the best 5-10 stocks for their portfolio:

USER PROFILE:
- Age: ${userProfile.age}
- Salary: $${userProfile.salary}
- Experience: ${userProfile.experience}
- Risk Tolerance: ${userProfile.riskTolerance}
- Sector Preference: ${userProfile.sectorPreference}
- Investment Goal: ${userProfile.investmentGoal}
${dbProfile ? `- Additional Profile: ${JSON.stringify(dbProfile)}` : ''}

AVAILABLE STOCKS:
${stockList}

REQUIREMENTS:
1. Select 5-10 stocks that best match the user's profile
2. Ensure diversification (max 30% in any single sector)
3. Match risk tolerance with stock risk levels
4. Consider user's experience level and goals
5. Provide clear, personalized explanations for each pick

RESPOND IN THIS EXACT JSON FORMAT:
{
  "recommendations": [
    {
      "ticker": "AAPL",
      "confidence": 0.95,
      "explanation": "Detailed explanation of why this stock fits the user's profile",
      "allocation_percentage": 15
    }
  ]
}

Make sure the response is valid JSON and explanations are personalized and specific to this user.
`;
}

function applyDiversificationRules(recommendations: any[]): any[] {
  const sectorMap = new Map<string, any[]>();
  
  // Group by sector
  recommendations.forEach(rec => {
    const sector = rec.sector || 'unknown';
    if (!sectorMap.has(sector)) {
      sectorMap.set(sector, []);
    }
    sectorMap.get(sector)!.push(rec);
  });

  // Apply 30% max per sector rule
  const diversified: any[] = [];
  const maxPerSector = Math.max(2, Math.floor(recommendations.length * 0.3));

  sectorMap.forEach((stocks, sector) => {
    const limitedStocks = stocks
      .sort((a, b) => (b.confidence || 0.5) - (a.confidence || 0.5))
      .slice(0, maxPerSector);
    diversified.push(...limitedStocks);
  });

  return diversified.slice(0, 10); // Max 10 recommendations
}

function calculateConfidenceScore(recommendations: any[], userProfile: any): number {
  if (recommendations.length === 0) return 0;
  
  const avgConfidence = recommendations.reduce((sum, rec) => 
    sum + (rec.confidence || 0.5), 0) / recommendations.length;
  
  // Boost confidence for experienced users
  const experienceBoost = userProfile.experience === 'expert' ? 0.1 : 
                         userProfile.experience === 'intermediate' ? 0.05 : 0;
  
  return Math.min(1, avgConfidence + experienceBoost);
}

function calculateDiversificationScore(recommendations: any[]): number {
  if (recommendations.length === 0) return 0;
  
  const sectors = new Set(recommendations.map(r => r.sector));
  const riskLevels = new Set(recommendations.map(r => r.risk_level));
  
  // Score based on sector and risk diversity
  const sectorScore = Math.min(1, sectors.size / 4); // Max score if 4+ sectors
  const riskScore = Math.min(1, riskLevels.size / 3); // Max score if 3 risk levels
  
  return (sectorScore + riskScore) / 2;
}