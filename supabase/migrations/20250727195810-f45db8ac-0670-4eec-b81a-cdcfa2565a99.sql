-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create stock_update_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.stock_update_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  update_type TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  stocks_processed INTEGER DEFAULT 0,
  errors_encountered INTEGER DEFAULT 0,
  error_details TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on stock_update_logs
ALTER TABLE public.stock_update_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for stock_update_logs (admin access only)
CREATE POLICY "Admin can view stock update logs" 
ON public.stock_update_logs 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- Schedule smart stock updates at 10 AM and 2 PM ET on weekdays
SELECT cron.schedule(
  'smart-stock-updates-morning',
  '0 14 * * 1-5', -- 10 AM ET (14:00 UTC) on weekdays
  $$
  SELECT
    net.http_post(
        url:='https://lswusuoiwyxtswnbllgk.supabase.co/functions/v1/update-stock-data',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxzd3VzdW9pd3l4dHN3bmJsbGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwNjU1MjgsImV4cCI6MjA2NjY0MTUyOH0.g7DgedllsJSFJyGYHfeYq_r9YWSjzCYXdHC7F4SL6Ao"}'::jsonb,
        body:='{"updateType": "smartScheduling", "source": "cron-morning"}'::jsonb
    ) as request_id;
  $$
);

SELECT cron.schedule(
  'smart-stock-updates-afternoon',
  '0 18 * * 1-5', -- 2 PM ET (18:00 UTC) on weekdays
  $$
  SELECT
    net.http_post(
        url:='https://lswusuoiwyxtswnbllgk.supabase.co/functions/v1/update-stock-data',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxzd3VzdW9pd3l4dHN3bmJsbGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwNjU1MjgsImV4cCI6MjA2NjY0MTUyOH0.g7DgedllsJSFJyGYHfeYq_r9YWSjzCYXdHC7F4SL6Ao"}'::jsonb,
        body:='{"updateType": "smartScheduling", "source": "cron-afternoon"}'::jsonb
    ) as request_id;
  $$
);

-- Schedule priority stock updates every 2 hours on weekdays (9 AM - 5 PM ET)
SELECT cron.schedule(
  'priority-stock-updates',
  '0 13,15,17,19,21 * * 1-5', -- Every 2 hours from 9 AM to 5 PM ET on weekdays
  $$
  SELECT
    net.http_post(
        url:='https://lswusuoiwyxtswnbllgk.supabase.co/functions/v1/update-stock-data',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxzd3VzdW9pd3l4dHN3bmJsbGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwNjU1MjgsImV4cCI6MjA2NjY0MTUyOH0.g7DgedllsJSFJyGYHfeYq_r9YWSjzCYXdHC7F4SL6Ao"}'::jsonb,
        body:='{"updateType": "priority", "source": "cron-priority"}'::jsonb
    ) as request_id;
  $$
);