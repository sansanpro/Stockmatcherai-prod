

# Implement Meta Pixel Event Tracking with iOS ATT

## Overview
Add Meta Pixel (fbq) tracking to the web app running inside the Capacitor WebView, gated behind Apple's App Tracking Transparency prompt on iOS.

## Files to Create

### 1. `src/lib/att.ts` — ATT permission handler
Exports `requestTrackingPermission()` and `getTrackingStatus()` using `@capacitor-community/app-tracking-transparency`. Returns `'authorized'` on web (non-native).

### 2. `src/lib/metaPixel.ts` — Pixel helper utility
All tracking functions with ATT gating (`canTrack()` checks `localStorage.att_status`):
- `trackRegistration(method)` → `CompleteRegistration`
- `trackFirstSwipe(ticker, direction)` → `ViewContent` (fires once via localStorage flag)
- `trackWatchlistAdd(ticker, name)` → `AddToWishlist`
- `trackPaywallReached(trigger)` → `InitiateCheckout` (once per day)
- `trackSubscriptionPurchase(plan, value)` → `Purchase` (production only)
- `trackAIAnalysisViewed(ticker, tier)` → custom `AIAnalysisViewed`
- `trackDeepSwipeSession(count)` → custom `DeepSwipeSession` (fires at 10+ swipes, once per day)

### 3. `src/types/fbq.d.ts` — TypeScript declaration
Declares `window.fbq` on the global `Window` interface.

## Files to Modify

### 4. `index.html` — Meta Pixel base code
Add the fbq snippet in `<head>` with pixel ID `1458046222663408`. Fires `PageView` on load.

### 5. `ios/App/App/Info.plist` — ATT usage description
Add `NSUserTrackingUsageDescription` key with the provided string.

### 6. `src/App.tsx` — ATT prompt on first interaction
- Import `requestTrackingPermission` from `@/lib/att`
- On mount (inside `useEffect`), listen for the first user interaction (`click`/`touchstart`), then call `requestTrackingPermission()` and store result in `localStorage.att_status`
- Only fires once (guard with localStorage check)

### 7. `src/pages/Auth.tsx` — Registration event
Call `trackRegistration('email')` after successful `signUp` (line ~44, after the `await signUp` call when no error).

### 8. `src/components/StockMatcher.tsx` — Swipe events
- In `handleMatch` (~line 100): call `trackFirstSwipe(ticker, 'right')` and `trackWatchlistAdd(ticker, companyName)`
- In `handlePass` (~line 166): call `trackFirstSwipe(ticker, 'left')`
- Track running swipe count in state; after each swipe call `trackDeepSwipeSession(count)`

### 9. `src/components/UpgradeModal.tsx` — Paywall event
Call `trackPaywallReached('swipe_limit')` in a `useEffect` that fires when `isOpen` becomes `true`.

### 10. `src/components/StripeCheckout.tsx` — Purchase event
In the `session.status === 'complete'` callback (~line 56), call `trackSubscriptionPurchase('pro_monthly', 9.99)`.

### 11. `package.json` — New dependency
Add `@capacitor-community/app-tracking-transparency` (user must run `npx cap sync ios` after).

## Post-implementation
User must:
1. Run `npx cap sync ios` to sync ATT plugin
2. Rebuild in Xcode with incremented build number
3. Verify in Meta Events Manager that test events appear

