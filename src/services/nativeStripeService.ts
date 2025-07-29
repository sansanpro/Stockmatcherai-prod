import { Capacitor, registerPlugin } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

export interface StripePaymentPlugin {
  presentPaymentSheet(options: {
    paymentIntentClientSecret: string;
    customerId: string;
    customerEphemeralKeySecret: string;
  }): Promise<{ status: 'completed' | 'canceled' }>;
}

const StripePayment = registerPlugin<StripePaymentPlugin>('StripePayment');

interface PaymentIntentResponse {
  paymentIntentClientSecret: string;
  customerId: string;
  customerEphemeralKeySecret: string;
  publishableKey: string;
}

interface PaymentResult {
  status: 'completed' | 'canceled';
}

class NativeStripeService {
  private isNative = Capacitor.isNativePlatform();

  async createPaymentIntent(): Promise<PaymentIntentResponse> {
    const { data, error } = await supabase.functions.invoke('create-payment-intent');
    
    if (error) {
      throw new Error(error.message || 'Failed to create payment intent');
    }
    
    return data;
  }

  async presentPaymentSheet(paymentData: PaymentIntentResponse): Promise<PaymentResult> {
    if (!this.isNative) {
      throw new Error('Native payment sheet only available on iOS');
    }

    try {
      const result = await StripePayment.presentPaymentSheet({
        paymentIntentClientSecret: paymentData.paymentIntentClientSecret,
        customerId: paymentData.customerId,
        customerEphemeralKeySecret: paymentData.customerEphemeralKeySecret
      });

      return result;
    } catch (error) {
      console.error('Payment sheet error:', error);
      throw error;
    }
  }

  isNativePlatform(): boolean {
    return this.isNative;
  }
}

export const nativeStripeService = new NativeStripeService();