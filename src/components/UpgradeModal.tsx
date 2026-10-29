import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PLAN_LIMITS, useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';
import { Apple, Columns2, Crown, GraduationCap, Layers, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';
import { getAppleProducts, purchaseAppleSubscription } from '@/services/appleIAPService';
import { track } from '@/lib/analytics';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  // What brought the user here: finishing today's deck, running out of free questions, a Premium
  // feature (compare, tutor mode), or Settings
  reason?: 'deck' | 'ai' | 'compare' | 'tutor' | 'settings';
}

const { free, premium } = PLAN_LIMITS;

const HEADLINES: Record<NonNullable<UpgradeModalProps['reason']>, { title: string; text: string }> = {
  deck: {
    title: `You've seen today's ${free.dailyMatches} matches`,
    text: `Premium shows you ${premium.dailyMatches} companies a day for your causes. New matches arrive every morning either way.`,
  },
  ai: {
    title: `You've used your ${free.aiQuestionsPer24h} free questions`,
    text: 'Each one frees up again 24 hours after you asked it. With Premium, ask as many as you like.',
  },
  compare: {
    title: 'Compare side by side',
    text: 'Put two companies you liked next to each other, so the differences are easy to see.',
  },
  tutor: {
    title: 'Learn step by step',
    text: 'Tutor mode walks through any company or term one step at a time and explains each word as it comes up.',
  },
  settings: {
    title: 'Go deeper on the causes you care about',
    text: 'Premium adds more learning and more exploring.',
  },
};

// Only features that exist today; the limits are enforced on the server. Never "better picks".
const PERKS = [
  { icon: Layers, title: `${premium.dailyMatches} matches a day`, text: `Instead of ${free.dailyMatches}, all for your causes` },
  { icon: MessageCircle, title: 'Unlimited Ask AI', text: `Instead of ${free.aiQuestionsPer24h} questions a day` },
  { icon: GraduationCap, title: 'Tutor mode', text: 'Step-by-step explanations for beginners' },
  { icon: Columns2, title: 'Compare side by side', text: 'Two liked companies: story, proof, things to know, cautions' },
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
      <DialogContent className="max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto bg-surface border-premium-line p-0 gap-0 rounded-3xl duration-slow ease-out">
        <div className="bg-premium-tint border-b border-premium-line px-6 pt-7 pb-5 text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-premium-ink bg-white/80 border border-premium-line rounded-full px-2.5 py-1">
            <Crown className="w-3.5 h-3.5" aria-hidden /> Premium
          </span>
          <DialogHeader className="mt-3">
            <DialogTitle className="text-center text-2xl font-bold text-ink leading-tight">
              {HEADLINES[reason].title}
            </DialogTitle>
          </DialogHeader>
          <p className="text-ink-soft mt-2">{HEADLINES[reason].text}</p>
        </div>

        <div className="space-y-5 p-6">
          <ul className="space-y-3">
            {PERKS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="w-9 h-9 rounded-xl bg-premium-tint border border-premium-line flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-premium" aria-hidden />
                </span>
                <span className="text-sm leading-snug">
                  <span className="block font-semibold text-ink">{title}</span>
                  <span className="block text-ink-soft">{text}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="flex items-baseline justify-center gap-1">
            <span className="text-3xl font-bold text-ink">{price}</span>
            <span className="text-ink-soft">/month</span>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleApplePurchase}
              disabled={isProcessing || !appleProductAvailable}
              className="w-full h-12 rounded-xl bg-premium hover:bg-premium/90 text-white font-semibold"
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
              className="w-full h-12 rounded-xl border-line bg-white text-ink hover:bg-surface-2 font-semibold"
            >
              Maybe later
            </Button>
          </div>

          <div className="text-center text-xs text-ink-soft space-y-1">
            <p className="font-semibold text-ink-soft">Premium adds more learning and exploring. It doesn't pick stocks for you. Educational only, not investment advice.</p>
            <p>Subscription auto-renews monthly at {applePrice} until cancelled.</p>
            <p>Payment will be charged to your Apple ID account at confirmation of purchase.</p>
            <p>Manage or cancel anytime in Settings → Apple ID → Subscriptions.</p>
            <p className="mt-1">
              <a href="https://stockmatcherai.com/support" className="text-primary underline">Privacy Policy</a>
              {' · '}
              <a href="https://stockmatcherai.com/terms" className="text-primary underline">Terms of Service</a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;
