import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';
import { Crown, Check, CreditCard, Apple } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import StripeCheckout from './StripeCheckout';
import { Capacitor } from '@capacitor/core';
import { getAppleProducts, purchaseAppleSubscription } from '@/services/appleIAPService';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const isIOSNative = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';

const UpgradeModal = ({ isOpen, onClose }: UpgradeModalProps) => {
  const { checkSubscription } = useSubscription();
  const { user, session } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [applePrice, setApplePrice] = useState<string>('$9.99/month');
  const [appleProductAvailable, setAppleProductAvailable] = useState(true);

  // Track paywall event when modal opens
  useEffect(() => {
    if (isOpen) {
      if (isIOSNative) {
        loadAppleProduct();
      }
    }
  }, [isOpen]);

  const loadAppleProduct = async () => {
    try {
      const products = await getAppleProducts();
      if (products.length > 0) {
        setApplePrice(products[0].displayPrice + '/month');
        setAppleProductAvailable(true);
      } else {
        setAppleProductAvailable(false);
      }
    } catch (e) {
      console.error('Failed to load Apple product:', e);
      setAppleProductAvailable(false);
    }
  };

  const handleApplePurchase = async () => {
    setIsProcessing(true);
    try {
      const result = await purchaseAppleSubscription(user?.id);
      
      // Verify with backend
      const { error } = await supabase.functions.invoke('verify-apple-receipt', {
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
        // User cancelled - no error toast
      } else if (error?.code === 'UNIMPLEMENTED') {
        toast.error('In-App Purchase is not available. Please ensure the app is up to date.');
      } else {
        toast.error('Purchase failed. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      if (!user || !session) {
        throw new Error('You must be logged in to upgrade. Please sign in and try again.');
      }

      if (!session.access_token) {
        const { data: refreshedSession, error: refreshError } = await supabase.auth.getSession();
        
        if (refreshError || !refreshedSession.session?.access_token) {
          throw new Error('Authentication session expired. Please sign in again.');
        }
      }

      const accessToken = session.access_token;

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (error) {
        throw new Error(`Checkout service error: ${error.message || JSON.stringify(error)}`);
      }

      if (!data) {
        throw new Error('No response received from checkout service');
      }

      if (!data.clientSecret) {
        throw new Error('Invalid checkout response - missing client secret');
      }

      setClientSecret(data.clientSecret);
      
    } catch (error: any) {
      
      let userMessage = 'Failed to start checkout process';
      
      if (error?.message?.includes('logged in')) {
        userMessage = error.message;
      } else if (error?.message?.includes('session expired')) {
        userMessage = error.message;
      } else if (error?.message?.includes('client secret')) {
        userMessage = 'Checkout configuration error. Please try again or contact support.';
      } else if (error?.message) {
        userMessage = `Checkout failed: ${error.message}`;
      }
      
      toast.error(userMessage);
      setIsProcessing(false);
    }
  };

  const handlePaymentComplete = () => {
    setClientSecret(null);
    setIsProcessing(false);
    onClose();
  };

  const handleClose = () => {
    setClientSecret(null);
    setIsProcessing(false);
    onClose();
    // Refresh subscription status when modal closes
    checkSubscription();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={clientSecret ? "max-w-2xl w-full h-[80vh] p-0 overflow-hidden" : "max-w-md"}>
        <DialogHeader className={clientSecret ? "sr-only" : ""}>
          <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Upgrade to Premium
          </DialogTitle>
        </DialogHeader>
        
          {clientSecret ? (
            <div className="w-full h-full flex flex-col">
              <StripeCheckout 
                clientSecret={clientSecret} 
                onComplete={handlePaymentComplete}
              />
            </div>
          ) : (
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
                {isIOSNative ? (
                  <>
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
                  {!appleProductAvailable && (
                    <p className="text-sm text-red-500 text-center">Subscription is temporarily unavailable. Please try again later.</p>
                  )}
                  </>
                ) : (
                  <Button 
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2" />
                        Loading checkout...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Upgrade Now
                      </>
                    )}
                  </Button>
                )}
                
                <Button 
                  onClick={handleClose}
                  variant="outline" 
                  className="w-full"
                >
                  Maybe Later
                </Button>
              </div>

              <div className="text-center text-xs text-gray-500 space-y-1">
                {isIOSNative ? (
                  <>
                    <p>Subscription auto-renews monthly at {applePrice} until cancelled.</p>
                    <p>Payment will be charged to your Apple ID account at confirmation of purchase.</p>
                    <p>Manage or cancel anytime in Settings → Apple ID → Subscriptions.</p>
                    <p className="mt-1">
                      <a href="https://stockmatcherai.com/support" className="underline">Privacy Policy</a>
                      {' · '}
                      <a href="https://stockmatcherai.com/terms" className="underline">Terms of Service</a>
                    </p>
                  </>
                ) : (
                  <p>Secure payment processed by Stripe</p>
                )}
              </div>
            </div>
          )}
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;