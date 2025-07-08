-- Add last_updated column to all stock tables and create a stock update log table
ALTER TABLE technology_stocks ADD COLUMN IF NOT EXISTS last_updated timestamp with time zone DEFAULT now();
ALTER TABLE healthcare_stocks ADD COLUMN IF NOT EXISTS last_updated timestamp with time zone DEFAULT now();
ALTER TABLE finance_stocks ADD COLUMN IF NOT EXISTS last_updated timestamp with time zone DEFAULT now();
ALTER TABLE energy_stocks ADD COLUMN IF NOT EXISTS last_updated timestamp with time zone DEFAULT now();
ALTER TABLE consumer_stocks ADD COLUMN IF NOT EXISTS last_updated timestamp with time zone DEFAULT now();
ALTER TABLE utilities_stocks ADD COLUMN IF NOT EXISTS last_updated timestamp with time zone DEFAULT now();

-- Create stock update log table to track update history
CREATE TABLE IF NOT EXISTS public.stock_update_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sector text NOT NULL,
  update_type text NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'priority', 'manual'
  stocks_updated integer DEFAULT 0,
  stocks_failed integer DEFAULT 0,
  api_calls_used integer DEFAULT 0,
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  status text DEFAULT 'running', -- 'running', 'completed', 'failed'
  error_message text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on stock_update_logs
ALTER TABLE public.stock_update_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for stock_update_logs (public read access for admin monitoring)
CREATE POLICY "Allow public read access to stock update logs" 
ON public.stock_update_logs 
FOR SELECT 
USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_stock_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all stock tables
CREATE TRIGGER update_technology_stocks_timestamp
  BEFORE UPDATE ON public.technology_stocks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stock_timestamp();

CREATE TRIGGER update_healthcare_stocks_timestamp
  BEFORE UPDATE ON public.healthcare_stocks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stock_timestamp();

CREATE TRIGGER update_finance_stocks_timestamp
  BEFORE UPDATE ON public.finance_stocks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stock_timestamp();

CREATE TRIGGER update_energy_stocks_timestamp
  BEFORE UPDATE ON public.energy_stocks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stock_timestamp();

CREATE TRIGGER update_consumer_stocks_timestamp
  BEFORE UPDATE ON public.consumer_stocks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stock_timestamp();

CREATE TRIGGER update_utilities_stocks_timestamp
  BEFORE UPDATE ON public.utilities_stocks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stock_timestamp();

-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;