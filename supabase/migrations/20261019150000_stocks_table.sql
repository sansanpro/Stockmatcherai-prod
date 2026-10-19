-- One `stocks` table (ticker as key) replaces the 6 sector tables and company_profiles.
-- The old names become views over it, so older app builds keep reading current prices and
-- existing writers keep working until they're repointed. The original tables move to the
-- private `archive` schema as a backup.

CREATE SCHEMA IF NOT EXISTS archive;

CREATE TABLE public.stocks (
  ticker text PRIMARY KEY,
  company_name text NOT NULL,
  sector text NOT NULL CHECK (sector IN ('technology', 'healthcare', 'finance', 'energy', 'consumer', 'utilities')),

  -- Market data (filled by update-stock-data / on-demand refresh)
  price_per_share numeric,
  one_year_return numeric,
  pe_ratio numeric,
  dividend_yield numeric,
  market_cap text,
  market_cap_usd numeric,
  beta numeric,

  -- Editorial
  ceo_name text,
  ceo_highlights text,
  risk_level text CHECK (risk_level IN ('low', 'medium', 'high')),
  esg_score integer, -- legacy: only exposed to older app builds, never shown by current builds
  exchange text,
  is_fund boolean NOT NULL DEFAULT false,
  in_feed boolean NOT NULL DEFAULT false, -- eligible for the values-matched swipe feed
  mission_story text,
  proof text,
  proof_source_url text,
  things_to_know text[],

  -- Company profile (was company_profiles)
  description text,
  full_time_employees integer,
  city text,
  state text,
  country text NOT NULL DEFAULT 'US',
  industry text,
  website text,
  ipo_date date,
  logo_url text,
  finnhub_synced_at timestamptz,
  profile_updated_at timestamptz NOT NULL DEFAULT now(),

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),   -- when the price was last refreshed
  last_updated timestamptz NOT NULL DEFAULT now()  -- same, under the name older builds read
);

COMMENT ON TABLE public.stocks IS 'All tracked companies. The *_stocks and company_profiles views exist for older app builds.';

-- Copy the sector tables. Six tickers were in two tables; keep their correct sector.
WITH all_rows AS (
  SELECT 'technology'::text AS sector, * FROM public.technology_stocks
  UNION ALL SELECT 'healthcare', * FROM public.healthcare_stocks
  UNION ALL SELECT 'finance', * FROM public.finance_stocks
  UNION ALL SELECT 'energy', * FROM public.energy_stocks
  UNION ALL SELECT 'consumer', * FROM public.consumer_stocks
  UNION ALL SELECT 'utilities', * FROM public.utilities_stocks
), ranked AS (
  SELECT *, row_number() OVER (
    PARTITION BY ticker
    ORDER BY CASE WHEN (ticker, sector) IN (
                ('CVX', 'energy'), ('DXCM', 'healthcare'), ('GILD', 'healthcare'),
                ('IQV', 'healthcare'), ('MTD', 'healthcare'), ('PYPL', 'finance')) THEN 0 ELSE 1 END,
             updated_at DESC NULLS LAST
  ) AS rn
  FROM all_rows
)
INSERT INTO public.stocks (
  ticker, company_name, sector, price_per_share, one_year_return, pe_ratio, dividend_yield, market_cap,
  ceo_name, ceo_highlights, risk_level, esg_score, created_at, updated_at, last_updated
)
SELECT ticker, company_name, sector, price_per_share, one_year_return, pe_ratio, dividend_yield, market_cap,
       ceo_name, ceo_highlights, risk_level, esg_score,
       coalesce(created_at, now()), coalesce(updated_at, now()), coalesce(last_updated, updated_at, now())
FROM ranked
WHERE rn = 1;

-- Merge in the company profiles
UPDATE public.stocks s SET
  description = cp.description,
  full_time_employees = cp.full_time_employees,
  city = cp.city,
  state = cp.state,
  country = cp.country,
  industry = cp.industry,
  website = cp.website,
  ipo_date = cp.ipo_date,
  logo_url = cp.logo_url,
  finnhub_synced_at = cp.finnhub_synced_at,
  profile_updated_at = cp.updated_at
