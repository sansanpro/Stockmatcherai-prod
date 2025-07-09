-- Enable necessary extensions for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule CEO data update to run monthly on the 1st at 2 AM UTC
SELECT cron.schedule(
  'monthly-ceo-data-update',
  '0 2 1 * *', -- Run at 2 AM on the 1st of every month
  $$
  SELECT
    net.http_post(
        url:='https://lswusuoiwyxtswnbllgk.supabase.co/functions/v1/update-ceo-data',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxzd3VzdW9pd3l4dHN3bmJsbGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwNjU1MjgsImV4cCI6MjA2NjY0MTUyOH0.g7DgedllsJSFJyGYHfeYq_r9YWSjzCYXdHC7F4SL6Ao"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);

-- Create a function to manually trigger CEO data updates (for testing/on-demand use)
CREATE OR REPLACE FUNCTION trigger_ceo_data_update()
RETURNS void
LANGUAGE sql
AS $$
  SELECT
    net.http_post(
        url:='https://lswusuoiwyxtswnbllgk.supabase.co/functions/v1/update-ceo-data',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxzd3VzdW9pd3l4dHN3bmJsbGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwNjU1MjgsImV4cCI6MjA2NjY0MTUyOH0.g7DgedllsJSFJyGYHfeYq_r9YWSjzCYXdHC7F4SL6Ao"}'::jsonb,
        body:='{"manual": true}'::jsonb
    );
$$;