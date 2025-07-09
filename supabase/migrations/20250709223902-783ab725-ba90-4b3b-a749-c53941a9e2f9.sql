-- Update the manual trigger function with the proper lovable project URL format
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