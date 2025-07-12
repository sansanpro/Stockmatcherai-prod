-- Update the cron job to use smart scheduling instead of fixed schedule
SELECT cron.unschedule('monthly-ceo-data-update');

-- Create new smart scheduling cron job that runs every 2 hours during market time
SELECT cron.schedule(
  'smart-stock-update',
  '0 */2 * * *', -- Run every 2 hours
  $$
  SELECT
    net.http_post(
        url:='https://lswusuoiwyxtswnbllgk.supabase.co/functions/v1/update-stock-data',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxzd3VzdW9pd3l4dHN3bmJsbGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwNjU1MjgsImV4cCI6MjA2NjY0MTUyOH0.g7DgedllsJSFJyGYHfeYq_r9YWSjzCYXdHC7F4SL6Ao"}'::jsonb,
        body:='{"smartScheduling": true, "updateType": "smart_scheduled"}'::jsonb
    ) as request_id;
  $$
);