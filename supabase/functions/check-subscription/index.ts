import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

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

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Detect Stripe environment (test vs live)
    const isTestMode = stripeKey.startsWith('sk_test_');
    const isLiveMode = stripeKey.startsWith('sk_live_');
    logStep("Stripe environment detected", { 
      isTestMode, 
      isLiveMode, 
      keyPrefix: stripeKey.substring(0, 8) + '...' 
    });
    
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, updating unsubscribed state");
      await supabaseClient.from("subscribers").upsert({
        email: user.email,
        user_id: user.id,
        stripe_customer_id: null,
        subscribed: false,
        subscription_tier: 'free',
        subscription_end: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });
      return new Response(JSON.stringify({ subscribed: false, subscription_tier: 'free' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Get ALL subscriptions for this customer (including canceled ones to debug)
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 100, // Get all subscriptions
      // Don't filter by status - get everything
    });
    
    // Log detailed subscription information for debugging
    logStep("Raw subscription data", { 
      customer: customerId,
      environment: isTestMode ? 'test' : (isLiveMode ? 'live' : 'unknown'),
      totalSubscriptions: subscriptions.data.length,
      subscriptions: subscriptions.data.map(s => ({
        id: s.id,
        status: s.status,
        created: new Date(s.created * 1000).toISOString(),
        current_period_start: new Date(s.current_period_start * 1000).toISOString(),
        current_period_end: new Date(s.current_period_end * 1000).toISOString(),
        cancel_at_period_end: s.cancel_at_period_end,
        canceled_at: s.canceled_at ? new Date(s.canceled_at * 1000).toISOString() : null,
        items: s.items.data.map(item => ({
          price_id: item.price.id,
          product_id: item.price.product
        }))
      }))
    });
    
    // If no subscriptions found at all, log this specifically
    if (subscriptions.data.length === 0) {
      logStep("CRITICAL: No subscriptions found for customer", { 
        customerId,
        customerEmail: user.email,
        environment: isTestMode ? 'test' : (isLiveMode ? 'live' : 'unknown'),
        suggestion: "Check if subscription was created in different Stripe environment"
      });
    }
    
    // Check ALL possible subscription statuses that could indicate an active subscription
    const potentiallyActiveSubscriptions = subscriptions.data.filter(sub => 
      sub.status === 'active' || 
      sub.status === 'trialing' || 
      sub.status === 'past_due' ||
      sub.status === 'incomplete' ||
      sub.status === 'unpaid'
    );
    
    // Also check for recently canceled subscriptions that might still be valid
    const recentlyCanceledButStillValid = subscriptions.data.filter(sub => 
      sub.status === 'canceled' && 
      sub.current_period_end > Math.floor(Date.now() / 1000) && // Still in current period
      !sub.cancel_at_period_end // Was not set to cancel at period end
    );
    
    logStep("Subscription analysis", { 
      total: subscriptions.data.length,
      potentiallyActive: potentiallyActiveSubscriptions.length,
      recentlyCanceledButValid: recentlyCanceledButStillValid.length,
      allStatuses: subscriptions.data.map(s => ({ id: s.id, status: s.status }))
    });
    
    const activeSubscriptions = [...potentiallyActiveSubscriptions, ...recentlyCanceledButStillValid];
    logStep("All subscriptions found", { 
      total: subscriptions.data.length, 
      statuses: subscriptions.data.map(s => ({ id: s.id, status: s.status }))
    });
    
    const hasActiveSub = activeSubscriptions.length > 0;
    let subscriptionTier = 'free';
    let subscriptionEnd = null;

    if (hasActiveSub) {
      const subscription = activeSubscriptions[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      subscriptionTier = 'premium';
      logStep("Active subscription found", { 
        subscriptionId: subscription.id, 
        status: subscription.status,
        endDate: subscriptionEnd 
      });
    } else {
      logStep("No active subscription found");
    }

    await supabaseClient.from("subscribers").upsert({
      email: user.email,
      user_id: user.id,
      stripe_customer_id: customerId,
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });

    logStep("Updated database with subscription info", { subscribed: hasActiveSub, subscriptionTier });
    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd
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