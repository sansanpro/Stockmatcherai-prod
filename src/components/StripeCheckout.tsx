import React, { useEffect, useRef, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import './StripeCheckout.css';
import { trackSubscriptionPurchase } from '@/lib/metaPixel';

const stripePromise = loadStripe('pk_test_51QWQmbP8fWHxbLTpXgcT9fRAcRO6Xrwpj7dIc0j2UaKnwqr1DbgP5gG9bWJWm65hWO6XSLdtYWaAZKJTHpEAi8pj0004R8VEfI');

interface StripeCheckoutProps {
  clientSecret: string;
  onComplete: () => void;
}

const StripeCheckout = ({ clientSecret, onComplete }: StripeCheckoutProps) => {
  const checkoutRef = useRef<HTMLDivElement>(null);
  const checkoutInstanceRef = useRef<any>(null);
  const { checkSubscription } = useSubscription();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeCheckout = async () => {
      try {
        console.log('🔧 Initializing Stripe embedded checkout...');
        
        // Destroy any existing checkout instance
        if (checkoutInstanceRef.current) {
          console.log('🧹 Destroying previous checkout instance...');
          checkoutInstanceRef.current.destroy();
          checkoutInstanceRef.current = null;
        }
        
        const stripe = await stripePromise;
        if (!stripe || !checkoutRef.current) {
          console.error('❌ Stripe or checkout ref not available');
          setIsLoading(false);
          return;
        }

        console.log('✅ Stripe loaded, creating embedded checkout...');
        
        // Mount the embedded checkout
        const checkout = await stripe.initEmbeddedCheckout({
          clientSecret,
          onComplete: async () => {
            console.log('🎉 Payment completed successfully!');
            toast.success('Payment successful! Welcome to Premium!');
            
            try {
              console.log('🔄 Refreshing subscription status after payment...');
              // Refresh subscription status after successful payment
              await supabase.functions.invoke('check-subscription', {
                headers: {
                  Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
                }
              });
              console.log('✅ Subscription status refreshed');
            } catch (error) {
              console.error('⚠️ Failed to refresh subscription status:', error);
              // Don't show error to user as payment was successful
            }
            
            // Wait a moment for processing to complete
            setTimeout(() => {
              checkSubscription();
              onComplete();
            }, 1000);
          }
        });

        // Store the checkout instance for cleanup
        checkoutInstanceRef.current = checkout;

        console.log('📦 Mounting checkout to DOM...');
        checkout.mount(checkoutRef.current);
        setIsLoading(false);
        console.log('✅ Checkout mounted successfully');

      } catch (error) {
        console.error('❌ Error initializing checkout:', error);
        toast.error('Failed to load checkout. Please try again.');
        setIsLoading(false);
      }
    };

    initializeCheckout();
    
    // Cleanup function to destroy checkout instance when component unmounts
    return () => {
      if (checkoutInstanceRef.current) {
        console.log('🧹 Cleaning up checkout instance on unmount...');
        checkoutInstanceRef.current.destroy();
        checkoutInstanceRef.current = null;
      }
    };
  }, [clientSecret, checkSubscription, onComplete]);

  return (
    <div className="stripe-checkout-container h-full w-full relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full" />
            <span className="text-sm text-muted-foreground">Loading secure checkout...</span>
          </div>
        </div>
      )}
      <div 
        ref={checkoutRef} 
        className="stripe-checkout-frame h-full w-full"
        style={{
          minHeight: '600px',
          contain: 'layout style paint',
          willChange: 'transform',
          touchAction: 'pan-y pinch-zoom',
          WebkitOverflowScrolling: 'touch',
        }}
      />
    </div>
  );
};

export default StripeCheckout;