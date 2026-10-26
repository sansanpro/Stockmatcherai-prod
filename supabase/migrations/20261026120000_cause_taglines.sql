-- Shorter cause taglines: one line each in the onboarding and Settings cause lists
UPDATE public.causes SET tagline = 'Cancer care, early detection and vaccines' WHERE id = 'beat_cancer';
UPDATE public.causes SET tagline = 'Prevention, medical devices and longevity' WHERE id = 'live_healthier';
UPDATE public.causes SET tagline = 'Solar, wind, batteries, the grid and EVs' WHERE id = 'clean_energy';
UPDATE public.causes SET tagline = 'Cybersecurity and safety technology' WHERE id = 'keeping_safe';
UPDATE public.causes SET label = 'Healthy food & farming', tagline = 'Sustainable farming and healthier food', icon = '🥗' WHERE id = 'clean_food';
UPDATE public.causes SET tagline = 'Treatments and care for mental health' WHERE id = 'mental_health';
