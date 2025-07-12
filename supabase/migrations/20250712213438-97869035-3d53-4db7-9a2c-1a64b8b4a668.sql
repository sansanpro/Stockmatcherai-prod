-- Create a cron job to update stock data every 6 hours
SELECT cron.schedule(
  'stock-update-every-6h',
  '0 */6 * * *', -- Run every 6 hours (00:00, 06:00, 12:00, 18:00 UTC)
  $$
  SELECT
    net.http_post(
        url:='https://lswusuoiwyxtswnbllgk.supabase.co/functions/v1/update-stock-data',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxzd3VzdW9pd3l4dHN3bmJsbGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwNjU1MjgsImV4cCI6MjA2NjY0MTUyOH0.g7DgedllsJSFJyGYHfeYq_r9YWSjzCYXdHC7F4SL6Ao"}'::jsonb,
        body:='{"sector": "all", "update_type": "scheduled"}'::jsonb
    ) as request_id;
  $$
);