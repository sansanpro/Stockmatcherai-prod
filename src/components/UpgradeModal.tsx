import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';
import { Crown, Check, Apple } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';
import { getAppleProducts, purchaseAppleSubscription } from '@/services/appleIAPService';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UpgradeModal = ({ isOpen, onClose }: UpgradeModalProps) => {
  const { checkSubscription } = useSubscription();
  const { user, session } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [applePrice, setApplePrice] = useState<string>('$9.99/month');
  const [appleProductAvailable, setAppleProductAvailable] = useState(true);

  useEffect(() => {
    if (isOpen && Capacitor.isNativePlatform()) {
      loadAppleProduct();
    }
  }, [isOpen]);

  const loadAppleProduct = async () => {
    try {
      const products = await getAppleProducts();
      if (products.length > 0) {
        setApplePrice(products[0].displayPrice + '/month');
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
      <DialogContent className="max-w-md">
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
            <h3 className="text-lg font-semibold mb-2">You've reached your daily limit!</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Upgrade to Premium for unlimited swipes and advanced features.
            </p>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-semibold">Premium Plan</span>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">$9.99</div>
                <div className="text-sm text-gray-500">/month</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-sm font-semibold">24/7 AI Stock Research Assistant</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-sm">Unlimited instant AI insights</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-sm">Unlimited daily swipes</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-sm">Advanced filtering & analytics</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-sm">Real-time portfolio tracking</span>
              </div>
            </div>
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
