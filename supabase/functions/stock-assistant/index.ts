import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { FinnhubClient, FinnhubNewsItem } from '../_shared/finnhub.ts';
import { GEMINI_MODEL, GEMINI_OPENAI_CHAT_URL, getGeminiApiKey } from '../_shared/gemini.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SECTOR_TABLES = [
  'technology_stocks',
  'healthcare_stocks',
  'finance_stocks',
  'energy_stocks',
  'consumer_stocks',
  'utilities_stocks',
];

const round = (n: unknown, digits = 2) =>
  typeof n === 'number' && Number.isFinite(n) ? Number(n.toFixed(digits)) : null;

// Data for the assistant's tools: live quotes/news/metrics from Finnhub, plus the app's own
// stock tables and company_profiles for CEO, description, employees and HQ.
class StockDataService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor(private finnhub: FinnhubClient, private db: SupabaseClient) {}

  private async cached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const hit = this.cache.get(key);
    if (hit && Date.now() - hit.timestamp < this.cacheTimeout) return hit.data;
    const data = await fetcher();
    this.cache.set(key, { data, timestamp: Date.now() });
    return data;
  }

  async getQuote(symbol: string) {
    const sym = symbol.toUpperCase();
    const quote = await this.cached(`quote_${sym}`, () => this.finnhub.getQuote(sym));
    if (!quote) return { error: `No quote found for ${sym}. It may be delisted or not a US-listed ticker.` };
    return {
      symbol: sym,
      price: quote.c,
      change: round(quote.d),
      changePercent: round(quote.dp),
      open: quote.o,
      dayHigh: quote.h,
      dayLow: quote.l,
      previousClose: quote.pc,
      asOf: new Date(quote.t * 1000).toISOString(),
    };
  }

  private async getStoredStock(sym: string) {
    const results = await Promise.all(SECTOR_TABLES.map(table =>
      this.db.from(table)
        .select('company_name, ceo_name, ceo_highlights, pe_ratio, market_cap, one_year_return, price_per_share, dividend_yield, risk_level, esg_score')
        .eq('ticker', sym)
        .maybeSingle()
    ));
    return results.find(r => r.data)?.data ?? null;
  }

  async getProfile(symbol: string) {
    const sym = symbol.toUpperCase();
    return this.cached(`profile_${sym}`, async () => {
      const [profile, stored, facts] = await Promise.all([
        this.finnhub.getProfile(sym),
        this.getStoredStock(sym),
        this.db.from('company_profiles')
          .select('description, full_time_employees, city, state, country')
          .eq('ticker', sym)
          .maybeSingle()
          .then(r => r.data),
      ]);
      if (!profile && !stored && !facts) return { error: `No company found for ${sym}.` };
      return {
        symbol: sym,
        name: profile?.name ?? stored?.company_name ?? sym,
        industry: profile?.finnhubIndustry,
        description: facts?.description,
        employees: facts?.full_time_employees,
        headquarters: [facts?.city, facts?.state, facts?.country].filter(Boolean).join(', ') || undefined,
        ceo: stored?.ceo_name,
        ceoHighlights: stored?.ceo_highlights,
        marketCapUsdMillions: profile?.marketCapitalization,
        ipoDate: profile?.ipo,
        website: profile?.weburl,
        peRatio: stored?.pe_ratio,
        dividendYieldPercent: stored?.dividend_yield,
        oneYearReturnPercent: stored?.one_year_return,
        riskLevel: stored?.risk_level,
        esgScore: stored?.esg_score,
      };
    });
  }

  async getPricePerformance(symbol: string) {
    const sym = symbol.toUpperCase();
    const m = await this.cached(`metrics_${sym}`, () => this.finnhub.getMetrics(sym));
    if (!m) return { error: `No performance data found for ${sym}.` };
    return {
      symbol: sym,
      returnPercent: {
        fiveDay: round(m['5DayPriceReturnDaily']),
        monthToDate: round(m['monthToDatePriceReturnDaily']),
        thirteenWeek: round(m['13WeekPriceReturnDaily']),
        twentySixWeek: round(m['26WeekPriceReturnDaily']),
        yearToDate: round(m['yearToDatePriceReturnDaily']),
        fiftyTwoWeek: round(m['52WeekPriceReturnDaily']),
      },
      fiftyTwoWeekHigh: m['52WeekHigh'],
      fiftyTwoWeekHighDate: m['52WeekHighDate'],
      fiftyTwoWeekLow: m['52WeekLow'],
      fiftyTwoWeekLowDate: m['52WeekLowDate'],
      beta: round(m['beta']),
      peTTM: round(m.peTTM),
      dividendYieldPercent: round(m.currentDividendYieldTTM),
    };
  }

  private toNews(item: FinnhubNewsItem) {
    return {
      headline: item.headline,
      source: item.source,
      publishedAt: new Date(item.datetime * 1000).toISOString(),
      summary: item.summary,
      url: item.url,
    };
  }

  async getCompanyNews(symbol: string, limit = 5) {
    const sym = symbol.toUpperCase();
    const news = await this.cached(`news_${sym}`, () => this.finnhub.getCompanyNews(sym));
    return news.slice(0, Math.min(limit, 20)).map(item => this.toNews(item));
  }

  async getMarketNews(limit = 10) {
    const news = await this.cached('market_news', () => this.finnhub.getMarketNews());
    return news.slice(0, Math.min(limit, 20)).map(item => this.toNews(item));
  }

  // Ranks the app's tracked stocks by 1-year return (Finnhub's free tier has no market-wide movers)
  async getTopPerformers(type: 'best' | 'worst', limit = 5) {
    const ascending = type === 'worst';
    const results = await Promise.all(SECTOR_TABLES.map(table =>
      this.db.from(table)
        .select('ticker, company_name, one_year_return, price_per_share')
        .order('one_year_return', { ascending })
        .limit(limit)
    ));
    const seen = new Set<string>();
    return results
      .flatMap(r => r.data ?? [])
      .filter(row => !seen.has(row.ticker) && seen.add(row.ticker))
      .sort((a, b) => ascending ? a.one_year_return - b.one_year_return : b.one_year_return - a.one_year_return)
      .slice(0, limit)
      .map(row => ({
        symbol: row.ticker,
        name: row.company_name,
        oneYearReturnPercent: row.one_year_return,
        price: row.price_per_share,
      }));
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[stock-assistant] Request received');

    // Check environment variables first
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY');
    const finnhubApiKey = Deno.env.get('FINNHUB_API_KEY');
    const geminiApiKey = getGeminiApiKey();

    if (!supabaseUrl || !supabaseKey) {
      console.error('[stock-assistant] Missing Supabase credentials');
      return new Response(JSON.stringify({ error: 'Server configuration error: Supabase credentials missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!finnhubApiKey) {
      console.error('[stock-assistant] Missing FINNHUB_API_KEY');
      return new Response(JSON.stringify({ error: 'Server configuration error: Finnhub API key missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!geminiApiKey) {
      console.error('[stock-assistant] Missing GEMINI_API_KEY');
      return new Response(JSON.stringify({ error: 'Server configuration error: Gemini API key missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('[stock-assistant] No authorization header');
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client
  console.log('[stock-assistant] Initializing Supabase client');
  // Use service role key to bypass RLS for subscription checks
  const supabaseServiceRole = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
  const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user - extract JWT from Authorization header
    console.log('[stock-assistant] Verifying user');
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.error('[stock-assistant] User auth failed:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.log('[stock-assistant] User authenticated:', user.id);

    // Check subscription status using service role to bypass RLS
    console.log('[stock-assistant] Checking subscription for user:', user.id);
    const { data: subscription, error: subError } = await supabaseServiceRole
      .from('subscribers')
      .select('subscribed, subscription_tier, subscription_end')
      .eq('user_id', user.id)
      .single();

    console.log('[stock-assistant] Subscription data:', JSON.stringify(subscription));
    console.log('[stock-assistant] Subscription error:', subError);

    const isPremium = subscription?.subscribed === true || subscription?.subscription_tier === 'premium';
    console.log('[stock-assistant] isPremium:', isPremium);

    // Parse request body
    const { message, conversationId } = await req.json();

    // For free users, check message limit (5 free messages per 24 hours)
    if (!isPremium) {
      // Get all user's conversation IDs
      const { data: userConversations } = await supabaseServiceRole
        .from('ai_chat_conversations')
        .select('id')
        .eq('user_id', user.id);

      const conversationIds = userConversations?.map(c => c.id) || [];

      // Count user messages from the last 24 hours only
      let totalUserMessages = 0;
      if (conversationIds.length > 0) {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        
        const { count } = await supabaseServiceRole
          .from('ai_chat_messages')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'user')
          .in('conversation_id', conversationIds)
          .gte('created_at', twentyFourHoursAgo);
        
        totalUserMessages = count || 0;
      }

      // Add 1 to account for the current message being sent
      const messagesUsedIncludingCurrent = totalUserMessages + 1;
      console.log('[stock-assistant] Free user messages in last 24h (including current):', messagesUsedIncludingCurrent);

      if (messagesUsedIncludingCurrent > 5) {
        console.log('[stock-assistant] User exceeded free message limit');
        return new Response(JSON.stringify({
          type: 'upgrade_required',
          message: 'You\'ve used your 5 free AI messages in the last 24 hours! Your limit will reset automatically, or upgrade to Premium for unlimited AI stock research, real-time analysis, and expert market guidance.',
          freeMessagesSent: messagesUsedIncludingCurrent - 1
        }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('[stock-assistant] Free user has', 5 - messagesUsedIncludingCurrent + 1, 'messages remaining in next 24h');
    }

    console.log('[stock-assistant] Proceeding with AI request');

    // Create authenticated Supabase client for user-specific operations
    const supabaseAuth = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });

    // Get or create conversation
    let convId = conversationId;
    if (!convId) {
      console.log('[stock-assistant] Creating new conversation');
      const { data: newConv, error: convError } = await supabaseAuth
        .from('ai_chat_conversations')
        .insert({
          user_id: user.id,
          title: message.substring(0, 50) + '...'
        })
        .select()
        .single();

      if (convError) {
        console.error('[stock-assistant] Error creating conversation:', convError);
        throw convError;
      }
      convId = newConv.id;
      console.log('[stock-assistant] Created conversation:', convId);
    }

    // Save user message using authenticated client
    console.log('[stock-assistant] Saving user message');
    const { error: msgError } = await supabaseAuth.from('ai_chat_messages').insert({
      conversation_id: convId,
      role: 'user',
      content: message
    });
    
    if (msgError) {
      console.error('[stock-assistant] Error saving message:', msgError);
      throw msgError;
    }

    // Load conversation history
    const { data: messages } = await supabaseAuth
      .from('ai_chat_messages')
      .select('role, content')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    // Get user profile for context
    const { data: profile } = await supabaseAuth
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const stockData = new StockDataService(new FinnhubClient(finnhubApiKey), supabaseServiceRole);

    // Define tools for AI
    const tools = [
      {
        type: "function",
        function: {
          name: "get_stock_quote",
          description: "Get real-time stock price, volume, change, and percent change",
          parameters: {
            type: "object",
            properties: {
              symbol: { type: "string", description: "Stock ticker symbol (e.g., AAPL, MSFT)" }
            },
            required: ["symbol"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_company_profile",
          description: "Get detailed company information including sector, industry, CEO, description, market cap, number of employees, business overview, and company history",
          parameters: {
            type: "object",
            properties: {
              symbol: { type: "string", description: "Stock ticker symbol" }
            },
            required: ["symbol"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_company_news",
          description: "Get recent news articles and headlines for a specific stock. Use this to provide context about what's happening with the company",
          parameters: {
            type: "object",
            properties: {
              symbol: { type: "string", description: "Stock ticker symbol" },
              limit: { type: "number", description: "Number of news items to fetch (default: 5, max: 20)", default: 5 }
            },
            required: ["symbol"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_market_news",
          description: "Get general market news and updates. Use this to provide context about overall market conditions, economic news, and market sentiment",
          parameters: {
            type: "object",
            properties: {
              limit: { type: "number", description: "Number of news items to fetch (default: 10, max: 20)", default: 10 }
            },
            required: []
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_top_performers",
          description: "Get the best or worst performing stocks by 1-year return among the stocks tracked in this app",
          parameters: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: ["best", "worst"],
                description: "Whether to return the best or worst performers"
              },
              limit: { type: "number", description: "Number of stocks to return (default: 5, max: 10)", default: 5 }
            },
            required: ["type"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_price_performance",
          description: "Get a stock's price returns over 5 days, month-to-date, 13 weeks, 26 weeks, year-to-date and 52 weeks, plus its 52-week high/low, beta, P/E and dividend yield. Use this to analyze trends and performance over time",
          parameters: {
            type: "object",
            properties: {
              symbol: { type: "string", description: "Stock ticker symbol" }
            },
            required: ["symbol"]
          }
        }
      }
    ];

    // System prompt
    const systemPrompt = `You are a Stock Education Assistant. Your role is to educate users about investing and markets.

CRITICAL RULES:
1. EDUCATIONAL FOCUS - Explain concepts, don't give financial advice. Never say "buy" or "sell".
2. USE TOOLS - Always fetch real-time data when discussing specific stocks using the available tools.
3. ANALYZE THE DATA - When you receive tool results, provide YOUR OWN analysis and insights.
4. BE CONVERSATIONAL - Friendly, encouraging, use analogies for complex concepts.
5. CITE SOURCES - Reference the data you fetch ("According to today's data...", "Currently trading at...").
6. DISCLAIMERS - Remind users this is educational content, not investment advice.
7. USER CONTEXT - Consider their experience level: ${profile?.investment_experience || 'beginner'}
8. USE NEWS CONTEXT - When discussing stocks, use get_company_news to provide recent developments. Use get_market_news for market condition questions.

User Profile Summary:
- Risk Tolerance: ${profile?.risk_tolerance || 'moderate'}
- Investment Goals: ${profile?.investment_goals?.join(', ') || 'not specified'}
- Experience: ${profile?.investment_experience || 'beginner'}
- Interests: ${profile?.sectors_of_interest?.join(', ') || 'not specified'}

RESPONSE GUIDELINES:
- For PRICE questions ("What's the price of X?"): Give a direct answer with the current price, change, and volume.
- For PERFORMANCE questions ("How is X performing?"): Analyze the data and explain what the numbers mean - is the stock up or down? By how much? What's the context?
- For COMPANY questions ("Tell me about X"): Use get_company_profile for details AND get_company_news for recent developments.
- For MARKET questions ("How's the market?"): Use get_market_news for general market conditions and get_top_performers for the strongest and weakest stocks in the app.
- For COMPARISON questions: Fetch multiple stocks and compare their metrics side by side.
- Always interpret the raw data - explain what the numbers tell us about the stock's movement.

When users ask about stocks:
- Use get_stock_quote for current prices and changes
- Use get_company_profile for company details (sector, industry, CEO, description, employees)
- Use get_company_news for recent news about a specific stock
- Use get_market_news for general market conditions and sentiment
- Use get_top_performers to find the best or worst 1-year performers among the app's stocks
- Use get_price_performance for trends over time (5-day through 52-week returns, 52-week high/low)
- Compare stocks using data from multiple calls

NEWS HANDLING:
- Summarize key headlines, don't list raw data
- Explain how news might relate to the user's investment profile
- Connect news to stock performance when relevant

Format responses:
- Start with the direct answer to their question
- Use bullet points for additional details
- Short paragraphs (2-3 sentences)
- Use markdown for emphasis (**bold** for key numbers)
- Include disclaimers

Current date: ${new Date().toISOString().split('T')[0]}`;

    // Call Gemini (OpenAI-compatible endpoint) with streaming and timeout
    console.log(`[stock-assistant] [${new Date().toISOString()}] Calling Gemini ${GEMINI_MODEL}`);
    const aiCallStart = Date.now();
    
    // Create timeout promise (45 seconds)
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('AI request timeout after 45 seconds')), 45000)
    );
    
    const fetchPromise = fetch(GEMINI_OPENAI_CHAT_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${geminiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GEMINI_MODEL,
        reasoning_effort: 'low',
        messages: [
          { role: 'system', content: systemPrompt },
          ...(messages || [])
        ],
        tools,
        stream: true,
      }),
    });
    
    const aiResponse = await Promise.race([fetchPromise, timeoutPromise]);

    if (!aiResponse.ok) {
      const errorBody = await aiResponse.text();
      console.error('[stock-assistant] AI gateway error:', aiResponse.status, errorBody);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: `AI service error: ${aiResponse.status}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const aiCallDuration = Date.now() - aiCallStart;
    console.log(`[stock-assistant] [${new Date().toISOString()}] AI response received in ${aiCallDuration}ms, starting stream`);

    // Stream response back to client
    const stream = new ReadableStream({
      async start(controller) {
        const reader = aiResponse.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let collectedToolCalls: any[] = [];
        let toolCallsComplete = false;
        let directContent = ''; // Capture text-only responses
        
        // Accumulate streaming tool calls by index
        // extra_content carries Gemini's thought signature, which must be sent back with the tool results
        const pendingToolCalls: Map<number, { id: string; name: string; arguments: string; extra_content?: unknown }> = new Map();

        try {
          // PHASE 1: Collect tool calls AND stream any direct content
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              toolCallsComplete = true;
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.trim() || line.startsWith(':')) continue;
              if (!line.startsWith('data: ')) continue;

              const data = line.slice(6).trim();
              if (data === '[DONE]') {
                toolCallsComplete = true;
                break;
              }

              try {
                const parsed = JSON.parse(data);
                const choice = parsed.choices?.[0];

                // Stream direct content immediately (text-only responses)
                if (choice?.delta?.content) {
                  directContent += choice.delta.content;
                  controller.enqueue(
                    new TextEncoder().encode(
                      `data: ${JSON.stringify({ type: 'content_delta', delta: choice.delta.content })}\n\n`
                    )
                  );
                }

                // Accumulate tool calls across streaming chunks
                if (choice?.delta?.tool_calls) {
                  for (const toolCall of choice.delta.tool_calls) {
                    // Gemini may send each complete call without an index; a new id means a new call
                    let idx = toolCall.index ?? 0;
                    const existing = pendingToolCalls.get(idx);
                    if (toolCall.index === undefined && existing?.id && toolCall.id && existing.id !== toolCall.id) {
                      idx = pendingToolCalls.size;
                    }
                    if (!pendingToolCalls.has(idx)) {
                      pendingToolCalls.set(idx, { id: '', name: '', arguments: '' });
                    }
                    const pending = pendingToolCalls.get(idx)!;
                    if (toolCall.id) pending.id = toolCall.id;
                    if (toolCall.function?.name) pending.name += toolCall.function.name;
                    if (toolCall.function?.arguments) pending.arguments += toolCall.function.arguments;
                    if (toolCall.extra_content) pending.extra_content = toolCall.extra_content;
                  }
                }

                // Check if streaming finished (finish_reason)
                if (choice?.finish_reason === 'tool_calls' || choice?.finish_reason === 'stop') {
                  toolCallsComplete = true;
                  break;
                }
              } catch (e) {
                console.error('Error parsing SSE:', e);
              }
            }

            if (toolCallsComplete) break;
          }

          // Execute accumulated tool calls after stream completes
          for (const [, pending] of pendingToolCalls) {
            if (!pending.name) continue;
            const toolName = pending.name;
            const toolArgs = JSON.parse(pending.arguments || '{}');
            const toolId = pending.id || `call_${Date.now()}_${Math.random()}`;

            const toolCallStart = Date.now();
            console.log(`[${new Date().toISOString()}] [Tool Call] ${toolName}`, toolArgs);

            // Execute tool with error handling
            let toolResult;
            try {
              if (toolName === 'get_stock_quote') {
                toolResult = await stockData.getQuote(toolArgs.symbol);
              } else if (toolName === 'get_company_profile') {
                toolResult = await stockData.getProfile(toolArgs.symbol);
              } else if (toolName === 'get_company_news') {
                toolResult = await stockData.getCompanyNews(toolArgs.symbol, toolArgs.limit || 5);
              } else if (toolName === 'get_market_news') {
                toolResult = await stockData.getMarketNews(toolArgs.limit || 10);
              } else if (toolName === 'get_top_performers') {
                toolResult = await stockData.getTopPerformers(toolArgs.type, Math.min(toolArgs.limit || 5, 10));
              } else if (toolName === 'get_price_performance') {
                toolResult = await stockData.getPricePerformance(toolArgs.symbol);
              } else {
                toolResult = { error: `Unknown tool: ${toolName}` };
              }
            } catch (toolError) {
              console.error(`[Tool Error] ${toolName}:`, toolError);
              toolResult = { error: `Unable to fetch data: ${toolError instanceof Error ? toolError.message : String(toolError)}` };
            }
            
            const toolCallDuration = Date.now() - toolCallStart;
            console.log(`[${new Date().toISOString()}] [Tool Call Complete] ${toolName} took ${toolCallDuration}ms`);

            collectedToolCalls.push({ 
              id: toolId,
              name: toolName, 
              args: toolArgs, 
              result: toolResult,
              extra_content: pending.extra_content,
            });

            // Send tool call to client for visibility
            controller.enqueue(
              new TextEncoder().encode(
                `data: ${JSON.stringify({ 
                  type: 'tool_call', 
                  tool: { name: toolName, args: toolArgs, result: toolResult }
                })}\n\n`
              )
            );
          }

          // PHASE 2: If we have tool calls, make follow-up request with results
          if (collectedToolCalls.length > 0) {
            console.log(`[${new Date().toISOString()}] [stock-assistant] Making follow-up call with tool results`);
            
            // Send analyzing status to client
            controller.enqueue(
              new TextEncoder().encode(
                `data: ${JSON.stringify({ type: 'analyzing' })}\n\n`
              )
            );

            // Build messages array with tool results
            const followUpMessages = [
              { role: 'system', content: systemPrompt },
              ...(messages || []),
              {
                role: 'assistant',
                content: null,
                tool_calls: collectedToolCalls.map(tc => ({
                  id: tc.id,
                  type: 'function',
                  function: {
                    name: tc.name,
                    arguments: JSON.stringify(tc.args)
                  },
                  ...(tc.extra_content ? { extra_content: tc.extra_content } : {})
                }))
              },
              ...collectedToolCalls.map(tc => ({
                role: 'tool',
                tool_call_id: tc.id,
                content: JSON.stringify(tc.result)
              }))
            ];

            // Make follow-up API call for analysis with timeout
            const followUpStart = Date.now();
            const followUpTimeoutPromise = new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Follow-up AI request timeout after 45 seconds')), 45000)
            );
            
            const followUpFetchPromise = fetch(GEMINI_OPENAI_CHAT_URL, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${geminiApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: GEMINI_MODEL,
                reasoning_effort: 'low',
                messages: followUpMessages,
                tools,
                tool_choice: 'none',
                stream: true,
              }),
            });

            const followUpResponse = await Promise.race([followUpFetchPromise, followUpTimeoutPromise]);
            const followUpDuration = Date.now() - followUpStart;
            console.log(`[${new Date().toISOString()}] [stock-assistant] Follow-up response received in ${followUpDuration}ms`);

            if (!followUpResponse.ok) {
              console.error('[stock-assistant] Follow-up error body:', await followUpResponse.text());
              throw new Error(`Follow-up AI request failed: ${followUpResponse.status}`);
            }

            // Stream the follow-up response
            const followUpReader = followUpResponse.body!.getReader();
            let followUpBuffer = '';
            let assistantMessage = '';

            while (true) {
              const { done, value } = await followUpReader.read();
              if (done) break;

              followUpBuffer += decoder.decode(value, { stream: true });
              const followUpLines = followUpBuffer.split('\n');
              followUpBuffer = followUpLines.pop() || '';

              for (const line of followUpLines) {
                if (!line.trim() || line.startsWith(':')) continue;
                if (!line.startsWith('data: ')) continue;

                const data = line.slice(6).trim();
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  const choice = parsed.choices?.[0];

                  // Stream content delta
                  if (choice?.delta?.content) {
                    assistantMessage += choice.delta.content;
                    controller.enqueue(
                      new TextEncoder().encode(
                        `data: ${JSON.stringify({ type: 'content_delta', delta: choice.delta.content })}\n\n`
                      )
                    );
                  }
                } catch (e) {
                  console.error('Error parsing follow-up SSE:', e);
                }
              }
            }

            // Save assistant message with tool calls
            if (assistantMessage) {
              await supabaseAuth.from('ai_chat_messages').insert({
                conversation_id: convId,
                role: 'assistant',
                content: assistantMessage,
                tool_calls: collectedToolCalls.length > 0
                  ? collectedToolCalls.map(({ extra_content: _sig, ...tc }) => tc)
                  : null
              });
            }
          } else if (directContent) {
            // No tool calls, but we have direct content - save it
            console.log('[stock-assistant] Text-only response, saving to DB');
            await supabaseAuth.from('ai_chat_messages').insert({
              conversation_id: convId,
              role: 'assistant',
              content: directContent
            });
          }

          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          console.log(`[${new Date().toISOString()}] [stock-assistant] Stream completed successfully`);
          controller.close();
        } catch (e) {
          console.error(`[${new Date().toISOString()}] [stock-assistant] Stream error:`, e);
          
          // Send error to client
          try {
            controller.enqueue(
              new TextEncoder().encode(
                `data: ${JSON.stringify({ 
                  type: 'error', 
                  message: e instanceof Error ? e.message : 'Unknown error occurred' 
                })}\n\n`
              )
            );
          } catch (encodeError) {
            console.error('Failed to send error to client:', encodeError);
          }
          
          controller.error(e);
        }
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('stock-assistant error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});