
-- Create a profiles table to store additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Create a function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create table for user watchlists
CREATE TABLE public.user_watchlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ticker TEXT NOT NULL,
  company_name TEXT NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  stock_data JSONB,
  UNIQUE(user_id, ticker)
);

-- Enable RLS for watchlists
ALTER TABLE public.user_watchlists ENABLE ROW LEVEL SECURITY;

-- Create policies for watchlists
CREATE POLICY "Users can view their own watchlist" 
  ON public.user_watchlists 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own watchlist" 
  ON public.user_watchlists 
  FOR ALL 
  USING (auth.uid() = user_id);

-- Create table for user swipe history and matches
CREATE TABLE public.user_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ticker TEXT NOT NULL,
  company_name TEXT NOT NULL,
  is_match BOOLEAN NOT NULL,
  matched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  stock_data JSONB,
  match_reason TEXT
);

-- Enable RLS for matches
ALTER TABLE public.user_matches ENABLE ROW LEVEL SECURITY;

-- Create policies for matches
CREATE POLICY "Users can view their own matches" 
  ON public.user_matches 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own matches" 
  ON public.user_matches 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create table for user profiles (investment preferences)
CREATE TABLE public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  age_range TEXT,
  investment_experience TEXT,
  risk_tolerance TEXT,
  investment_goals TEXT[],
  income_level TEXT,
  time_horizon TEXT,
  sectors_of_interest TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for user profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for user profiles
CREATE POLICY "Users can view their own investment profile" 
  ON public.user_profiles 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own investment profile" 
  ON public.user_profiles 
  FOR ALL 
  USING (auth.uid() = user_id);
