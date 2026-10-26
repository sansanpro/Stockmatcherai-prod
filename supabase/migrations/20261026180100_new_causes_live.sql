-- Turn on the two causes that the 2026-10-26 universe expansion filled
-- (Healthy food & farming: 12 companies; Mental health & wellbeing: 14).
UPDATE public.causes SET is_live = true WHERE id IN ('clean_food', 'mental_health');
