import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { FinnhubClient, FinnhubRateLimitError } from '../_shared/finnhub.ts';
import { METRICS_TTL_MS, fetchAndApplyQuote, getMetricsFreshness, getTickerFreshness } from '../_shared/stockQuotes.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Runs every 10 minutes in market hours. A stock is refreshed when its price is older than
// STALE_AFTER_MS; stalest first across all sectors. With metrics only refreshed daily most
// stocks cost one Finnhub call, so ~90 fit in a run and every stock stays within ~20 minutes.
const STALE_AFTER_MS = 9 * 60 * 1000;
const MAX_RUN_MS = 115 * 1000; // edge functions are stopped at 150s
// Finnhub free tier is 60 calls/min, shared with on-demand refreshes, news and the chatbot
const CALL_SPACING_MS = 1200;
const MAX_METRICS_PER_RUN = 15;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let body: { updateType?: string; source?: string; tickers?: string[] } = {};
  try {
    const text = req.method === 'POST' ? await req.text() : '';
    if (text) body = JSON.parse(text);
  } catch {
    // No or invalid body: use defaults
  }
  const updateType = body.updateType || 'default';

  const finnhubApiKey = Deno.env.get('FINNHUB_API_KEY');
  if (!finnhubApiKey) {
    console.error('FINNHUB_API_KEY is not set');
    return json({ error: 'FINNHUB_API_KEY is not configured', success: false, updated: 0, failed: 0 }, 500);
  }
  const finnhub = new FinnhubClient(finnhubApiKey);
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const startTime = Date.now();

  // Admin backfill: refresh prices and metrics for specific tickers now (e.g. newly added
  // companies). Requires the service role key, since it bypasses the staleness and metrics limits.
  const backfill = Array.isArray(body.tickers) && body.tickers.length > 0;
  if (backfill && req.headers.get('Authorization') !== `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const freshness = await getTickerFreshness(supabase);
    const staleTickers = backfill
      ? body.tickers!.map(t => String(t).toUpperCase()).filter(t => freshness.has(t))
      : [...freshness.entries()]
        .filter(([, updatedAt]) => startTime - updatedAt > STALE_AFTER_MS)
        .sort(([, a], [, b]) => a - b)
        .map(([ticker]) => ticker);

    if (staleTickers.length === 0) {
      return json({ message: 'All stock data is up to date', success: true, updated: 0, failed: 0, staleCount: 0 });
    }

    // Lock so overlapping cron jobs don't double up on Finnhub's rate limit
    const { data: running } = await supabase
      .from('stock_update_logs')
      .select('id')
      .eq('status', 'running')
      .gte('started_at', new Date(startTime - 5 * 60 * 1000).toISOString());
    if (running && running.length > 0) {
      return json({ message: 'Another update is already running', success: true, updated: 0, failed: 0 });
    }
    const { data: lock } = await supabase
      .from('stock_update_logs')
      .insert({ sector: 'all', update_type: updateType, status: 'running', started_at: new Date().toISOString() })
      .select()
      .single();

    const metricsFreshness = await getMetricsFreshness(supabase);
    // Waits out the rest of the spacing since the last Finnhub call, so database writes
    // happen inside the gap instead of adding to it
    let lastCallAt = 0;
    const pause = async (calls = 1) => {
      const wait = lastCallAt + calls * CALL_SPACING_MS - Date.now();
      if (wait > 0) await new Promise(resolve => setTimeout(resolve, wait));
      lastCallAt = Date.now();
    };
    let updated = 0;
    let failed = 0;
    let apiCalls = 0;
    let metricsFetched = 0;
    const failedTickers: string[] = [];

    for (const ticker of staleTickers) {
      if (Date.now() - startTime > MAX_RUN_MS) break;
      const withMetrics = backfill || (metricsFetched < MAX_METRICS_PER_RUN &&
        startTime - (metricsFreshness.get(ticker) ?? 0) > METRICS_TTL_MS);
      try {
        // Quote + metrics are two calls: budget a second interval to keep the average rate
        await pause(withMetrics ? 2 : 1);
        if (withMetrics) apiCalls++;
        const result = await fetchAndApplyQuote(supabase, finnhub, ticker, withMetrics);
        apiCalls++;
        if (withMetrics) metricsFetched++;
        if (result && result.rowsUpdated > 0 && result.errors.length === 0) {
          updated++;
        } else {
          failed++;
          failedTickers.push(ticker);
          if (result?.errors.length) console.error(`Update errors for ${ticker}:`, result.errors);
        }
      } catch (error) {
        if (error instanceof FinnhubRateLimitError) {
          console.log('Finnhub rate limit hit, stopping this run');
          break;
        }
        console.error(`Error processing ${ticker}:`, error);
        failed++;
        failedTickers.push(ticker);
      }
    }

    if (lock?.id) {
      await supabase
        .from('stock_update_logs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          stocks_updated: updated,
          stocks_failed: failed,
          api_calls_used: apiCalls,
          error_message: failedTickers.length ? `Failed: ${failedTickers.join(', ')}` : null,
        })
        .eq('id', lock.id);
    }

    const summary = {
      message: 'Stock update process completed',
      success: true,
      staleStocksFound: staleTickers.length,
      updated,
      failed,
      failedTickers,
      metricsRefreshed: metricsFetched,
      apiCalls,
      seconds: Math.round((Date.now() - startTime) / 1000),
    };
    console.log('Update summary:', summary);
    return json(summary);
  } catch (error) {
    console.error('Fatal error in update-stock-data:', error);
    return json({ error: error instanceof Error ? error.message : String(error), success: false, updated: 0, failed: 0 }, 500);
  }
});
