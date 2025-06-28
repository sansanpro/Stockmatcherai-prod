
-- Create table for Technology stocks
CREATE TABLE public.technology_stocks (
  id TEXT PRIMARY KEY,
  ticker TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  ceo_name TEXT NOT NULL,
  ceo_highlights TEXT NOT NULL,
  pe_ratio DECIMAL NOT NULL,
  market_cap TEXT NOT NULL,
  one_year_return DECIMAL NOT NULL,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')) NOT NULL,
  price_per_share DECIMAL NOT NULL,
  dividend_yield DECIMAL NOT NULL,
  esg_score INTEGER DEFAULT 75,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for Healthcare stocks
CREATE TABLE public.healthcare_stocks (
  id TEXT PRIMARY KEY,
  ticker TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  ceo_name TEXT NOT NULL,
  ceo_highlights TEXT NOT NULL,
  pe_ratio DECIMAL NOT NULL,
  market_cap TEXT NOT NULL,
  one_year_return DECIMAL NOT NULL,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')) NOT NULL,
  price_per_share DECIMAL NOT NULL,
  dividend_yield DECIMAL NOT NULL,
  esg_score INTEGER DEFAULT 75,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for Finance stocks
CREATE TABLE public.finance_stocks (
  id TEXT PRIMARY KEY,
  ticker TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  ceo_name TEXT NOT NULL,
  ceo_highlights TEXT NOT NULL,
  pe_ratio DECIMAL NOT NULL,
  market_cap TEXT NOT NULL,
  one_year_return DECIMAL NOT NULL,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')) NOT NULL,
  price_per_share DECIMAL NOT NULL,
  dividend_yield DECIMAL NOT NULL,
  esg_score INTEGER DEFAULT 75,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for Energy stocks
CREATE TABLE public.energy_stocks (
  id TEXT PRIMARY KEY,
  ticker TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  ceo_name TEXT NOT NULL,
  ceo_highlights TEXT NOT NULL,
  pe_ratio DECIMAL NOT NULL,
  market_cap TEXT NOT NULL,
  one_year_return DECIMAL NOT NULL,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')) NOT NULL,
  price_per_share DECIMAL NOT NULL,
  dividend_yield DECIMAL NOT NULL,
  esg_score INTEGER DEFAULT 75,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for Consumer stocks
CREATE TABLE public.consumer_stocks (
  id TEXT PRIMARY KEY,
  ticker TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  ceo_name TEXT NOT NULL,
  ceo_highlights TEXT NOT NULL,
  pe_ratio DECIMAL NOT NULL,
  market_cap TEXT NOT NULL,
  one_year_return DECIMAL NOT NULL,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')) NOT NULL,
  price_per_share DECIMAL NOT NULL,
  dividend_yield DECIMAL NOT NULL,
  esg_score INTEGER DEFAULT 75,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for Utilities stocks
CREATE TABLE public.utilities_stocks (
  id TEXT PRIMARY KEY,
  ticker TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  ceo_name TEXT NOT NULL,
  ceo_highlights TEXT NOT NULL,
  pe_ratio DECIMAL NOT NULL,
  market_cap TEXT NOT NULL,
  one_year_return DECIMAL NOT NULL,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')) NOT NULL,
  price_per_share DECIMAL NOT NULL,
  dividend_yield DECIMAL NOT NULL,
  esg_score INTEGER DEFAULT 75,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security for all sector tables (optional - for future user-specific data)
ALTER TABLE public.technology_stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.healthcare_stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.energy_stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumer_stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utilities_stocks ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public read access (since these are reference data)
CREATE POLICY "Allow public read access to technology stocks" ON public.technology_stocks FOR SELECT USING (true);
CREATE POLICY "Allow public read access to healthcare stocks" ON public.healthcare_stocks FOR SELECT USING (true);
CREATE POLICY "Allow public read access to finance stocks" ON public.finance_stocks FOR SELECT USING (true);
CREATE POLICY "Allow public read access to energy stocks" ON public.energy_stocks FOR SELECT USING (true);
CREATE POLICY "Allow public read access to consumer stocks" ON public.consumer_stocks FOR SELECT USING (true);
CREATE POLICY "Allow public read access to utilities stocks" ON public.utilities_stocks FOR SELECT USING (true);
