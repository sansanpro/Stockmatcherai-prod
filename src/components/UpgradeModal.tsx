import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Crown, Check, ArrowLeft, CreditCard } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from './CheckoutForm';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// You'll need to replace this with your actual publishable key
const stripePromise = loadStripe('pk_live_51QSXqXLjZxOQ5qnPBWKkzKI5I7w9fG3dBMbcnVzQLHxgHSA2SrOOJe1A5Lj7yLI5QQGBgI0gJdLvF4yGQ00aD0a0yA00');

const UpgradeModal = ({ isOpen, onClose }: UpgradeModalProps) => {
  const { upgradeToPremi, loading, checkSubscription } = useSubscription();
  const [paymentData, setPaymentData] = useState<{client_secret: string, subscription_id: string} | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const handleUpgrade = async () => {
    const data = await upgradeToPremi();
    if (data) {
      setPaymentData(data);
      setShowPaymentForm(true);
    }
  };

  const handleBack = () => {
    setShowPaymentForm(false);
    setPaymentData(null);
  };

  const handleClose = () => {
    setShowPaymentForm(false);
    setPaymentData(null);
    onClose();
    // Refresh subscription status when modal closes
    checkSubscription();
  };

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    setPaymentData(null);
    onClose();
    checkSubscription();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`${showPaymentForm ? 'max-w-lg' : 'max-w-md'}`}>
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {showPaymentForm ? 'Complete Your Payment' : 'Upgrade to Premium'}
          </DialogTitle>
        </DialogHeader>
        
        {!showPaymentForm ? (
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
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3"
              >
                {loading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2" />
                    Processing...
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
        ) : paymentData ? (
          <div className="p-4">
            <div className="mb-4">
              <Button 
                onClick={handleBack}
                variant="ghost"
                className="mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Plan Details
              </Button>
            </div>
            
            <Elements 
              stripe={stripePromise}
              options={{
                clientSecret: paymentData.client_secret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#2563eb',
                  }
                }
              }}
            >
              <CheckoutForm 
                clientSecret={paymentData.client_secret}
                subscriptionId={paymentData.subscription_id}
                onSuccess={handlePaymentSuccess}
                onCancel={handleBack}
              />
            </Elements>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;