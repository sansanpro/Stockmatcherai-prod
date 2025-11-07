-- Drop the insecure policies that allow anyone to create/update subscriptions
DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;

-- Only service role (backend functions) can insert subscription records
CREATE POLICY "Service role can insert subscriptions"
ON public.subscribers
FOR INSERT
TO service_role
WITH CHECK (true);

-- Only service role can update subscription records
CREATE POLICY "Service role can update subscriptions"
ON public.subscribers
FOR UPDATE
TO service_role
USING (true);

-- Users can still read their own subscription data
-- (The existing select_own_subscription policy already handles this correctly)