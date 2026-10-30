import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

// What each plan gets. Enforced on the server (match-feed builds the daily deck,
// stock-assistant counts questions); these values are only for the copy.
export const PLAN_LIMITS = {
  free: { dailyMatches: 7, firstDayMatches: 20, aiQuestionsPer24h: 5 },
  premium: { dailyMatches: 12 },
} as const;

interface SubscriptionContextType {
  subscribed: boolean;
  subscriptionTier: string;
  subscriptionEnd: string | null;
  loading: boolean;
  checkSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [subscribed, setSubscribed] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState('free');
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSubscription = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Check subscription status
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        // Set default free tier and continue - don't block the app
        setSubscribed(false);
        setSubscriptionTier('free');
        setSubscriptionEnd(null);
        return;
      }
      setSubscribed(data?.subscribed || false);
      setSubscriptionTier(data?.subscription_tier || 'free');
      setSubscriptionEnd(data?.subscription_end || null);
    } catch (error) {
      console.error('Error in checkSubscription:', error);
      // Ensure app continues to work even if subscription check fails
      setSubscribed(false);
      setSubscriptionTier('free');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      checkSubscription();
    } else {
      setSubscribed(false);
      setSubscriptionTier('free');
      setSubscriptionEnd(null);
      setLoading(false);
    }
  }, [user]);

  return (
    <SubscriptionContext.Provider value={{
      subscribed,
      subscriptionTier,
      subscriptionEnd,
      loading,
      checkSubscription,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};