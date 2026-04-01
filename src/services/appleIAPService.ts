import { registerPlugin } from '@capacitor/core';

interface AppleProductDetailsResponse {
  responseCode: number;
  responseMessage: string;
  data?: {
    displayName: string;
    description: string;
    price: string;
  };
}

interface ApplePurchaseResponse {
  responseCode: number;
  responseMessage: string;
}

interface AppleLatestTransactionResponse {
  responseCode: number;
  responseMessage: string;
  data?: {
    transactionId: string | number;
    originalId?: string | number;
    productIdentifier: string;
    expiryDate?: string;
  };
}

interface AppleEntitlementsResponse {
  responseCode: number;
  responseMessage: string;
  data?: unknown;
}

interface AppleProduct {
  productIdentifier: string;
  displayName: string;
  description: string;
  displayPrice: string;
}

interface ApplePurchaseResult {
  transactionId: string;
  originalTransactionId: string;
  productIdentifier: string;
  expirationDate?: string;
  jwsRepresentation?: string;
}

interface SubscriptionsPlugin {
  getProductDetails(options: { productIdentifier: string }): Promise<AppleProductDetailsResponse>;
  purchaseProduct(options: { productIdentifier: string }): Promise<ApplePurchaseResponse>;
  getLatestTransaction(options: { productIdentifier: string }): Promise<AppleLatestTransactionResponse>;
  getCurrentEntitlements(): Promise<AppleEntitlementsResponse>;
}

const Subscriptions = registerPlugin<SubscriptionsPlugin>('Subscriptions');

const PRODUCT_ID = 'com.hassanomar.stockmatcherai.premium.monthly';

function createPurchaseError(responseCode?: number, responseMessage?: string) {
  const error: any = new Error(responseMessage || 'Purchase failed');
  error.code = responseCode === 3 ? 'USER_CANCELLED' : 'PURCHASE_ERROR';
  return error;
}

async function loadLatestTransaction(retries = 3): Promise<ApplePurchaseResult> {
  for (let attempt = 0; attempt < retries; attempt += 1) {
    const result = await Subscriptions.getLatestTransaction({
      productIdentifier: PRODUCT_ID,
    });

    if (result.responseCode === 0 && result.data) {
      return {
        transactionId: String(result.data.transactionId),
        originalTransactionId: String(result.data.originalId ?? result.data.transactionId),
        productIdentifier: result.data.productIdentifier,
        expirationDate: result.data.expiryDate,
      };
    }

    if (attempt < retries - 1) {
      await new Promise(resolve => setTimeout(resolve, 400));
    }
  }

  const error: any = new Error('Purchase completed, but transaction details could not be loaded.');
  error.code = 'TRANSACTION_LOOKUP_FAILED';
  throw error;
}

export async function getAppleProducts() {
  try {
    const result = await Subscriptions.getProductDetails({
      productIdentifier: PRODUCT_ID,
    });

    if (result.responseCode !== 0 || !result.data) {
      return [];
    }

    const product: AppleProduct = {
      productIdentifier: PRODUCT_ID,
      displayName: result.data.displayName,
      description: result.data.description,
      displayPrice: result.data.price,
    };

    return [product];
  } catch (error) {
    console.error('Error fetching Apple products:', error);
    return [];
  }
}

export async function purchaseAppleSubscription(appAccountToken?: string) {
  void appAccountToken;

  const result = await Subscriptions.purchaseProduct({
    productIdentifier: PRODUCT_ID,
  });
  
  // capacitor-subscriptions may resolve with an error object instead of rejecting
  if (result?.responseCode !== 0) {
    throw createPurchaseError(result?.responseCode, result?.responseMessage);
  }
  
  return loadLatestTransaction();
}

export async function getCurrentAppleEntitlement() {
  try {
    const result = await Subscriptions.getLatestTransaction({
      productIdentifier: PRODUCT_ID,
    });

    if (result.responseCode !== 0 || !result.data) {
      return null;
    }

    return {
      transactionId: String(result.data.transactionId),
      originalTransactionId: String(result.data.originalId ?? result.data.transactionId),
      productIdentifier: result.data.productIdentifier,
      expirationDate: result.data.expiryDate,
    };
  } catch (error) {
    console.error('Error checking Apple entitlement:', error);
    return null;
  }
}

export async function restoreApplePurchases() {
  const result = await Subscriptions.getCurrentEntitlements();

  if (result.responseCode !== 0 && result.responseCode !== 1) {
    const error: any = new Error(result.responseMessage || 'Unable to refresh Apple purchases');
    error.code = 'RESTORE_ERROR';
    throw error;
  }
}

export { PRODUCT_ID };
