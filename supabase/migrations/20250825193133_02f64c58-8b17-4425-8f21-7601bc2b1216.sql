-- Add missing columns to user_profiles table to match UserProfile interface
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS age integer,
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS salary integer;

-- Update existing records to migrate age_range to age if possible
UPDATE public.user_profiles 
SET age = CASE 
  WHEN age_range = '18-25' THEN 22
  WHEN age_range = '26-35' THEN 30
  WHEN age_range = '36-45' THEN 40
  WHEN age_range = '46-55' THEN 50
  WHEN age_range = '56-65' THEN 60
  WHEN age_range = '65+' THEN 70
  ELSE NULL
END
WHERE age IS NULL AND age_range IS NOT NULL;