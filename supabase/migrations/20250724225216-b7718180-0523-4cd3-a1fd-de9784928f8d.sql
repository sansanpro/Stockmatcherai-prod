-- Enable Row Level Security on all stock tables
ALTER TABLE public.energy_stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technology_stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.healthcare_stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumer_stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utilities_stocks ENABLE ROW LEVEL SECURITY;