FROM public.company_profiles cp
WHERE cp.ticker = s.ticker;

-- Numeric market cap and beta from the cached daily Finnhub metrics (the updater keeps them current)
UPDATE public.stocks s SET
  market_cap_usd = NULLIF((c.data->>'marketCapitalization')::numeric, 0) * 1000000,
  beta = (c.data->>'beta')::numeric
FROM public.market_data_cache c
WHERE c.cache_key = 'metrics:' || s.ticker;

-- Keep the originals as a backup outside the API-exposed schema
ALTER TABLE public.technology_stocks SET SCHEMA archive;
ALTER TABLE public.healthcare_stocks SET SCHEMA archive;
ALTER TABLE public.finance_stocks SET SCHEMA archive;
ALTER TABLE public.energy_stocks SET SCHEMA archive;
ALTER TABLE public.consumer_stocks SET SCHEMA archive;
ALTER TABLE public.utilities_stocks SET SCHEMA archive;
ALTER TABLE public.company_profiles SET SCHEMA archive;

ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Stocks are readable by everyone" ON public.stocks FOR SELECT USING (true);

-- Stamp freshness only when a price is written, so profile edits don't make a stale price look fresh
CREATE TRIGGER stocks_price_timestamp
  BEFORE UPDATE OF price_per_share ON public.stocks
  FOR EACH ROW EXECUTE FUNCTION public.update_stock_timestamp();

CREATE INDEX stocks_sector_idx ON public.stocks (sector);
CREATE INDEX stocks_updated_at_idx ON public.stocks (updated_at);

-- Compatibility views with the old table names and columns. Rows missing data older builds
-- assume is present (they call toFixed() on these) are left out. Simple single-table views are
-- updatable, so writes through them land in stocks. security_invoker applies stocks' RLS.
DO $$
DECLARE
  s text;
BEGIN
  FOREACH s IN ARRAY ARRAY['technology', 'healthcare', 'finance', 'energy', 'consumer', 'utilities'] LOOP
    EXECUTE format($view$
      CREATE VIEW public.%I WITH (security_invoker = true) AS
      SELECT ticker AS id, ticker, company_name, ceo_name, ceo_highlights, pe_ratio, market_cap,
             one_year_return, risk_level, price_per_share, dividend_yield, esg_score,
             created_at, updated_at, last_updated
      FROM public.stocks
      WHERE sector = %L
        AND price_per_share IS NOT NULL AND one_year_return IS NOT NULL AND pe_ratio IS NOT NULL
        AND dividend_yield IS NOT NULL AND market_cap IS NOT NULL AND ceo_name IS NOT NULL
        AND ceo_highlights IS NOT NULL AND risk_level IS NOT NULL
    $view$, s || '_stocks', s);
    EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated', s || '_stocks');
    EXECUTE format('GRANT ALL ON public.%I TO service_role', s || '_stocks');
  END LOOP;
END $$;

CREATE VIEW public.company_profiles WITH (security_invoker = true) AS
SELECT ticker, description, full_time_employees, city, state, country, profile_updated_at AS updated_at,
       industry, website, ipo_date, logo_url, finnhub_synced_at
FROM public.stocks
WHERE description IS NOT NULL;

GRANT SELECT ON public.company_profiles TO anon, authenticated;
GRANT ALL ON public.company_profiles TO service_role;
GRANT SELECT ON public.stocks TO anon, authenticated;
GRANT ALL ON public.stocks TO service_role;

-- Swipe counter: older builds increment it themselves, so users can write their own row.
-- Allow only +1 per write and never a decrease, which closes the "reset to 0" bypass
-- without breaking those builds.
CREATE OR REPLACE FUNCTION public.clamp_swipe_count() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.swipes_used := LEAST(GREATEST(NEW.swipes_used, 0), 1);
  ELSE
    NEW.swipes_used := GREATEST(OLD.swipes_used, LEAST(NEW.swipes_used, OLD.swipes_used + 1));
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER daily_swipe_limits_clamp
  BEFORE INSERT OR UPDATE ON public.daily_swipe_limits
  FOR EACH ROW EXECUTE FUNCTION public.clamp_swipe_count();
