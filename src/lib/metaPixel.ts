// Meta Pixel removed — no tracking on iOS
export function trackRegistration(_method: 'email' | 'apple' | 'google') {}
export function trackFirstSwipe(_ticker: string, _direction: 'left' | 'right') {}
export function trackWatchlistAdd(_ticker: string, _stockName: string) {}
export function trackPaywallReached(_trigger: 'swipe_limit' | 'ai_analysis' | 'export') {}
export function trackSubscriptionPurchase(_plan: 'pro_monthly' | 'pro_annual', _value: number) {}
export function trackAIAnalysisViewed(_ticker: string, _userTier: 'free' | 'paid') {}
export function trackDeepSwipeSession(_swipeCount: number) {}
