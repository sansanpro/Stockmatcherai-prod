import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Premium comes from two sources:
//   'apple'  - App Store subscription, written by verify-apple-receipt
//   'manual' - granted by hand (e.g. test accounts); optional subscription_end
// Anything else (including legacy 'stripe' rows) is treated as free.
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id });

    const { data: subscriber, error: subscriberLookupError } = await supabaseClient
      .from("subscribers")
      .select("subscribed, subscription_tier, subscription_end, subscription_source")
      .eq("user_id", user.id)
      .maybeSingle();

    if (subscriberLookupError) {
      logStep("Subscriber lookup failed", { message: subscriberLookupError.message });
    }

    const notExpired = !subscriber?.subscription_end ||
      new Date(subscriber.subscription_end).getTime() > Date.now();
    const isPremiumSource = subscriber?.subscription_source === 'apple' || subscriber?.subscription_source === 'manual';
    const isActive = Boolean(subscriber?.subscribed && isPremiumSource && notExpired &&
      // Apple subscriptions always carry an end date; a missing one means invalid data
      (subscriber.subscription_source !== 'apple' || subscriber.subscription_end));

    if (isActive) {
      logStep("Active subscription", { source: subscriber!.subscription_source, end: subscriber!.subscription_end });
      return new Response(JSON.stringify({
        subscribed: true,
        subscription_tier: subscriber!.subscription_tier || 'premium',
        subscription_end: subscriber!.subscription_end || null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Other functions (e.g. stock-assistant) read subscribers.subscribed directly, so clear stale flags
    if (subscriber?.subscribed) {
      logStep("Clearing expired or unsupported subscription", subscriber);
      await supabaseClient
        .from("subscribers")
        .update({ subscribed: false, subscription_tier: 'free', updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
    }

    return new Response(JSON.stringify({
      subscribed: false,
      subscription_tier: 'free',
      subscription_end: subscriber?.subscription_end || null,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
