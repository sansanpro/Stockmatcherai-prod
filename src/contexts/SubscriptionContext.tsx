import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface SubscriptionContextType {
  subscribed: boolean;
  subscriptionTier: string;
  subscriptionEnd: string | null;
  dailySwipesUsed: number;
  dailySwipeLimit: number;
  canSwipe: boolean;
  loading: boolean;
  checkSubscription: () => Promise<void>;
  incrementSwipeCount: () => Promise<void>;
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
  const [dailySwipesUsed, setDailySwipesUsed] = useState(0);
  const [loading, setLoading] = useState(true);

  const dailySwipeLimit = subscriptionTier === 'premium' ? Infinity : 10;
  const canSwipe = subscriptionTier === 'premium' || dailySwipesUsed < dailySwipeLimit;

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
        
        // Still check daily swipe usage even if subscription check fails
        await checkDailySwipeUsage();
        return;
      } else {
        setSubscribed(data?.subscribed || false);
        setSubscriptionTier(data?.subscription_tier || 'free');
        setSubscriptionEnd(data?.subscription_end || null);
      }

      // Check daily swipe usage
      await checkDailySwipeUsage();
    } catch (error) {
      console.error('Error in checkSubscription:', error);
      // Ensure app continues to work even if subscription check fails
      setSubscribed(false);
      setSubscriptionTier('free');
      setDailySwipesUsed(0);
    } finally {
      setLoading(false);
    }
  };

  const checkDailySwipeUsage = async () => {
    if (!user) return;
    
    try {
      const { data: swipeData, error: swipeError } = await supabase
        .from('daily_swipe_limits')
        .select('swipes_used')
        .eq('user_id', user.id)
        .eq('date', new Date().toISOString().split('T')[0])
        .maybeSingle();

      if (swipeError) {
        console.error('Error checking swipe usage:', swipeError);
        setDailySwipesUsed(0);
      } else {
        setDailySwipesUsed(swipeData?.swipes_used || 0);
      }
    } catch (error) {
      console.error('Error in checkDailySwipeUsage:', error);
      setDailySwipesUsed(0);
    }
  };

  const incrementSwipeCount = async () => {
    if (!user || subscriptionTier === 'premium') return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('daily_swipe_limits')
        .upsert({
          user_id: user.id,
          date: today,
          swipes_used: dailySwipesUsed + 1
        }, {
          onConflict: 'user_id,date'
        });

      if (error) {
        console.error('Error updating swipe count:', error);
      } else {
        setDailySwipesUsed(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error incrementing swipe count:', error);
    }
  };


  useEffect(() => {
    if (user) {
      checkSubscription();
    } else {
      setSubscribed(false);
      setSubscriptionTier('free');
      setSubscriptionEnd(null);
      setDailySwipesUsed(0);
      setLoading(false);
    }
  }, [user]);

  return (
    <SubscriptionContext.Provider value={{
      subscribed,
      subscriptionTier,
      subscriptionEnd,
      dailySwipesUsed,
      dailySwipeLimit,
      canSwipe,
      loading,
      checkSubscription,
      incrementSwipeCount
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};