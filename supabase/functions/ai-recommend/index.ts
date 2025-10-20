import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Logging helper functions for comprehensive monitoring
function logInfo(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[AI-RECOMMEND] [${timestamp}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

function logError(message: string, error?: any) {
  const timestamp = new Date().toISOString();
  console.error(`[AI-RECOMMEND] [${timestamp}] ERROR: ${message}`, error);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logInfo('Function started');
    const startTime = Date.now();
    
    if (!geminiApiKey) {
      logError('GEMINI_API_KEY not configured');
      throw new Error('Gemini API key not configured');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logError('No authorization header provided');
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      logError('Authentication failed', authError);
      throw new Error('Authentication failed');
    }

    logInfo(`User authenticated: ${user.id}`);

    // Check subscription status
    const { data: subscription } = await supabase
      .from('subscribers')
      .select('subscribed, subscription_tier')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!subscription?.subscribed) {
      logInfo(`Access denied for user ${user.id} - not subscribed`);
      return new Response(
        JSON.stringify({ error: 'Premium subscription required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logInfo(`Premium user verified: ${subscription.subscription_tier}`);

    // Get request body
    const { userProfile, excludedStocks = [], sessionType = 'ai' } = await req.json();
    
    if (!userProfile) {
      logError('User profile is required but not provided');
      throw new Error('User profile is required');
    }

    logInfo(`Processing recommendation request`, {
      userId: user.id,
      excludedStocksCount: excludedStocks.length,
      sessionType,
      profileSummary: {
        age: userProfile.age,
        experience: userProfile.experience,
        riskTolerance: userProfile.riskTolerance
      }
    });

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

    logInfo(`Stock universe loaded`, {
      totalStocks: allStocks.length,
      byTable: stockTables.map(t => ({ table: t, count: allStocks.filter(s => s.sector === t.replace('_stocks', '')).length }))
    });

    // Filter out excluded stocks
    const availableStocks = allStocks.filter(stock => 
      !excludedStocks.includes(stock.ticker)
    );

    if (availableStocks.length === 0) {
      logError('No stocks available after filtering', { excludedCount: excludedStocks.length });
      throw new Error('No stocks available for recommendation');
    }
    
    logInfo(`Stocks available for AI analysis: ${availableStocks.length}`);

    // Create session record
    const sessionId = crypto.randomUUID();
    await supabase
      .from('recommendation_sessions')
      .insert({
        id: sessionId,
        user_id: user.id,
        session_type: sessionType
      });

    // Prepare prompt for Gemini 2.5
    const stocksToAnalyze = availableStocks.slice(0, 100);
    const prompt = createAIPrompt(userProfile, dbProfile, stocksToAnalyze);
    
    logInfo(`Calling Gemini API`, {
      model: 'gemini-1.5-flash',
      stockCount: stocksToAnalyze.length,
      promptLength: prompt.length
    });

    const geminiStartTime = Date.now();

    // Call Google Gemini 1.5 Flash API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are an expert financial advisor AI that analyzes user profiles and recommends personalized stock portfolios. Always return valid JSON responses with exactly the requested format.\n\n${prompt}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 3000
          }
        }),
      }
    );

    const geminiLatency = Date.now() - geminiStartTime;
    
    if (!response.ok) {
      const errorText = await response.text();
      logError(`Gemini API error: ${response.status}`, {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText,
        latencyMs: geminiLatency
      });
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const geminiResponse = await response.json();
    logInfo(`Gemini API response received`, {
      latencyMs: geminiLatency,
      hasContent: !!geminiResponse.candidates?.[0]?.content
    });
    
    // Extract text from Gemini's response structure
    const aiContent = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!aiContent) {
      logError('No content in Gemini response', geminiResponse);
      throw new Error('Invalid Gemini response: no content');
    }

    // Parse AI response
    let recommendations: any[];
    try {
      const parsed = JSON.parse(aiContent);
      recommendations = parsed.recommendations || parsed;
      logInfo(`AI recommendations parsed successfully`, {
        count: recommendations.length,
        tickers: recommendations.map((r: any) => r.ticker)
      });
    } catch (e) {
      logError('Failed to parse AI response', {
        error: e.message,
        responsePreview: aiContent.substring(0, 500)
      });
      throw new Error('Invalid AI response format');
    }

    // Apply diversification rules
    const diversifiedRecommendations = applyDiversificationRules(recommendations);
    
    logInfo(`Diversification applied`, {
      beforeCount: recommendations.length,
      afterCount: diversifiedRecommendations.length
    });
    
    // Calculate confidence and diversification scores
    const confidenceScore = calculateConfidenceScore(diversifiedRecommendations, userProfile);
    const diversificationScore = calculateDiversificationScore(diversifiedRecommendations);
    
    const processingTime = Date.now() - startTime;
    
    logInfo(`Scoring completed`, {
      confidenceScore,
      diversificationScore,
      totalProcessingTimeMs: processingTime
    });

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
        processing_time_ms: processingTime,
        model_version: 'gemini-1.5-flash'
      })
      .select()
      .single();

    logInfo(`Recommendation stored in database`, {
      recommendationId: aiRecommendation.id,
      sessionId,
      stockCount: diversifiedRecommendations.length
    });

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

    logInfo(`Request completed successfully`, {
      recommendationCount: formattedRecommendations.length,
      totalTimeMs: processingTime,
      geminiLatencyMs: geminiLatency
    });

    return new Response(
      JSON.stringify({ 
        recommendations: formattedRecommendations,
        sessionId,
        confidenceScore,
        diversificationScore,
        processingTimeMs: processingTime,
        modelVersion: 'gemini-1.5-flash',
        apiLatencyMs: geminiLatency
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    logError('Function failed', {
      errorMessage: error.message,
      errorStack: error.stack,
      errorType: error.constructor.name
    });
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function createAIPrompt(userProfile: any, dbProfile: any, stocks: any[]): string {
  const stockList = stocks.map(s => 
    `${s.ticker} (${s.company_name}): ${s.sector} sector, P/E: ${s.pe_ratio}, Return: ${s.one_year_return}%, Risk: ${s.risk_level}, Price: $${s.price_per_share}, Dividend: ${s.dividend_yield}%, Market Cap: ${s.market_cap}, CEO: ${s.ceo_name}`
  ).join('\n');

  const age = userProfile.age;
  const lifeStage = age < 30 ? 'early career' : age < 45 ? 'mid-career' : age < 60 ? 'pre-retirement' : 'retirement';
  const incomeLevel = userProfile.salary < 75000 ? 'modest' : userProfile.salary < 150000 ? 'comfortable' : 'high';

  return `You are a personal financial advisor. Your client is sitting across from you. They need GENUINELY UNIQUE advice for each stock - not templated responses.

CLIENT SITTING IN FRONT OF YOU:
- ${userProfile.age} year old ${userProfile.gender} in ${lifeStage} phase with $${userProfile.salary.toLocaleString()} annual income
- Investment experience: ${userProfile.experience}
- Comfortable with ${userProfile.riskTolerance} risk
- Interested in ${userProfile.sectorPreference} sector
- Main goal: ${userProfile.investmentGoal}
${dbProfile ? `- Additional context: ${JSON.stringify(dbProfile)}` : ''}

AVAILABLE STOCKS:
${stockList}

CRITICAL INSTRUCTIONS FOR WRITING EXPLANATIONS:
1. NEVER use the same opening phrase twice (e.g., "As someone in your...")
2. NEVER repeat the same financial metric structure (vary how you present P/E, returns, dividends)
3. Each explanation must have a COMPLETELY DIFFERENT style and approach:
   - Stock 1: Start with what makes the company unique
   - Stock 2: Start with a real-world example of the product/service
   - Stock 3: Start with the CEO's leadership or company culture
   - Stock 4: Start with the financial metrics
   - Stock 5: Start with industry position
   - Stock 6+: Mix it up completely
4. Use the client's ACTUAL numbers dynamically:
   - Reference their specific age (${userProfile.age}) in different contexts
   - Mention their exact salary ($${userProfile.salary.toLocaleString()}) when relevant
   - Connect to their specific experience level (${userProfile.experience})
   - Address their specific goal (${userProfile.investmentGoal})
5. For EACH stock, choose ONE unique angle:
   - Company innovation/products they use
   - Industry disruption potential
   - Financial strength/weakness
   - Alignment with their timeline
   - CEO/leadership vision
   - Market positioning
   - Risk/reward specific to THEM

EXAMPLE VARIETY (notice how different each is):
Stock A: "You've probably used [product] today. [Company]'s ${stocks[0]?.one_year_return}% growth comes from everyday products becoming indispensable..."
Stock B: "At ${userProfile.age}, you have ${60 - age} years until typical retirement. [Company]'s stability matters because..."
Stock C: "[CEO name] transformed this company from [X] to [Y]. The ${stocks[0]?.pe_ratio}x P/E reflects..."
Stock D: "Your ${userProfile.experience} experience means you can handle [Company]'s complexity. Here's what sets it apart..."
Stock E: "With $${userProfile.salary.toLocaleString()} income, [Company]'s ${stocks[0]?.dividend_yield}% dividend means..."

YOUR TASK:
1. Pick 5-10 stocks that match their profile
2. Write 100-150 words per stock with ZERO repetition
3. Ensure max 30% in any sector
4. Match risk levels to their ${userProfile.riskTolerance} tolerance

RESPOND ONLY WITH THIS JSON (no markdown formatting, no code blocks):
{
  "recommendations": [
    {
      "ticker": "AAPL",
      "confidence": 0.95,
      "explanation": "[COMPLETELY UNIQUE 100-150 word explanation using different structure than other stocks]",
      "allocation_percentage": 15
    }
  ]
}

REMEMBER: If I see repeated phrases, templated language, or similar structures across stocks, the recommendations fail. Make each one genuinely different.`;
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