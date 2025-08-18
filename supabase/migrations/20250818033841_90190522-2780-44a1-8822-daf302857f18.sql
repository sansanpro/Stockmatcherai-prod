-- Grant premium access to test account
INSERT INTO public.subscribers (email, subscribed, subscription_tier, subscription_end)
VALUES ('Hassan.omarit@gmail.com', true, 'premium', '2025-12-31 23:59:59+00')
ON CONFLICT (email) 
DO UPDATE SET 
  subscribed = true,
  subscription_tier = 'premium',
  subscription_end = '2025-12-31 23:59:59+00',
  updated_at = now();