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

// Finnhub reports market cap in the currency a company reports its results in. For these
// foreign filers that isn't dollars, so it's converted with the day's ECB rate.
const REPORTING_CURRENCY: Record<string, string> = { NVO: 'DKK', TAK: 'JPY', SBS: 'BRL' };
const unitsPerUsd = new Map<string, Promise<number | null>>(); // keyed by currency and day

function fetchUnitsPerUsd(currency: string): Promise<number | null> {
  const key = `${currency}:${new Date().toISOString().slice(0, 10)}`;
  if (!unitsPerUsd.has(key)) {
    const rate = fetch(`https://api.frankfurter.dev/v1/latest?base=USD&symbols=${currency}`)
      .then(r => (r.ok ? r.json() : null))
      .then(body => (isNum(body?.rates?.[currency]) && body.rates[currency] > 0 ? body.rates[currency] : null))
      .catch(() => null);
    unitsPerUsd.set(key, rate);
    rate.then(value => { if (value === null) unitsPerUsd.delete(key); }); // retry next time after a failure
  }
  return unitsPerUsd.get(key)!;
}

// Dollars per unit of the company's reporting currency: 1 for most, null if the rate is unavailable
async function usdPerReportingUnit(ticker: string): Promise<number | null> {
  const currency = REPORTING_CURRENCY[ticker];
  if (!currency) return 1;
  const units = await fetchUnitsPerUsd(currency);
  return units ? 1 / units : null;
}

export function metricsToColumns(metrics: FinnhubMetrics, usdPerUnit: number | null = 1): Record<string, unknown> {
  const columns: Record<string, unknown> = {};
  // Only overwrite fields Finnhub returned, so missing metrics keep their last known value
  if (isNum(metrics['52WeekPriceReturnDaily'])) columns.one_year_return = Number(metrics['52WeekPriceReturnDaily'].toFixed(2));
  const pe = metrics.peTTM ?? metrics.peBasicExclExtraTTM;
  if (isNum(pe) && pe > 0) columns.pe_ratio = Number(pe.toFixed(2));
  if (isNum(metrics.currentDividendYieldTTM)) columns.dividend_yield = Number(metrics.currentDividendYieldTTM.toFixed(2));
  // Without a conversion rate, keep the last known market cap rather than store one in the wrong currency
  if (isNum(metrics.marketCapitalization) && metrics.marketCapitalization > 0 && usdPerUnit !== null) {
    const millionsUsd = metrics.marketCapitalization * usdPerUnit; // Finnhub reports millions
    columns.market_cap = formatMarketCap(millionsUsd);
    columns.market_cap_usd = millionsUsd * 1_000_000;
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
  const columns: Record<string, unknown> = {
    price_per_share: quote.c,
    ...(metrics ? metricsToColumns(metrics, await usdPerReportingUnit(ticker)) : {}),
  };
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
