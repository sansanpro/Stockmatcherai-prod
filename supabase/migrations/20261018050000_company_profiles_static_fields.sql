-- More static company facts, so profile views never need a Finnhub call (its free tier is
-- 60 calls/min shared across all users). company-data fills these from Finnhub once per ticker.
ALTER TABLE public.company_profiles
  ADD COLUMN IF NOT EXISTS industry text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS ipo_date date,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS finnhub_synced_at timestamptz;
