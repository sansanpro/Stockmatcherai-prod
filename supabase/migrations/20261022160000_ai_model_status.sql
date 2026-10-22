-- Gemini models that recently failed or hung, so every edge function instance tries them last
-- until they recover (see _shared/gemini.ts). Service role only: RLS on, no policies.
CREATE TABLE IF NOT EXISTS public.ai_model_status (
  model text PRIMARY KEY,
  cooling_until timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_model_status ENABLE ROW LEVEL SECURITY;
