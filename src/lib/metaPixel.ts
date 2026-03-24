import { Capacitor } from '@capacitor/core';

const isDev = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

function log(event: string, params?: object) {
  if (isDev) console.log('[Meta Pixel]', event, params ?? '');
}

function canTrack(): boolean {
  const attStatus = localStorage.getItem('att_status');
  if (!Capacitor.isNativePlatform()) return true;
  return attStatus === 'authorized';
}

function track(eventName: string, params?: object) {
  if (!canTrack()) return;
  if (typeof window.fbq !== 'function') return;
  window.fbq('track', eventName, params);
  log(eventName, params);
}

function trackCustom(eventName: string, params?: object) {
  if (!canTrack()) return;
  if (typeof window.fbq !== 'function') return;
  window.fbq('trackCustom', eventName, params);
  log(eventName, params);
}

export function trackRegistration(method: 'email' | 'apple' | 'google') {
  track('CompleteRegistration', {
    content_name: 'StockMatcherAI Signup',
    registration_method: method,
  });
}

export function trackFirstSwipe(ticker: string, direction: 'left' | 'right') {
  const key = 'pixel_first_swipe_fired';
  if (localStorage.getItem(key)) return;
  track('ViewContent', {
    content_type: 'stock_swipe',
    content_ids: [ticker],
    content_name: 'First Stock Swipe',
    swipe_direction: direction,
  });
  localStorage.setItem(key, '1');
}

export function trackWatchlistAdd(ticker: string, stockName: string) {
  track('AddToWishlist', {
    content_type: 'stock',
    content_ids: [ticker],
    content_name: stockName,
  });
}

export function trackPaywallReached(trigger: 'swipe_limit' | 'ai_analysis' | 'export') {
  const key = 'pixel_paywall_session_' + new Date().toDateString();
  if (localStorage.getItem(key)) return;
  track('InitiateCheckout', {
    content_type: 'subscription',
    num_items: 1,
    currency: 'USD',
    paywall_trigger: trigger,
  });
  localStorage.setItem(key, '1');
}

export function trackSubscriptionPurchase(
  plan: 'pro_monthly' | 'pro_annual',
  value: number
) {
  if (!isProduction) {
    log('Purchase (skipped — not production)', { plan, value });
    return;
  }
  track('Purchase', {
    value,
    currency: 'USD',
    content_type: 'subscription',
    content_ids: [plan],
    plan_type: plan === 'pro_annual' ? 'annual' : 'monthly',
  });
}

export function trackAIAnalysisViewed(ticker: string, userTier: 'free' | 'paid') {
  trackCustom('AIAnalysisViewed', {
    content_id: ticker,
    user_tier: userTier,
  });
}

export function trackDeepSwipeSession(swipeCount: number) {
  const key = 'pixel_deep_session_' + new Date().toDateString();
  if (localStorage.getItem(key)) return;
  if (swipeCount < 10) return;
  trackCustom('DeepSwipeSession', {
    swipes_in_session: swipeCount,
  });
  localStorage.setItem(key, '1');
}
