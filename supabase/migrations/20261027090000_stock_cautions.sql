-- Caution tags for companies whose stock swings a lot.
-- The researched caution (what moved, why, and the source) lives on stocks and is written by
-- scripts/build-launch-seed.mjs from supabase/seed/launch-universe.json.
ALTER TABLE public.stocks
  ADD COLUMN IF NOT EXISTS caution_headline text,
  ADD COLUMN IF NOT EXISTS caution_reason text,
  ADD COLUMN IF NOT EXISTS caution_source_url text,
  ADD COLUMN IF NOT EXISTS caution_checked_on date;

-- Big one-day moves (15% or more either way), recorded by the price updater as they happen,
-- so a card can warn about a jump before anyone has researched it.
CREATE TABLE IF NOT EXISTS public.price_moves (
  ticker text NOT NULL REFERENCES public.stocks(ticker) ON DELETE CASCADE,
  move_date date NOT NULL,
  pct numeric NOT NULL,
  price numeric,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (ticker, move_date)
);
ALTER TABLE public.price_moves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Price moves are readable by everyone" ON public.price_moves FOR SELECT USING (true);
