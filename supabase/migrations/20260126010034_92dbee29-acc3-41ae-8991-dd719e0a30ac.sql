-- Drop the unused trigger_ceo_data_update function
-- This function was calling a non-existent edge function (update-ceo-data)
DROP FUNCTION IF EXISTS public.trigger_ceo_data_update();