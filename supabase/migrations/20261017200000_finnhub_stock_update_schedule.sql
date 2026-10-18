-- Switch stock price updates to Finnhub's free-tier rate limit (~60 calls/min).
-- Remove every previous update-stock-data schedule (only the ones that still exist),
-- then refresh every 15 minutes during US market hours (13:00-21:59 UTC covers 9:30-4:00 ET year-round).
SELECT cron.unschedule(jobname)
FROM cron.job
WHERE jobname IN (
  'update-stock-data-every-2-minutes',
  'update-stock-data-every-4-hours',
  'smart-stock-update',
  'smart-stock-updates-morning',
  'smart-stock-updates-afternoon',
  'priority-stock-updates',
  'stale-stock-cleanup-4hours',
  'stock-update-every-6h',
  'daily-stock-update'
);

SELECT cron.schedule(
  'update-stock-data-market-hours',
  '*/15 13-21 * * 1-5',
  $$
  SELECT
    net.http_post(
        url:='https://lswusuoiwyxtswnbllgk.supabase.co/functions/v1/update-stock-data',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxzd3VzdW9pd3l4dHN3bmJsbGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwNjU1MjgsImV4cCI6MjA2NjY0MTUyOH0.g7DgedllsJSFJyGYHfeYq_r9YWSjzCYXdHC7F4SL6Ao"}'::jsonb,
        body:='{"updateType": "scheduled", "source": "cron"}'::jsonb
    ) as request_id;
  $$
);
