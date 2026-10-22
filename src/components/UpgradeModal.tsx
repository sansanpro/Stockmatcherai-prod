import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PLAN_LIMITS, useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';
import { Crown, Check, Apple } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';
import { getAppleProducts, purchaseAppleSubscription } from '@/services/appleIAPService';
import { track } from '@/lib/analytics';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  // What brought the user here: finishing today's deck, running out of free questions, or Settings
  reason?: 'deck' | 'ai' | 'settings';
}

const { free, premium } = PLAN_LIMITS;

const HEADLINES: Record<NonNullable<UpgradeModalProps['reason']>, { title: string; text: string }> = {
  deck: {
    title: `You've seen today's ${free.dailyMatches} matches`,
    text: `Premium shows you ${premium.dailyMatches} companies a day. New matches arrive every morning either way.`,
  },
  ai: {
    title: `You've used your ${free.aiQuestionsPer24h} free questions`,
    text: 'Each one frees up again 24 hours after you asked it. With Premium, ask as many as you like.',
  },
  settings: {
    title: 'More to explore every day',
    text: 'Premium gives you more companies working on your causes, and unlimited questions.',
  },
};

// Only features that exist; the limits are enforced on the server
const PERKS = [
  `${premium.dailyMatches} matches a day instead of ${free.dailyMatches}`,
  `Unlimited Ask AI questions instead of ${free.aiQuestionsPer24h} a day`,
];

const UpgradeModal = ({ isOpen, onClose, reason = 'settings' }: UpgradeModalProps) => {
  const { checkSubscription } = useSubscription();
  const { user, session } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [price, setPrice] = useState('$9.99');
  const applePrice = `${price}/month`;
  const [appleProductAvailable, setAppleProductAvailable] = useState(true);

  useEffect(() => {
    if (isOpen) track('paywall_shown', { reason });
    if (isOpen && Capacitor.isNativePlatform()) {
      loadAppleProduct();
    }
  }, [isOpen]);

  const loadAppleProduct = async () => {
    try {
      const products = await getAppleProducts();
      if (products.length > 0) {
        setPrice(products[0].displayPrice);
      }
      // Keep button enabled regardless — StoreKit handles the purchase
      // even if product details fail to pre-load
      setAppleProductAvailable(true);
    } catch (e) {
      console.error('Failed to load Apple product:', e);
      // Don't disable: allow the purchase attempt so reviewers/users
      // aren't blocked by a transient StoreKit lookup failure
      setAppleProductAvailable(true);
    }
  };

  const handleApplePurchase = async () => {
    setIsProcessing(true);
    track('purchase_started');
    try {
      const result = await purchaseAppleSubscription(user?.id);

      const { error } = await supabase.functions.invoke('verify-apple-receipt', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: {
          jwsToken: result.jwsRepresentation,
          transactionId: result.transactionId,
          productId: result.productIdentifier,
          expirationDate: result.expirationDate,
        },
      });

      if (error) throw error;

      toast.success('Subscription activated!');
      track('purchase_completed');
      await checkSubscription();
      onClose();
    } catch (error: any) {
      console.error('Apple purchase error:', error);
      if (error?.message?.includes('cancelled') || error?.code === 'USER_CANCELLED') {
        // User cancelled — no toast
      } else if (error?.code === 'UNIMPLEMENTED') {
        toast.error('In-App Purchase is not available. Please ensure the app is up to date.');
      } else {
        toast.error('Purchase failed. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setIsProcessing(false);
    onClose();
    checkSubscription();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      {/* Scrolls on small phones so the title and the required Privacy/Terms links stay reachable */}
      <DialogContent className="max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Upgrade to Premium
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{HEADLINES[reason].title}</h3>
            <p className="text-gray-600 dark:text-gray-400">{HEADLINES[reason].text}</p>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-semibold">Premium Plan</span>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{price}</div>
                <div className="text-sm text-gray-500">/month</div>
              </div>
            </div>

            <ul className="space-y-2">
              {PERKS.map(perk => (
                <li key={perk} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm">{perk}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleApplePurchase}
              disabled={isProcessing || !appleProductAvailable}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Apple className="w-4 h-4 mr-2" />
                  Subscribe via App Store — {applePrice}
                </>
              )}
            </Button>
            <Button
              onClick={handleClose}
              variant="outline"
              className="w-full"
            >
              Maybe Later
            </Button>
          </div>

          <div className="text-center text-xs text-gray-500 space-y-1">
            <p>Subscription auto-renews monthly at {applePrice} until cancelled.</p>
            <p>Payment will be charged to your Apple ID account at confirmation of purchase.</p>
            <p>Manage or cancel anytime in Settings → Apple ID → Subscriptions.</p>
            <p className="mt-1">
              <a href="https://stockmatcherai.com/support" className="underline">Privacy Policy</a>
              {' · '}
              <a href="https://stockmatcherai.com/terms" className="underline">Terms of Service</a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;
