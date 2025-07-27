-- Add a new cron job for 4-hour stale stock cleanup (every 2 hours during market hours)
SELECT cron.schedule(
  'stale-stock-cleanup-4hours',
  '0 14,16,18,20 * * 1-5', -- Every 2 hours from 10 AM to 4 PM ET on weekdays (targeting 4+ hour old stocks)
  $$
  SELECT
    net.http_post(
        url:='https://lswusuoiwyxtswnbllgk.supabase.co/functions/v1/update-stock-data',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxzd3VzdW9pd3l4dHN3bmJsbGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwNjU1MjgsImV4cCI6MjA2NjY0MTUyOH0.g7DgedllsJSFJyGYHfeYq_r9YWSjzCYXdHC7F4SL6Ao"}'::jsonb,
        body:='{"updateType": "staleStockCleanup", "source": "cron-stale-cleanup"}'::jsonb
    ) as request_id;
  $$
);