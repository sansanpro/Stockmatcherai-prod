import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface CheckoutFormProps {
  clientSecret: string;
  subscriptionId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const CheckoutForm = ({ clientSecret, subscriptionId, onSuccess, onCancel }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin, // This won't be used since we handle success manually
        },
        redirect: 'if_required'
      });

      if (confirmError) {
        setError(confirmError.message || 'Payment failed');
        toast.error(confirmError.message || 'Payment failed');
      } else {
        toast.success('Payment successful! Welcome to Premium!');
        onSuccess();
      }
    } catch (err) {
      setError('An unexpected error occurred');
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold">Premium Subscription</span>
          <span className="text-lg font-bold text-blue-600">$9.99/month</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Enter your payment details below to complete your upgrade to Premium.
        </div>
        
        <PaymentElement 
          options={{
            layout: 'tabs'
          }}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          className="flex-1"
          disabled={loading}
        >
          Cancel
        </Button>
        
        <Button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {loading ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Pay $9.99
            </>
          )}
        </Button>
      </div>

      <div className="text-center text-xs text-gray-500">
        Your payment is secured by Stripe. Cancel anytime.
      </div>
    </form>
  );
};

export default CheckoutForm;