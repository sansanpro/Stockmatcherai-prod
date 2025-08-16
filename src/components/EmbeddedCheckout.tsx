import React, { useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout as StripeEmbeddedCheckout
} from '@stripe/react-stripe-js';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { toast } from 'sonner';

const stripePromise = loadStripe('pk_test_51QWQmbP8fWHxbLTpXgcT9fRAcRO6Xrwpj7dIc0j2UaKnwqr1DbgP5gG9bWJWm65hWO6XSLdtYWaAZKJTHpEAi8pj0004R8VEfI');

interface EmbeddedCheckoutProps {
  clientSecret: string;
  onComplete: () => void;
}

const EmbeddedCheckout = ({ clientSecret, onComplete }: EmbeddedCheckoutProps) => {
  const { checkSubscription } = useSubscription();

  const handleComplete = useCallback(async () => {
    console.log('Payment completed');
    toast.success('Payment successful! Welcome to Premium!');
    
    // Wait a moment for Stripe to process
    setTimeout(async () => {
      await checkSubscription();
      onComplete();
    }, 2000);
  }, [checkSubscription, onComplete]);

  const options = {
    clientSecret,
    onComplete: handleComplete,
  };

  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
        <StripeEmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
};

export default EmbeddedCheckout;