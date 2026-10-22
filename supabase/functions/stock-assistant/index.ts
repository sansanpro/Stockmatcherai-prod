import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { FinnhubClient, FinnhubNewsItem } from '../_shared/finnhub.ts';
import { GEMINI_MODEL, GEMINI_MODELS, GEMINI_OPENAI_CHAT_URL, fetchGeminiWithFallback, getGeminiApiKey, isRetryableGeminiStatus, logAiError } from '../_shared/gemini.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const round = (n: unknown, digits = 2) =>
  typeof n === 'number' && Number.isFinite(n) ? Number(n.toFixed(digits)) : null;

// Data for the assistant's tools: live quotes/news/metrics from Finnhub, plus the app's own
// stocks table for CEO, ratios, description, employees and HQ.
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
    const { data } = await this.db.from('stocks')
      .select('company_name, ceo_name, ceo_highlights, pe_ratio, market_cap, one_year_return, price_per_share, dividend_yield, risk_level, description, full_time_employees, city, state, country, industry, website, ipo_date, finnhub_synced_at, mission_story, proof, proof_source_url, things_to_know')
      .eq('ticker', sym)
      .maybeSingle();
    return data;
  }

  async getProfile(symbol: string) {
    const sym = symbol.toUpperCase();
    return this.cached(`profile_${sym}`, async () => {
      const [stored, { data: missions }] = await Promise.all([
        this.getStoredStock(sym),
        // The causes it works on (reviewed tags), with how central each is to the business
        this.db.from('stock_missions').select('exposure, why_line, causes(label)')
          .eq('ticker', sym).eq('status', 'approved').neq('exposure', 'peripheral'),
      ]);
      // stocks already holds Finnhub's static fields once synced; only call it otherwise
      const profile = stored?.finnhub_synced_at ? null : await this.finnhub.getProfile(sym).catch(() => null);
      if (!profile && !stored) return { error: `No company found for ${sym}.` };
      return {
        // Reviewed, sourced facts from StockMatcher's company research (prefer these when relevant)
        whatItWorksOn: stored?.mission_story ?? undefined,
        causes: (missions ?? []).map((m: any) => ({
          cause: m.causes?.label,
          howCentral: m.exposure === 'core' ? 'core business' : 'part of the business',
          why: m.why_line,
        })),
        proof: stored?.proof ? { fact: stored.proof, source: stored.proof_source_url } : undefined,
        thingsToKnow: stored?.things_to_know ?? undefined,
        symbol: sym,
        name: stored?.company_name ?? profile?.name ?? sym,
        industry: stored?.industry ?? profile?.finnhubIndustry,
        description: stored?.description,
        employees: stored?.full_time_employees,
        headquarters: [stored?.city, stored?.state, stored?.country].filter(Boolean).join(', ') || undefined,
        ceo: stored?.ceo_name,
        ceoHighlights: stored?.ceo_highlights,
        marketCap: stored?.market_cap,
        ipoDate: stored?.ipo_date ?? profile?.ipo,
        website: stored?.website ?? profile?.weburl,
        peRatio: stored?.pe_ratio,
        dividendYieldPercent: stored?.dividend_yield,
        oneYearReturnPercent: stored?.one_year_return,
        riskLevel: stored?.risk_level,
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
    const { data } = await this.db.from('stocks')
      .select('ticker, company_name, one_year_return, price_per_share')
      .not('one_year_return', 'is', null)
      .order('one_year_return', { ascending })
      .limit(limit);
    return (data ?? [])
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

      // Count answered questions (saved answers) from the last 24 hours, so a question the AI
      // couldn't answer (e.g. Gemini busy) doesn't use one up
      let totalUserMessages = 0;
      if (conversationIds.length > 0) {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        
        const { count } = await supabaseServiceRole
          .from('ai_chat_messages')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'assistant')
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
          message: 'You\'ve used your 5 free questions. Each one frees up again 24 hours after you asked it, or upgrade to Premium to ask as many as you like.',
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
      .select('causes, dealbreakers, risk_tolerance, investment_goals, investment_experience')
      .eq('user_id', user.id)
      .maybeSingle();

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
          description: "Get company information: what it works on, the causes it relates to, a sourced proof fact, things to know, plus industry, CEO, description, market cap, employees and headquarters",
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
    // The user's causes (ranked) and onboarding answers, in words
    const { data: causeRows } = await supabaseServiceRole.from('causes').select('id, label');
    const causeLabel = new Map((causeRows ?? []).map(c => [c.id, c.label]));
    const userCauses = (profile?.causes ?? []).map((c: string) => causeLabel.get(c) ?? c);
    const experienceWords: Record<string, string> = {
      never: 'first-time (has never bought a stock)', none: 'first-time (has never bought a stock)',
      few: 'new (has bought a stock a few times)', beginner: 'new',
      comfortable: 'somewhat experienced', intermediate: 'somewhat experienced', advanced: 'experienced',
    };
    const systemPrompt = `You are StockMatcher's AI assistant: a friendly stock education guide for a ${experienceWords[profile?.investment_experience ?? ''] ?? 'new'} investor.

STYLE
- Lead with the direct answer in 1-2 sentences, then at most 4 short bullets. Keep it under 150 words unless the user asks for more detail.
- No greetings, no restating the question, no filler.
- Plain language. Use one quick analogy only when explaining a concept.
- Use **bold** for key numbers and cite them naturally ("trading at **$214.13** today").
- Educational only: never tell the user to buy or sell. End with this exact line: _Educational only, not investment advice._

DATA
- Use tools only when the question needs current data about specific stocks or the market. Answer general concept questions (like "what is a P/E ratio") directly, without tools.
- Request everything you need in ONE round of parallel tool calls. Only make a second round if the first results make it essential.
- Only state numbers that come from tool results. If something isn't available (for example trading volume), say so in one short sentence and answer with what you have.
- get_top_performers ranks only the stocks tracked in this app, by 1-year return.
- For news, summarize the 2-3 most relevant headlines; don't list them all.

VALUES
- StockMatcher helps people find companies working on causes they care about; they decide for themselves.
- When a company comes up, get_company_profile includes its reviewed research: whatItWorksOn, the causes it works on, a proof fact with its source, and thingsToKnow. Use those facts (and only those) to explain how it relates to the user's causes, and mention a thing to know when it matters.
- A company matches a cause only if that cause is in its causes list. Never link it to any other cause, even one the user cares about; if asked, say StockMatcher hasn't matched it to that cause.
- Never call a company a good or bad investment, and never recommend buying, selling or how much to put in.
- Never give medical advice. Describe what a company's medicines or devices are for, not whether a treatment is right for anyone; for health questions, suggest asking a doctor.

USER (relate answers to this when relevant)
- Causes they care about, most important first: ${userCauses.length ? userCauses.join(', ') : 'not chosen yet'}
- Never wants money going to: ${profile?.dealbreakers?.length ? profile.dealbreakers.join(', ').replace(/_/g, ' ') : 'nothing specified'}
- If a stock they own dropped 20% in a month, they would: ${({ low: 'sell', medium: 'wait it out', high: 'buy a little more if they still believed in it' } as Record<string, string>)[profile?.risk_tolerance ?? ''] ?? 'not specified'}
- What the money is for: ${profile?.investment_goals?.join(', ').replace(/_/g, ' ') || 'not specified'}

Current date: ${new Date().toISOString().split('T')[0]}`;

    // Call Gemini (OpenAI-compatible endpoint) with streaming and timeout
    console.log(`[stock-assistant] [${new Date().toISOString()}] Calling Gemini ${GEMINI_MODEL}`);
    const aiCallStart = Date.now();
    
    // Create timeout promise (45 seconds)
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('AI request timeout after 45 seconds')), 45000)
    );
    
    const geminiRequest = (model: string, body: Record<string, unknown>): RequestInit => ({
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${geminiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, reasoning_effort: 'low', stream: true, ...body }),
    });

    const fetchPromise = fetchGeminiWithFallback(
      () => GEMINI_OPENAI_CHAT_URL,
      (model) => geminiRequest(model, {
        messages: [
          { role: 'system', content: systemPrompt },
          ...(messages || [])
        ],
        tools,
      }),
      { db: supabaseServiceRole },
    );
    
    const { response: aiResponse, model: firstModel, failures: firstFailures } = await Promise.race([fetchPromise, timeoutPromise]);
    console.log(`[stock-assistant] First response from ${firstModel}`);
    const logError = (stage: string, message: string, extra: { model?: string; status?: number } = {}) =>
      logAiError(supabaseServiceRole, { function_name: 'stock-assistant', stage, user_id: user.id, ...extra, message });
    if (firstFailures.length > 0) {
      await logError('first_call_retries', firstFailures.join(', '), { model: firstModel, status: aiResponse.status });
    }

    if (!aiResponse.ok) {
      const errorBody = await aiResponse.text();
      console.error('[stock-assistant] AI gateway error:', aiResponse.status, errorBody);
      await logError('first_call', errorBody, { model: firstModel, status: aiResponse.status });
      
      if (isRetryableGeminiStatus(aiResponse.status)) {
        return new Response(JSON.stringify({ error: 'The AI service is busy right now. Please try again in a moment.' }), {
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

    // Gemini often asks for more lookups after seeing the first results (e.g. quotes for the top
    // performers it just found), so tool calls run in rounds until it answers in text.
    const MAX_TOOL_ROUNDS = 2;

    const runTool = async (toolName: string, toolArgs: any) => {
      try {
        if (toolName === 'get_stock_quote') return await stockData.getQuote(toolArgs.symbol);
        if (toolName === 'get_company_profile') return await stockData.getProfile(toolArgs.symbol);
        if (toolName === 'get_company_news') return await stockData.getCompanyNews(toolArgs.symbol, toolArgs.limit || 5);
        if (toolName === 'get_market_news') return await stockData.getMarketNews(toolArgs.limit || 10);
        if (toolName === 'get_top_performers') return await stockData.getTopPerformers(toolArgs.type, Math.min(toolArgs.limit || 5, 10));
        if (toolName === 'get_price_performance') return await stockData.getPricePerformance(toolArgs.symbol);
        return { error: `Unknown tool: ${toolName}` };
      } catch (toolError) {
        console.error(`[Tool Error] ${toolName}:`, toolError);
        return { error: `Unable to fetch data: ${toolError instanceof Error ? toolError.message : String(toolError)}` };
      }
    };

    type PendingToolCall = { id: string; name: string; arguments: string; extra_content?: unknown };
    type ExecutedToolCall = { id: string; name: string; args: any; result: any; extra_content?: unknown };

    // Stream response back to client
    // Set when the user closes the chat mid-answer; nothing more is sent after that
    let clientGone = false;
    const stream = new ReadableStream({
      cancel() {
        clientGone = true;
      },
      async start(controller) {
        const encoder = new TextEncoder();
        const write = (text: string) => {
          if (clientGone) return;
          try {
            controller.enqueue(encoder.encode(text));
          } catch {
            clientGone = true;
          }
        };
        const send = (event: unknown) => write(`data: ${JSON.stringify(event)}\n\n`);
        const finish = () => {
          if (clientGone) return;
          try { controller.close(); } catch { /* already closed */ }
        };

        // Reads one Gemini SSE response: forwards text deltas to the client and collects tool calls.
        // extra_content carries Gemini's thought signature, which must be sent back with the tool results.
        const readGeminiStream = async (response: Response) => {
          const reader = response.body!.getReader();
          const decoder = new TextDecoder();
          const pending: Map<number, PendingToolCall> = new Map();
          let buffer = '';
          let content = '';
          let raw = ''; // kept (truncated) to diagnose empty answers
          let finishReason: string | null = null;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const text = decoder.decode(value, { stream: true });
            if (raw.length < 4000) raw += text;
            buffer += text;
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const data = line.slice(6).trim();
              if (data === '[DONE]') continue;
              let choice;
              try {
                choice = JSON.parse(data).choices?.[0];
              } catch (e) {
                console.error('Error parsing SSE:', e);
                continue;
              }
              if (choice?.finish_reason) finishReason = choice.finish_reason;
              if (choice?.delta?.content) {
                content += choice.delta.content;
                send({ type: 'content_delta', delta: choice.delta.content });
              }
              for (const toolCall of choice?.delta?.tool_calls ?? []) {
                // Gemini may send each complete call without an index; a new id means a new call
                let idx = toolCall.index ?? 0;
                const existing = pending.get(idx);
                if (toolCall.index === undefined && existing?.id && toolCall.id && existing.id !== toolCall.id) {
                  idx = pending.size;
                }
                if (!pending.has(idx)) pending.set(idx, { id: '', name: '', arguments: '' });
                const call = pending.get(idx)!;
                if (toolCall.id) call.id = toolCall.id;
                if (toolCall.function?.name) call.name += toolCall.function.name;
                if (toolCall.function?.arguments) call.arguments += toolCall.function.arguments;
                if (toolCall.extra_content) call.extra_content = toolCall.extra_content;
              }
            }
          }
          return { content, toolCalls: [...pending.values()].filter(c => c.name), raw, finishReason };
        };

        // Runs a round of tool calls in parallel, telling the client what's being looked up
        const executeToolCalls = async (calls: PendingToolCall[], round: number): Promise<ExecutedToolCall[]> => {
          const parsed = calls.map((call, i) => {
            let args: any = {};
            try { args = JSON.parse(call.arguments || '{}'); } catch { /* runTool reports bad args */ }
            return { call, args, id: call.id || `call_${round}_${i}_${Date.now()}` };
          });
          for (const { call, args } of parsed) send({ type: 'tool_call', tool: { name: call.name, args } });
          const started = Date.now();
          const executed = await Promise.all(parsed.map(async ({ call, args, id }) => ({
            id,
            name: call.name,
            args,
            result: await runTool(call.name, args),
            extra_content: call.extra_content,
          })));
          console.log(`[stock-assistant] round ${round}: ${executed.length} tool calls took ${Date.now() - started}ms`);
          return executed;
        };

        const allToolCalls: ExecutedToolCall[] = [];
        let conversation: any[] = [{ role: 'system', content: systemPrompt }, ...(messages || [])];
        let model = firstModel;
        let answer = '';

        try {
          let { content, toolCalls, raw, finishReason } = await readGeminiStream(aiResponse);
          answer = content;

          for (let round = 1; toolCalls.length > 0; round++) {
            const executed = await executeToolCalls(toolCalls, round);
            allToolCalls.push(...executed);
            conversation = [
              ...conversation,
              {
                role: 'assistant',
                content: null,
                tool_calls: executed.map(tc => ({
                  id: tc.id,
                  type: 'function',
                  function: { name: tc.name, arguments: JSON.stringify(tc.args) },
                  ...(tc.extra_content ? { extra_content: tc.extra_content } : {}),
                })),
              },
              ...executed.map(tc => ({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(tc.result) })),
            ];

            send({ type: 'analyzing' });
            // Same model keeps native tool messages (thought signatures are model-specific). A fallback
            // model, or the last round, gets all fetched data inline with no tools so it must answer.
            const allowMoreTools = round < MAX_TOOL_ROUNDS;
            const inlined = [
              { role: 'system', content: systemPrompt },
              ...(messages || []),
              {
                role: 'user',
                content: `Data fetched for my last question:\n${JSON.stringify(allToolCalls.map(tc => ({ tool: tc.name, args: tc.args, result: tc.result })))}\n\nAnswer my last question using this data.`,
              },
            ];
            const roundStart = Date.now();
            const timeout = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('AI request timeout after 45 seconds')), 45000)
            );
            const { response, model: usedModel, failures } = await Promise.race([
              fetchGeminiWithFallback(
                () => GEMINI_OPENAI_CHAT_URL,
                (m) => m === model && allowMoreTools
                  ? geminiRequest(m, { messages: conversation, tools })
                  : geminiRequest(m, { messages: inlined }),
                { models: [model, ...GEMINI_MODELS.filter(m => m !== model)], db: supabaseServiceRole },
              ),
              timeout,
            ]);
            console.log(`[stock-assistant] round ${round} answer from ${usedModel} in ${Date.now() - roundStart}ms`);
            if (failures.length > 0) {
              await logError('follow_up_retries', failures.join(', '), { model: usedModel, status: response.status });
            }
            if (!response.ok) {
              const errorBody = await response.text();
              await logError('follow_up', errorBody, { model: usedModel, status: response.status });
              throw new Error(isRetryableGeminiStatus(response.status)
                ? 'The AI service is busy right now. Please try again in a moment.'
                : `Follow-up AI request failed: ${response.status}`);
            }
            const usedInline = usedModel !== model || !allowMoreTools;
            model = usedModel;
            ({ content, toolCalls, raw, finishReason } = await readGeminiStream(response));
            answer += content;
            if (usedInline) toolCalls = []; // inline requests have no tools to call
          }

          // Gemini sometimes ends a stream mid-sentence (seen under rate limiting). Ask the other
          // model once, with any fetched data inline, and have the client replace the partial text.
          // Finished answers end with the disclaimer the prompt asks for, or at least a full sentence
          const cutOff = (text: string, reason: string | null) =>
            !!text.trim() && !/not investment advice/i.test(text) &&
            (!/[.!?:)_*\]]\s*$/.test(text.trim()) || (!!reason && reason !== 'stop' && reason !== 'tool_calls'));
          if (cutOff(answer, finishReason)) {
            await logError('truncated_answer', `finish_reason=${finishReason}; ${answer.slice(-200)}`, { model });
            const dataNote = allToolCalls.length
              ? [{ role: 'user', content: `Data fetched for my last question:\n${JSON.stringify(allToolCalls.map(tc => ({ tool: tc.name, args: tc.args, result: tc.result })))}\n\nAnswer my last question using this data.` }]
              : [];
            const { response: retry, model: retryUsed } = await fetchGeminiWithFallback(
              () => GEMINI_OPENAI_CHAT_URL,
              (m) => geminiRequest(m, { messages: [{ role: 'system', content: systemPrompt }, ...(messages || []), ...dataNote] }),
              { models: [...GEMINI_MODELS.filter(m => m !== model), model], db: supabaseServiceRole },
            );
            if (retry.ok) {
              send({ type: 'restart' });
              const retried = await readGeminiStream(retry);
              if (retried.content.trim()) {
                answer = retried.content;
                model = retryUsed;
              }
            }
          }

          // Every answer ends with the disclaimer, even if the model leaves it out
          if (answer.trim() && !/not investment advice/i.test(answer)) {
            const footer = '\n\n_Educational only, not investment advice._';
            send({ type: 'content_delta', delta: footer });
            answer += footer;
          }

          if (!answer.trim()) {
            await logError('empty_answer', raw || '(empty body)', { model });
            throw new Error("I couldn't put together an answer. Please try rephrasing your question.");
          }

          await supabaseAuth.from('ai_chat_messages').insert({
            conversation_id: convId,
            role: 'assistant',
            content: answer,
            // The opaque thought signatures aren't useful to store
            tool_calls: allToolCalls.length > 0
              ? allToolCalls.map(({ extra_content: _sig, ...tc }) => tc)
              : null,
          });

          write('data: [DONE]\n\n');
          console.log(`[stock-assistant] Stream completed in ${Date.now() - aiCallStart}ms`);
          finish();
        } catch (e) {
          console.error(`[${new Date().toISOString()}] [stock-assistant] Stream error:`, e);
          if (!clientGone) {
            await logError('stream', e instanceof Error ? `${e.message}\n${e.stack ?? ''}` : String(e), { model });
          }
          send({ type: 'error', message: e instanceof Error ? e.message : 'Unknown error occurred' });
          // Close normally so the client reads the error event instead of a dropped connection
          finish();
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