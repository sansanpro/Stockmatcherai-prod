import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { GEMINI_MODEL, fetchGeminiWithFallback, geminiGenerateContentUrl, getGeminiApiKey } from '../_shared/gemini.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const geminiApiKey = getGeminiApiKey();
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
    const requestBody = await req.json();
    const { excludedStocks = [], sessionType = 'ai' } = requestBody;
    
    // Validate user profile input
    const userProfileSchema = z.object({
      age: z.number().int().min(18, 'Age must be at least 18').max(100, 'Age must be at most 100'),
      salary: z.number().int().min(0, 'Salary must be non-negative').max(100000000, 'Salary value too large'),
      gender: z.string().min(1).max(50, 'Gender must be less than 50 characters'),
      experience: z.enum(['none', 'beginner', 'intermediate', 'advanced', 'expert'], {
        errorMap: () => ({ message: 'Experience must be one of: none, beginner, intermediate, advanced, expert' })
      }),
      riskTolerance: z.enum(['low', 'medium', 'high'], {
        errorMap: () => ({ message: 'Risk tolerance must be one of: low, medium, high' })
      }),
      sectorPreference: z.string().min(1).max(50, 'Sector preference must be less than 50 characters'),
      investmentGoal: z.string().min(1).max(100, 'Investment goal must be less than 100 characters')
    });

    let userProfile;
    try {
      userProfile = userProfileSchema.parse(requestBody.userProfile);
    } catch (validationError) {
      logError('Invalid user profile data', validationError);
      if (validationError instanceof z.ZodError) {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid user profile data',
            details: validationError.errors.map(e => `${e.path.join('.')}: ${e.message}`)
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error('Invalid user profile data');
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

    // Prepare prompt for Gemini
    const stocksToAnalyze = availableStocks.slice(0, 100);
    const prompt = createAIPrompt(userProfile, dbProfile, stocksToAnalyze);
    
    logInfo(`Calling Gemini API`, {
      model: GEMINI_MODEL,
      stockCount: stocksToAnalyze.length,
      promptLength: prompt.length
    });

    const geminiStartTime = Date.now();

    const { response, model: usedModel } = await fetchGeminiWithFallback(
      (model) => geminiGenerateContentUrl(model),
      () => ({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiApiKey,
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
            temperature: 1.0, // Gemini 3's recommended default; also keeps explanations varied
            // Thinking tokens count toward this limit, so leave room beyond the ~4K-token JSON answer
            maxOutputTokens: 16000,
            responseMimeType: 'application/json',
            thinkingConfig: { thinkingLevel: 'low' },
          }
        }),
      })
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
      model: usedModel,
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
  const stockList = stocks.map((s, i) => 
    `[${i+1}] ${s.ticker} (${s.company_name}): ${s.sector}, P/E: ${s.pe_ratio}, 1Y Return: ${s.one_year_return}%, Risk: ${s.risk_level}, Price: $${s.price_per_share}, Div: ${s.dividend_yield}%, MCap: ${s.market_cap}, CEO: ${s.ceo_name}`
  ).join('\n');

  const age = userProfile.age;
  const lifeStage = age < 30 ? 'early career' : age < 45 ? 'mid-career' : age < 60 ? 'pre-retirement' : 'retirement';
  const yearsToRetirement = Math.max(0, 65 - age);

  return `You are an expert wealth advisor having a one-on-one conversation with your client. Write COMPLETELY UNIQUE explanations for each recommended stock.

📋 CLIENT PROFILE:
• ${userProfile.age} years old, ${userProfile.gender}
• ${lifeStage} phase (${yearsToRetirement} years until typical retirement)
• Annual income: $${userProfile.salary.toLocaleString()}
• Investment experience: ${userProfile.experience}
• Risk comfort: ${userProfile.riskTolerance}
• Sector interest: ${userProfile.sectorPreference}
• Investment goal: ${userProfile.investmentGoal}
${dbProfile ? `• Additional insights: ${JSON.stringify(dbProfile)}` : ''}

📊 AVAILABLE STOCKS:
${stockList}

🚨 CRITICAL UNIQUENESS RULES - EACH EXPLANATION MUST:
1. Use a DIFFERENT opening sentence structure:
   ❌ BANNED PATTERNS (never repeat these):
      - "As a [age/experience] investor..."
      - "Given your [attribute]..."
      - "With your [profile detail]..."
      - "Your [characteristic] makes this..."
      - "[Company] is perfect for..."
   
   ✅ VARY YOUR OPENINGS (use different ones for each):
      - Start with a question
      - Start with a surprising fact about the company
      - Start with what they might not know
      - Start with a specific number/metric
      - Start with a real-world scenario
      - Start with the company's mission
      - Start with recent news/developments
      - Start with competitive advantage

2. Tell a DIFFERENT STORY for each stock (never repeat these angles):
   • Stock 1: Focus on company's innovation/disruption
   • Stock 2: Focus on personal connection (products they use)
   • Stock 3: Focus on CEO's vision/leadership style
   • Stock 4: Focus on financial stability/metrics
   • Stock 5: Focus on growth trajectory/future potential
   • Stock 6: Focus on dividend income stream
   • Stock 7: Focus on market position/moat
   • Stock 8: Focus on risk/reward balance
   • Stock 9: Focus on timing/market conditions
   • Stock 10: Focus on alignment with their goals

3. Use VARIED SENTENCE STRUCTURES:
   - Mix short punchy sentences with longer analytical ones
   - Vary passive/active voice
   - Use different rhetorical devices (questions, statements, scenarios)
   - Change paragraph flow (some linear, some compare/contrast)

4. Reference their SPECIFIC DATA in DIFFERENT CONTEXTS:
   • Age ${userProfile.age}: Time horizon, life stage, risk capacity
   • Income $${userProfile.salary.toLocaleString()}: Affordability, dividend impact, diversification
   • Experience ${userProfile.experience}: Complexity tolerance, due diligence ability
   • Goal ${userProfile.investmentGoal}: Strategy alignment, timeline fit

5. NO GENERIC PHRASES - BAN THESE:
   ❌ "Portfolio's best friend"
   ❌ "Secret sauce"
   ❌ "Champion of dreams"
   ❌ "Market magic"
   ❌ "Golden goose"
   ❌ "Express to profit town"
   ❌ Any other cliché investment phrases

🎯 YOUR TASK:
Select 5-10 stocks that genuinely fit this client's profile. For EACH stock, write 120-160 words that:
• Sound like you're speaking directly to them in their office
• Reference specific aspects of their life situation
• Explain why THIS stock makes sense for THEIR goals
• Use completely different wording and structure than the others
• Avoid any investment clichés or marketing speak

📝 RESPONSE FORMAT (pure JSON, no markdown):
{
  "recommendations": [
    {
      "ticker": "AAPL",
      "confidence": 0.92,
      "explanation": "[120-160 words in conversational tone, completely unique structure and content]",
      "allocation_percentage": 15
    }
  ]
}

⚠️ QUALITY CHECK: Before finalizing, ensure:
✓ No two explanations start the same way
✓ No repeated phrases across any explanations
✓ Each uses a different storytelling angle
✓ All reference specific client data in varied contexts
✓ No investment clichés present
✓ Maximum 30% allocation to any single sector
✓ Risk levels match client's ${userProfile.riskTolerance} tolerance`;
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