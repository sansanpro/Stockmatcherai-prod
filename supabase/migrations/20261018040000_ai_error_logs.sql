-- Failures from the AI edge functions, so they can be inspected with SQL
-- (function logs aren't readable from the CLI). Service role only: RLS on, no policies.
CREATE TABLE IF NOT EXISTS public.ai_error_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  function_name text NOT NULL,
  stage text NOT NULL,
  user_id uuid,
  model text,
  status integer,
  message text
);

ALTER TABLE public.ai_error_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS ai_error_logs_created_at_idx ON public.ai_error_logs (created_at DESC);
