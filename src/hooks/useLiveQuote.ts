import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Prices older than this are refreshed on demand when a stock is on screen. The server applies
// the same threshold against the shared database timestamp, so each stock is fetched from the
// market data API at most once per 20 minutes across all users.
const STALE_AFTER_MS = 20 * 60 * 1000;

interface Quote {
  price: number;
  updatedAt: string;
}

// Shared across components so the card and details panel show the same refreshed price
const quoteCache = new Map<string, Quote>();
const inFlight = new Map<string, Promise<Quote | null>>();

const ageMs = (iso?: string) => (iso ? Date.now() - new Date(iso).getTime() : Infinity);

function requestQuote(ticker: string): Promise<Quote | null> {
  const pending = inFlight.get(ticker);
  if (pending) return pending;
  const request = supabase.functions
    .invoke('company-data', { body: { action: 'refresh_quotes', symbol: ticker } })
    .then(({ data, error }) => {
      const quote: Quote | undefined = data?.data?.prices?.[ticker];
      if (error || !quote) return null;
      quoteCache.set(ticker, quote);
      return quote;
    })
    .catch(() => null)
    .finally(() => inFlight.delete(ticker));
  inFlight.set(ticker, request);
  return request;
}

// Returns the freshest known price for a stock, refreshing it if it's more than 20 minutes old
export function useLiveQuote(ticker: string, price: number, lastUpdated?: string, enabled = true) {
  const pick = (): Quote => {
    const cached = quoteCache.get(ticker);
    return cached && ageMs(cached.updatedAt) < ageMs(lastUpdated) ? cached : { price, updatedAt: lastUpdated ?? '' };
  };
  const [quote, setQuote] = useState<Quote>(pick);

  useEffect(() => {
    const current = pick();
    setQuote(current);
    if (!enabled || ageMs(current.updatedAt) < STALE_AFTER_MS) return;
    let cancelled = false;
    requestQuote(ticker).then(fresh => {
      if (!cancelled && fresh) setQuote(fresh);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker, price, lastUpdated, enabled]);

  return { price: quote.price, lastUpdated: quote.updatedAt || lastUpdated };
}
