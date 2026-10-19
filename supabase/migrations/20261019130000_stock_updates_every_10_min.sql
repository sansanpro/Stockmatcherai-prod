-- Prices refresh every 10 minutes during US market hours (13:00-21:59 UTC covers 9:30-4:00 ET
-- in both EDT and EST). Each run refreshes ~90 of the stalest stocks, keeping all of them
-- within ~20 minutes; the app also refreshes a viewed stock on demand if it's older than that.
-- cron.schedule with an existing job name updates that job in place.
SELECT cron.schedule(
  'update-stock-data-market-hours',
  '*/10 13-21 * * 1-5',
  $$
  SELECT
    net.http_post(
        url:='https://lswusuoiwyxtswnbllgk.supabase.co/functions/v1/update-stock-data',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxzd3VzdW9pd3l4dHN3bmJsbGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwNjU1MjgsImV4cCI6MjA2NjY0MTUyOH0.g7DgedllsJSFJyGYHfeYq_r9YWSjzCYXdHC7F4SL6Ao"}'::jsonb,
        body:='{"updateType": "scheduled", "source": "cron"}'::jsonb
    ) as request_id;
  $$
);
