-- Fix RLS policies for daily_swipe_limits table

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own swipe limits" ON public.daily_swipe_limits;
DROP POLICY IF EXISTS "Users can insert their own swipe limits" ON public.daily_swipe_limits;
DROP POLICY IF EXISTS "Users can update their own swipe limits" ON public.daily_swipe_limits;

-- Create proper RLS policies for daily_swipe_limits
CREATE POLICY "Users can view their own swipe limits" 
ON public.daily_swipe_limits 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own swipe limits" 
ON public.daily_swipe_limits 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own swipe limits" 
ON public.daily_swipe_limits 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);