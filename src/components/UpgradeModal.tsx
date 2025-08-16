import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Crown, Check, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { Browser } from '@capacitor/browser';
import { supabase } from '@/integrations/supabase/client';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UpgradeModal = ({ isOpen, onClose }: UpgradeModalProps) => {
  const { checkSubscription } = useSubscription();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    setIsProcessing(true);
    console.log('Starting checkout session...');

    try {
      // Create checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (error) {
        console.error('Error creating checkout session:', error);
        throw error;
      }

      if (!data?.url) {
        throw new Error('No checkout URL received');
      }

      console.log('Opening checkout in browser:', data.url);
      
      // Open checkout in in-app browser
      await Browser.open({
        url: data.url,
        windowName: '_self',
        toolbarColor: '#000000',
        presentationStyle: 'popover'
      });

      // Close the modal since user is going to checkout
      onClose();
      
    } catch (error: any) {
      console.error('Checkout error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Checkout failed: ${errorMessage}`);
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = () => {
    toast.success('Payment successful! Welcome to Premium!');
    checkSubscription();
    onClose();
  };

  // No longer needed for redirect approach

  const handleClose = () => {
    onClose();
    // Refresh subscription status when modal closes
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
                  <span className="text-sm">Unlimited daily swipes</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-sm">Advanced filtering options</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-sm">Detailed analytics</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-sm">Portfolio tracking</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2" />
                    Opening checkout...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Upgrade Now
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

            <div className="text-center text-xs text-gray-500">
              Secure payment processed by Stripe
            </div>
          </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;