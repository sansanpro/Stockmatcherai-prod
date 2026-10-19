-- Values-first foundation (Release 1): causes, mission tags, dealbreaker flags, server-built
-- decks and swipes, new onboarding answers, and first-party analytics.

-- Causes a user can match on. Only causes with enough reviewed companies are live.
CREATE TABLE public.causes (
  id text PRIMARY KEY,
  label text NOT NULL,
  tagline text NOT NULL,
  icon text NOT NULL,
  sort_order integer NOT NULL,
  is_live boolean NOT NULL DEFAULT false
);

INSERT INTO public.causes (id, label, tagline, icon, sort_order, is_live) VALUES
  ('beat_cancer',           'Beat cancer & disease',     'Cancer treatment, early detection, diagnostics and vaccines',      '🎗️', 1, true),
  ('live_healthier',        'Live longer & healthier',   'Preventive health, medical devices and longevity research',        '❤️', 2, true),
  ('clean_energy',          'Clean energy & climate',    'Solar, wind, the power grid, batteries and energy efficiency',     '☀️', 3, true),
  ('keeping_safe',          'Keeping people safe',       'Cybersecurity and safety technology',                              '🛡️', 4, true),
  ('clean_water',           'Clean water',               'Water treatment, testing and infrastructure',                      '💧', 5, false),
  ('mental_health',         'Mental health & wellbeing', 'Behavioral health care and digital mental health',                 '🧠', 6, false),
  ('clean_food',            'Clean food & farming',      'Food safety, natural food, sustainable farming and alt protein',   '🌾', 7, false),
  ('homes_communities',     'Homes & communities',       'Affordable housing, infrastructure and local banking',             '🏘️', 8, false),
  ('opportunity_education', 'Opportunity & education',   'Education, financial inclusion and workforce training',            '🎓', 9, false);

ALTER TABLE public.causes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Causes are readable by everyone" ON public.causes FOR SELECT USING (true);

-- What each company works on, with evidence. Only approved tags are public or used for matching.
-- exposure: core = the cause is central to the business, partial = a meaningful part of it,
-- peripheral = a minor link (never shown in the feed).
CREATE TABLE public.stock_missions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ticker text NOT NULL REFERENCES public.stocks (ticker) ON DELETE CASCADE,
  cause text NOT NULL REFERENCES public.causes (id),
  exposure text NOT NULL CHECK (exposure IN ('core', 'partial', 'peripheral')),
  evidence text NOT NULL CHECK (char_length(evidence) > 0),
  source_url text NOT NULL CHECK (source_url ~ '^https?://'),
  why_line text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  tagged_by text NOT NULL CHECK (tagged_by IN ('ai', 'human')),
  reviewed_at timestamptz,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ticker, cause)
);

ALTER TABLE public.stock_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved missions are readable by everyone" ON public.stock_missions
  FOR SELECT USING (status = 'approved');
CREATE INDEX stock_missions_cause_idx ON public.stock_missions (cause) WHERE status = 'approved';

-- Dealbreaker flags: a company with a flag the user rejects never appears in their feed
CREATE TABLE public.stock_flags (
  ticker text NOT NULL REFERENCES public.stocks (ticker) ON DELETE CASCADE,
  dealbreaker text NOT NULL CHECK (dealbreaker IN
    ('tobacco', 'weapons', 'fossil_fuels', 'gambling', 'animal_testing', 'factory_farming')),
  evidence text NOT NULL CHECK (char_length(evidence) > 0),
  source_url text NOT NULL CHECK (source_url ~ '^https?://'),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (ticker, dealbreaker)
);

ALTER TABLE public.stock_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Flags are readable by everyone" ON public.stock_flags FOR SELECT USING (true);

-- Companies per cause, for the cause picker's live counts
CREATE VIEW public.cause_company_counts WITH (security_invoker = true) AS
SELECT c.id AS cause,
       c.label,
       c.is_live,
       count(DISTINCT m.ticker) FILTER (WHERE m.status = 'approved' AND m.exposure IN ('core', 'partial')) AS companies
FROM public.causes c
LEFT JOIN public.stock_missions m ON m.cause = c.id
GROUP BY c.id, c.label, c.is_live;

GRANT SELECT ON public.cause_company_counts TO anon, authenticated;

-- Server-built daily decks and swipes. Users read their own; only match-feed (service role) writes,
-- which is what makes the daily limit enforceable.
CREATE TABLE public.daily_decks (
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  deck_date date NOT NULL,
  cards jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, deck_date)
);

ALTER TABLE public.daily_decks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own decks" ON public.daily_decks
  FOR SELECT USING (auth.uid() = user_id);

CREATE TABLE public.swipes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  ticker text NOT NULL,
  liked boolean NOT NULL,
  cause text REFERENCES public.causes (id), -- the cause the card was shown for
  card_type text NOT NULL DEFAULT 'company' CHECK (card_type IN ('company', 'update')),
  deck_date date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, ticker, deck_date)
);

ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own swipes" ON public.swipes
  FOR SELECT USING (auth.uid() = user_id);
CREATE INDEX swipes_user_created_idx ON public.swipes (user_id, created_at DESC);

-- Onboarding v2 answers. Gender, salary and age stop being written but stay nullable for now.
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS causes text[],          -- cause ids, ordered by rank
  ADD COLUMN IF NOT EXISTS dealbreakers text[],
  ADD COLUMN IF NOT EXISTS motivation text,
  ADD COLUMN IF NOT EXISTS horizon text,
  ADD COLUMN IF NOT EXISTS starting_amount text,
  ADD COLUMN IF NOT EXISTS onboarding_version integer NOT NULL DEFAULT 1;

-- First-party product analytics. Anyone can add events (onboarding runs before sign-in),
-- nobody can read them through the API.
CREATE TABLE public.analytics_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  event text NOT NULL CHECK (char_length(event) BETWEEN 1 AND 64),
  anonymous_id text NOT NULL CHECK (char_length(anonymous_id) BETWEEN 8 AND 64), -- per install
  user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE,
  session_id text CHECK (char_length(session_id) <= 64),
  platform text CHECK (char_length(platform) <= 16),
  app_version text CHECK (char_length(app_version) <= 32),
  props jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (pg_column_size(props) <= 4000)
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can record events" ON public.analytics_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());
CREATE INDEX analytics_events_event_idx ON public.analytics_events (event, created_at);
CREATE INDEX analytics_events_install_idx ON public.analytics_events (anonymous_id, created_at);
