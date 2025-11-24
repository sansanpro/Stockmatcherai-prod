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
    const url = `https://financialmodelingprep.com/stable/stock_market/${type}?apikey=${this.apiKey}`;
    return this.fetchWithCache(url, `movers_${type}`);
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

    // For free users, return upgrade prompt after they send a message
    if (!isPremium) {
      console.log('[stock-assistant] User is not premium, returning upgrade prompt');
      return new Response(JSON.stringify({
        type: 'upgrade_required',
        message: 'Unlock unlimited AI stock education with Premium! Get real-time analysis, personalized insights, and expert market guidance.',
        freeMessagesSent: 1
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[stock-assistant] User is premium, proceeding with AI request');

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
      const { data: newConv, error: convError } = await supabaseAuth
        .from('ai_chat_conversations')
        .insert({
          user_id: user.id,
          title: message.substring(0, 50) + '...'
        })
        .select()
        .single();

      if (convError) throw convError;
      convId = newConv.id;
    }

    // Save user message using authenticated client
    await supabaseAuth.from('ai_chat_messages').insert({
      conversation_id: convId,
      role: 'user',
      content: message
    });

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
      }
    ];

    // System prompt
    const systemPrompt = `You are a Stock Education Assistant. Your role is to educate users about investing and markets.

CRITICAL RULES:
1. EDUCATIONAL FOCUS - Explain concepts, don't give financial advice. Never say "buy" or "sell".
2. USE TOOLS - Always fetch real-time data when discussing specific stocks using the available tools.
3. BE CONVERSATIONAL - Friendly, encouraging, use analogies for complex concepts.
4. CITE SOURCES - Reference the data you fetch ("According to today's data...", "Currently trading at...").
5. DISCLAIMERS - Remind users this is educational content, not investment advice.
6. USER CONTEXT - Consider their experience level: ${profile?.investment_experience || 'beginner'}

User Profile Summary:
- Risk Tolerance: ${profile?.risk_tolerance || 'moderate'}
- Investment Goals: ${profile?.investment_goals?.join(', ') || 'not specified'}
- Experience: ${profile?.investment_experience || 'beginner'}
- Interests: ${profile?.sectors_of_interest?.join(', ') || 'not specified'}

When users ask about stocks:
- Use get_stock_quote for current prices and changes
- Use get_company_profile for company details
- Use get_market_movers for market trends
- Compare stocks using data from multiple calls

Format responses:
- Use bullet points for clarity
- Short paragraphs (2-3 sentences)
- Use markdown for emphasis
- Include disclaimers

Current date: ${new Date().toISOString().split('T')[0]}`;

    // Call Lovable AI with streaming
    console.log('[stock-assistant] Calling Lovable AI');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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

    if (!aiResponse.ok) {
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
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    // Stream response back to client
    const stream = new ReadableStream({
      async start(controller) {
        const reader = aiResponse.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let assistantMessage = '';
        let toolCalls: any[] = [];

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.trim() || line.startsWith(':')) continue;
              if (!line.startsWith('data: ')) continue;

              const data = line.slice(6).trim();
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const choice = parsed.choices?.[0];

                // Handle content delta
                if (choice?.delta?.content) {
                  assistantMessage += choice.delta.content;
                  controller.enqueue(
                    new TextEncoder().encode(
                      `data: ${JSON.stringify({ type: 'content_delta', delta: choice.delta.content })}\n\n`
                    )
                  );
                }

                // Handle tool calls
                if (choice?.delta?.tool_calls) {
                  for (const toolCall of choice.delta.tool_calls) {
                    if (toolCall.function?.name) {
                      const toolName = toolCall.function.name;
                      const toolArgs = JSON.parse(toolCall.function.arguments || '{}');

                      console.log(`[Tool Call] ${toolName}`, toolArgs);

                      // Execute tool with error handling
                      let toolResult;
                      try {
                        if (toolName === 'get_stock_quote') {
                          toolResult = await fmpService.getQuote(toolArgs.symbol);
                        } else if (toolName === 'get_company_profile') {
                          toolResult = await fmpService.getProfile(toolArgs.symbol);
                        } else if (toolName === 'get_market_movers') {
                          toolResult = await fmpService.getMarketMovers(toolArgs.type);
                        }
                      } catch (toolError) {
                        console.error(`[Tool Error] ${toolName}:`, toolError);
                        toolResult = { error: `Unable to fetch data: ${toolError.message}` };
                      }

                      toolCalls.push({ name: toolName, args: toolArgs, result: toolResult });

                      // Send tool call to client
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
          }

          // Save assistant message
          if (assistantMessage) {
            await supabaseAuth.from('ai_chat_messages').insert({
              conversation_id: convId,
              role: 'assistant',
              content: assistantMessage,
              tool_calls: toolCalls.length > 0 ? toolCalls : null
            });
          }

          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        } catch (e) {
          console.error('Stream error:', e);
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