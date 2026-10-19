// Writes Finnhub prices and metrics into the sector stock tables. Shared by the scheduled
// update-stock-data job and the on-demand refresh in company-data.
import { FinnhubClient, FinnhubMetrics, FinnhubQuote, formatMarketCap } from './finnhub.ts';

// deno-lint-ignore no-explicit-any
type Db = { from: (table: string) => any };

export const SECTOR_TABLES = [
  'technology_stocks',
  'healthcare_stocks',
  'finance_stocks',
  'energy_stocks',
  'consumer_stocks',
  'utilities_stocks',
];

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
  if (isNum(metrics.marketCapitalization) && metrics.marketCapitalization > 0) columns.market_cap = formatMarketCap(metrics.marketCapitalization);
  return columns;
}

// Most recent update time per ticker across all sector tables (a ticker can be in several)
export async function getTickerFreshness(db: Db, tickers?: string[]): Promise<Map<string, number>> {
  const results = await Promise.all(SECTOR_TABLES.map(table => {
    let query = db.from(table).select('ticker, updated_at');
    if (tickers) query = query.in('ticker', tickers);
    return query;
  }));
  const freshness = new Map<string, number>();
  for (const { data } of results) {
    for (const row of data ?? []) {
      const at = row.updated_at ? new Date(row.updated_at).getTime() : 0;
      // Use the oldest copy so a ticker counts as stale until every table has it fresh
      freshness.set(row.ticker, Math.min(freshness.get(row.ticker) ?? Infinity, at));
    }
  }
  return freshness;
}

export async function getMetricsFreshness(db: Db): Promise<Map<string, number>> {
  const { data } = await db.from('market_data_cache').select('cache_key, fetched_at').like('cache_key', 'metrics:%');
  return new Map((data ?? []).map((row: { cache_key: string; fetched_at: string }) =>
    [row.cache_key.slice('metrics:'.length), new Date(row.fetched_at).getTime()]));
}

// Writes the price (and optionally metrics) to every sector table holding the ticker.
// The tables' update trigger stamps updated_at.
export async function applyQuote(db: Db, ticker: string, quote: FinnhubQuote, metrics?: FinnhubMetrics | null) {
  const columns: Record<string, unknown> = { price_per_share: quote.c, ...(metrics ? metricsToColumns(metrics) : {}) };
  const results = await Promise.all(SECTOR_TABLES.map(table => db.from(table).update(columns).eq('ticker', ticker).select('ticker')));
  if (metrics) {
    await db.from('market_data_cache').upsert({ cache_key: metricsKey(ticker), data: metrics, fetched_at: new Date().toISOString() });
  }
  const errors = results.filter((r: { error: unknown }) => r.error).map((r: { error: unknown }) => r.error);
  const rowsUpdated = results.reduce((n: number, r: { data: unknown[] | null }) => n + (r.data?.length ?? 0), 0);
  return { rowsUpdated, errors, columns };
}

export async function fetchAndApplyQuote(db: Db, finnhub: FinnhubClient, ticker: string, withMetrics: boolean) {
  const quote = await finnhub.getQuote(ticker);
  if (!quote) return null;
  const metrics = withMetrics ? await finnhub.getMetrics(ticker) : null;
  const applied = await applyQuote(db, ticker, quote, metrics);
  return { quote, metrics, ...applied };
}
