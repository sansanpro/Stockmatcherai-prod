import React, { useEffect, useRef, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { toast } from 'sonner';

const stripePromise = loadStripe('pk_test_51QWQmbP8fWHxbLTpXgcT9fRAcRO6Xrwpj7dIc0j2UaKnwqr1DbgP5gG9bWJWm65hWO6XSLdtYWaAZKJTHpEAi8pj0004R8VEfI');

interface StripeCheckoutProps {
  clientSecret: string;
  onComplete: () => void;
}

const StripeCheckout = ({ clientSecret, onComplete }: StripeCheckoutProps) => {
  const checkoutRef = useRef<HTMLDivElement>(null);
  const { checkSubscription } = useSubscription();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeCheckout = async () => {
      try {
        const stripe = await stripePromise;
        if (!stripe || !checkoutRef.current) return;

        // Mount the embedded checkout
        const checkout = await stripe.initEmbeddedCheckout({
          clientSecret,
          onComplete: async () => {
            console.log('Payment completed');
            toast.success('Payment successful! Welcome to Premium!');
            
            // Wait a moment for Stripe to process
            setTimeout(async () => {
              await checkSubscription();
              onComplete();
            }, 2000);
          }
        });

        checkout.mount(checkoutRef.current);
        setIsLoading(false);

      } catch (error) {
        console.error('Error initializing checkout:', error);
        toast.error('Failed to load checkout');
        setIsLoading(false);
      }
    };

    initializeCheckout();
  }, [clientSecret, checkSubscription, onComplete]);

  return (
    <div className="stripe-checkout">
      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full" />
          <span className="ml-3 text-sm text-muted-foreground">Loading checkout...</span>
        </div>
      )}
      <div ref={checkoutRef} />
    </div>
  );
};

export default StripeCheckout;