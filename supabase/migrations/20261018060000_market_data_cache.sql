-- Shared cache for Finnhub responses (news, price performance) so all users share one fetch
-- instead of each spending Finnhub's 60 calls/min free limit. Service role only.
CREATE TABLE IF NOT EXISTS public.market_data_cache (
  cache_key text PRIMARY KEY,
  data jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.market_data_cache ENABLE ROW LEVEL SECURITY;
