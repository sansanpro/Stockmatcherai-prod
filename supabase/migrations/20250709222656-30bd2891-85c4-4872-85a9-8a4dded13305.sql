-- Fix the hardcoded URL in the cron job and trigger function
SELECT cron.unschedule('monthly-ceo-data-update');

-- Re-create the cron job with correct project URL
SELECT cron.schedule(
  'monthly-ceo-data-update',
  '0 2 1 * *', -- Run at 2 AM on the 1st of every month
  $$
  SELECT
    net.http_post(
        url:='https://a8e2b687-48bf-4171-9dfa-1c6295dd71d3.supabase.co/functions/v1/update-ceo-data',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxzd3VzdW9pd3l4dHN3bmJsbGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwNjU1MjgsImV4cCI6MjA2NjY0MTUyOH0.g7DgedllsJSFJyGYHfeYq_r9YWSjzCYXdHC7F4SL6Ao"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);

-- Update the manual trigger function with correct URL
CREATE OR REPLACE FUNCTION trigger_ceo_data_update()
RETURNS void
LANGUAGE sql
AS $$
  SELECT
    net.http_post(
        url:='https://a8e2b687-48bf-4171-9dfa-1c6295dd71d3.supabase.co/functions/v1/update-ceo-data',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxzd3VzdW9pd3l4dHN3bmJsbGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwNjU1MjgsImV4cCI6MjA2NjY0MTUyOH0.g7DgedllsJSFJyGYHfeYq_r9YWSjzCYXdHC7F4SL6Ao"}'::jsonb,
        body:='{"manual": true}'::jsonb
    );
$$;