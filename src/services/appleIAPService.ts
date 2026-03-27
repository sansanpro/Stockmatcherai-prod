import { registerPlugin } from '@capacitor/core';

interface SubscriptionsPlugin {
  getProducts(options: { productIdentifiers: string[] }): Promise<{
    products: Array<{
      productIdentifier: string;
      displayName: string;
      description: string;
      price: number;
      priceLocale: string;
      displayPrice: string;
    }>;
  }>;
  purchaseProduct(options: { productIdentifier: string; appAccountToken?: string }): Promise<{
    transactionId: string;
    originalTransactionId: string;
    productIdentifier: string;
    expirationDate?: string;
    jwsRepresentation?: string;
  }>;
  getLatestTransaction(options: { productIdentifier: string }): Promise<{
    transactionId: string;
    originalTransactionId: string;
    productIdentifier: string;
    expirationDate?: string;
    jwsRepresentation?: string;
  } | null>;
  restorePurchases(): Promise<void>;
}

const Subscriptions = registerPlugin<SubscriptionsPlugin>('Subscriptions');

const PRODUCT_ID = 'com.hassanomar.stockmatcherai.premium.monthly';

export async function getAppleProducts() {
  try {
    const result = await Subscriptions.getProducts({
      productIdentifiers: [PRODUCT_ID],
    });
    return result.products;
  } catch (error) {
    console.error('Error fetching Apple products:', error);
    return [];
  }
}

export async function purchaseAppleSubscription(appAccountToken?: string) {
  const result = await Subscriptions.purchaseProduct({
    productIdentifier: PRODUCT_ID,
    appAccountToken,
  });
  return result;
}

export async function getCurrentAppleEntitlement() {
  try {
    const result = await Subscriptions.getLatestTransaction({
      productIdentifier: PRODUCT_ID,
    });
    return result;
  } catch (error) {
    console.error('Error checking Apple entitlement:', error);
    return null;
  }
}

export async function restoreApplePurchases() {
  await Subscriptions.restorePurchases();
}

export { PRODUCT_ID };
