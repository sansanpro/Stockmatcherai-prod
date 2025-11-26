import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// FMP Service for real-time stock data (300 calls/min)
class FMPService {
  private apiKey: string;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async fetchWithCache(url: string, cacheKey: string) {
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log(`[FMP] Cache hit for ${cacheKey}`);
      return cached.data;
    }

    console.log(`[FMP] Fetching ${url}`);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`FMP API error: ${response.statusText}`);
    
    const data = await response.json();
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  }

  async getQuote(symbol: string) {
    const url = `https://financialmodelingprep.com/stable/quote-short?symbol=${symbol}&apikey=${this.apiKey}`;
    return this.fetchWithCache(url, `quote_${symbol}`);
  }

  async getProfile(symbol: string) {
    const url = `https://financialmodelingprep.com/stable/profile?symbol=${symbol}&apikey=${this.apiKey}`;
    return this.fetchWithCache(url, `profile_${symbol}`);
  }

  async getMarketMovers(type: 'gainers' | 'losers') {
    const endpoint = type === 'gainers' ? 'biggest-gainers' : 'biggest-losers';
    const url = `https://financialmodelingprep.com/stable/${endpoint}?apikey=${this.apiKey}`;
    return this.fetchWithCache(url, `movers_${type}`);
  }

  async getHistoricalPrices(symbol: string, days: number = 30) {
    const url = `https://financialmodelingprep.com/stable/historical-price-full/${symbol}?timeseries=${days}&apikey=${this.apiKey}`;
    return this.fetchWithCache(url, `historical_${symbol}_${days}d`);
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
    const fmpApiKey = Deno.env.get('FMP_API_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('[stock-assistant] Missing Supabase credentials');
      return new Response(JSON.stringify({ error: 'Server configuration error: Supabase credentials missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!fmpApiKey) {
      console.error('[stock-assistant] Missing FMP_API_KEY');
      return new Response(JSON.stringify({ error: 'Server configuration error: FMP API key missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!lovableApiKey) {
      console.error('[stock-assistant] Missing LOVABLE_API_KEY');
      return new Response(JSON.stringify({ error: 'Server configuration error: Lovable API key missing' }), {
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

    // For free users, check message limit (2 free messages)
    if (!isPremium) {
      // Get all user's conversation IDs
      const { data: userConversations } = await supabaseServiceRole
        .from('ai_chat_conversations')
        .select('id')
        .eq('user_id', user.id);

      const conversationIds = userConversations?.map(c => c.id) || [];

      // Count all user messages across all conversations
      let totalUserMessages = 0;
      if (conversationIds.length > 0) {
        const { count } = await supabaseServiceRole
          .from('ai_chat_messages')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'user')
          .in('conversation_id', conversationIds);
        
        totalUserMessages = count || 0;
      }

      // Add 1 to account for the current message being sent
      const messagesUsedIncludingCurrent = totalUserMessages + 1;
      console.log('[stock-assistant] Free user messages (including current):', messagesUsedIncludingCurrent);

      if (messagesUsedIncludingCurrent > 2) {
        console.log('[stock-assistant] User exceeded free message limit');
        return new Response(JSON.stringify({
          type: 'upgrade_required',
          message: 'You\'ve used your 2 free AI messages! Upgrade to Premium for unlimited AI stock research, real-time analysis, and expert market guidance.',
          freeMessagesSent: messagesUsedIncludingCurrent - 1
        }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('[stock-assistant] Free user has', 2 - messagesUsedIncludingCurrent + 1, 'messages remaining');
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

    // Initialize FMP service
    console.log('[stock-assistant] Initializing FMP service');
    const fmpService = new FMPService(fmpApiKey);

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
          description: "Get detailed company information including sector, industry, CEO, description, market cap",
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
          name: "get_market_movers",
          description: "Get top gaining or losing stocks in the market today",
          parameters: {
            type: "object",
            properties: {
              type: { 
                type: "string",
                enum: ["gainers", "losers"],
                description: "Type of movers to fetch"
              }
            },
            required: ["type"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_historical_prices",
          description: "Get historical daily price data for a stock to analyze trends, trajectory, and performance over time",
          parameters: {
            type: "object",
            properties: {
              symbol: { type: "string", description: "Stock ticker symbol" },
              days: { 
                type: "number", 
                description: "Number of days of historical data (default: 30, max: 365)",
                default: 30
              }
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

User Profile Summary:
- Risk Tolerance: ${profile?.risk_tolerance || 'moderate'}
- Investment Goals: ${profile?.investment_goals?.join(', ') || 'not specified'}
- Experience: ${profile?.investment_experience || 'beginner'}
- Interests: ${profile?.sectors_of_interest?.join(', ') || 'not specified'}

RESPONSE GUIDELINES:
- For PRICE questions ("What's the price of X?"): Give a direct answer with the current price, change, and volume.
- For PERFORMANCE questions ("How is X performing?"): Analyze the data and explain what the numbers mean - is the stock up or down? By how much? What's the context?
- For COMPARISON questions: Fetch multiple stocks and compare their metrics side by side.
- Always interpret the raw data - explain what the numbers tell us about the stock's movement.

When users ask about stocks:
- Use get_stock_quote for current prices and changes
- Use get_company_profile for company details
- Use get_market_movers for market trends
- Compare stocks using data from multiple calls

Format responses:
- Start with the direct answer to their question
- Use bullet points for additional details
- Short paragraphs (2-3 sentences)
- Use markdown for emphasis (**bold** for key numbers)
- Include disclaimers

Current date: ${new Date().toISOString().split('T')[0]}`;

    // Call Lovable AI with streaming and timeout
    console.log(`[stock-assistant] [${new Date().toISOString()}] Calling Lovable AI`);
    const aiCallStart = Date.now();
    
    // Create timeout promise (45 seconds)
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('AI request timeout after 45 seconds')), 45000)
    );
    
    const fetchPromise = fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
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
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please contact support.' }), {
          status: 402,
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

                // Collect tool calls
                if (choice?.delta?.tool_calls) {
                  for (const toolCall of choice.delta.tool_calls) {
                    if (toolCall.function?.name) {
                      const toolName = toolCall.function.name;
                      const toolArgs = JSON.parse(toolCall.function.arguments || '{}');
                      const toolId = toolCall.id || `call_${Date.now()}_${Math.random()}`;

                      const toolCallStart = Date.now();
                      console.log(`[${new Date().toISOString()}] [Tool Call] ${toolName}`, toolArgs);

                      // Execute tool with error handling
                      let toolResult;
                      try {
                        if (toolName === 'get_stock_quote') {
                          toolResult = await fmpService.getQuote(toolArgs.symbol);
                        } else if (toolName === 'get_company_profile') {
                          toolResult = await fmpService.getProfile(toolArgs.symbol);
                        } else if (toolName === 'get_market_movers') {
                          toolResult = await fmpService.getMarketMovers(toolArgs.type);
                        } else if (toolName === 'get_historical_prices') {
                          toolResult = await fmpService.getHistoricalPrices(toolArgs.symbol, toolArgs.days || 30);
                        }
                      } catch (toolError) {
                        console.error(`[Tool Error] ${toolName}:`, toolError);
                        toolResult = { error: `Unable to fetch data: ${toolError.message}` };
                      }
                      
                      const toolCallDuration = Date.now() - toolCallStart;
                      console.log(`[${new Date().toISOString()}] [Tool Call Complete] ${toolName} took ${toolCallDuration}ms`);

                      collectedToolCalls.push({ 
                        id: toolId,
                        name: toolName, 
                        args: toolArgs, 
                        result: toolResult 
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
                  }
                }
              } catch (e) {
                console.error('Error parsing SSE:', e);
              }
            }

            if (toolCallsComplete) break;
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
                content: '',
                tool_calls: collectedToolCalls.map(tc => ({
                  id: tc.id,
                  type: 'function',
                  function: {
                    name: tc.name,
                    arguments: JSON.stringify(tc.args)
                  }
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
            
            const followUpFetchPromise = fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${lovableApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'google/gemini-2.5-flash',
                messages: followUpMessages,
                stream: true,
              }),
            });

            const followUpResponse = await Promise.race([followUpFetchPromise, followUpTimeoutPromise]);
            const followUpDuration = Date.now() - followUpStart;
            console.log(`[${new Date().toISOString()}] [stock-assistant] Follow-up response received in ${followUpDuration}ms`);

            if (!followUpResponse.ok) {
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
                tool_calls: collectedToolCalls.length > 0 ? collectedToolCalls : null
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