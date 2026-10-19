// Writes Finnhub prices and metrics into the stocks table. Shared by the scheduled
// update-stock-data job and the on-demand refresh in company-data.
import { FinnhubClient, FinnhubMetrics, FinnhubQuote, formatMarketCap } from './finnhub.ts';

// deno-lint-ignore no-explicit-any
type Db = { from: (table: string) => any };


// Metrics (1Y return, P/E, dividend yield, market cap) barely move intraday, so they're
// refreshed at most daily; prices are refreshed on every pass. Halves Finnhub calls per stock.
export const METRICS_TTL_MS = 24 * 60 * 60 * 1000;
const metricsKey = (ticker: string) => `metrics:${ticker}`;

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

export function metricsToColumns(metrics: FinnhubMetrics): Record<string, unknown> {
  const columns: Record<string, unknown> = {};
  // Only overwrite fields Finnhub returned, so missing metrics keep their last known value
  if (isNum(metrics['52WeekPriceReturnDaily'])) columns.one_year_return = Number(metrics['52WeekPriceReturnDaily'].toFixed(2));
  const pe = metrics.peTTM ?? metrics.peBasicExclExtraTTM;
  if (isNum(pe) && pe > 0) columns.pe_ratio = Number(pe.toFixed(2));
  if (isNum(metrics.currentDividendYieldTTM)) columns.dividend_yield = Number(metrics.currentDividendYieldTTM.toFixed(2));
  if (isNum(metrics.marketCapitalization) && metrics.marketCapitalization > 0) {
    columns.market_cap = formatMarketCap(metrics.marketCapitalization);
    columns.market_cap_usd = metrics.marketCapitalization * 1_000_000; // Finnhub reports millions
  }
  if (isNum(metrics.beta)) columns.beta = Number(metrics.beta.toFixed(3));
  return columns;
}

// When each ticker's price was last refreshed
export async function getTickerFreshness(db: Db, tickers?: string[]): Promise<Map<string, number>> {
  let query = db.from('stocks').select('ticker, updated_at');
  if (tickers) query = query.in('ticker', tickers);
  const { data } = await query;
  return new Map((data ?? []).map((row: { ticker: string; updated_at: string | null }) =>
    [row.ticker, row.updated_at ? new Date(row.updated_at).getTime() : 0]));
}

export async function getMetricsFreshness(db: Db): Promise<Map<string, number>> {
  const { data } = await db.from('market_data_cache').select('cache_key, fetched_at').like('cache_key', 'metrics:%');
  return new Map((data ?? []).map((row: { cache_key: string; fetched_at: string }) =>
    [row.cache_key.slice('metrics:'.length), new Date(row.fetched_at).getTime()]));
}

// Writes the price (and optionally metrics). The table's trigger stamps updated_at on price writes.
export async function applyQuote(db: Db, ticker: string, quote: FinnhubQuote, metrics?: FinnhubMetrics | null) {
  const columns: Record<string, unknown> = { price_per_share: quote.c, ...(metrics ? metricsToColumns(metrics) : {}) };
  const { data, error } = await db.from('stocks').update(columns).eq('ticker', ticker).select('ticker');
  if (metrics) {
    await db.from('market_data_cache').upsert({ cache_key: metricsKey(ticker), data: metrics, fetched_at: new Date().toISOString() });
  }
  return { rowsUpdated: data?.length ?? 0, errors: error ? [error] : [], columns };
}

export async function fetchAndApplyQuote(db: Db, finnhub: FinnhubClient, ticker: string, withMetrics: boolean) {
  const quote = await finnhub.getQuote(ticker);
  if (!quote) return null;
  const metrics = withMetrics ? await finnhub.getMetrics(ticker) : null;
  const applied = await applyQuote(db, ticker, quote, metrics);
  return { quote, metrics, ...applied };
}
