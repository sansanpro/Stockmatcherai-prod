-- Fix: Remove public read access to stock_update_logs
-- This table contains sensitive business intelligence about API usage and system operations

DROP POLICY IF EXISTS "Allow public read access to stock update logs" ON public.stock_update_logs;

-- Only service role can view these logs
CREATE POLICY "Service role can view stock update logs"
ON public.stock_update_logs
FOR SELECT
TO service_role
USING (true);