

# Resolve All Three Apple App Review Rejections

Three issues to fix: AI data privacy disclosure, In-App Purchase compliance, and account deletion.

---

## Issue 1: AI Data Sharing Disclosure (Guidelines 5.1.1 / 5.1.2)

The AI Assistant sends user profile data and chat messages to a third-party AI service without explicit disclosure or consent.

### Changes

**Create `src/components/AIDataConsentDialog.tsx`**
A dialog shown before the user's first AI message. Clearly states:
- What data is sent (investment profile, chat messages)
- Who receives it (Google Gemini via our server)
- Purpose (personalized stock education)
- Two buttons: "I Agree" / "Cancel"
- Consent stored in `localStorage` as `ai_data_consent`

**Modify `src/components/AIAssistantWidget.tsx`**
- Add state for consent dialog visibility
- Before sending any message in `handleSend`, check `localStorage.getItem('ai_data_consent')`
- If not consented, show the consent dialog instead of sending
- On consent granted, proceed with sending

**Modify `src/pages/Support.tsx`**
- Add a "Third-Party AI Services" section to the existing Privacy Policy
- Disclose: data shared (profile + messages), provider (Google Gemini), purpose, and that data is not used for third-party marketing

---

## Issue 2: In-App Purchase (Guideline 3.1.1)

Stripe is used for subscriptions on iOS, which Apple prohibits. Must use Apple IAP on iOS.

### Changes

**Create `src/services/appleIAPService.ts`**
- Uses `registerPlugin` pattern (same as ATT) to avoid build-time import issues
- Wraps StoreKit 2 via `capacitor-subscriptions` plugin:
  - `getProducts()` — fetch product details from App Store
  - `purchaseProduct()` — trigger native purchase sheet, returns JWS transaction
  - `getCurrentEntitlement()` — check if user has active subscription

**Create `supabase/functions/verify-apple-receipt/index.ts`**
- Receives JWS transaction token + user ID
- Decodes JWS payload (base64url) to extract product ID, expiration, transaction ID
- Verifies product ID matches expected value
- Upserts into `subscribers` table with `subscription_source: 'apple'`

**DB Migration: Add `subscription_source` column**
- `ALTER TABLE subscribers ADD COLUMN subscription_source text DEFAULT 'stripe'`
- No RLS changes needed (existing service_role policies handle writes)

**Modify `src/components/UpgradeModal.tsx`**
- Import `Capacitor` to detect platform
- On iOS native: show Apple price from IAP service, "Subscribe via App Store" button
- On web: keep existing Stripe flow unchanged
- On iOS purchase success: call `verify-apple-receipt` edge function, then refresh subscription

**Modify `src/contexts/SubscriptionContext.tsx`**
- In `checkSubscription`, after Stripe check, also query `subscribers` table for `subscription_source = 'apple'` with valid `subscription_end`
- If either source is active, set premium tier

**Add `capacitor-subscriptions` to `package.json`**

**Note:** You must create the subscription product `com.hassanomar.stockmatcherai.premium.monthly` ($9.99/month) in App Store Connect before testing.

---

## Issue 3: Account Deletion (Guideline 5.1.1(v))

No in-app account deletion exists. Apple requires a complete self-service flow.

### Changes

**Create `supabase/functions/delete-account/index.ts`**
- Authenticates user via JWT (service role for admin operations)
- Deletes from: `user_profiles`, `ai_chat_messages` (via conversation IDs), `ai_chat_conversations`, `user_matches`, `user_watchlists`, `user_feedback`, `recommendation_sessions`, `daily_swipe_limits`, `subscribers`, `profiles`
- Calls `supabase.auth.admin.deleteUser(userId)` to remove auth record
- Returns success

**Modify `src/components/Settings.tsx`**
- Add a "Danger Zone" card at the bottom with red "Delete Account" button
- Shows an AlertDialog requiring user to type "DELETE" to confirm
- On confirm: calls the `delete-account` edge function, signs out, navigates to landing

**Modify `src/contexts/AuthContext.tsx`**
- Add `deleteAccount` method to context
- Calls `supabase.functions.invoke('delete-account')`, then `signOut()`, clears localStorage

**Modify `src/pages/Support.tsx`**
- Update the FAQ "How do I delete my account?" answer to say "Go to Settings > Delete Account"

---

## Files Summary

| Action | File |
|--------|------|
| Create | `src/components/AIDataConsentDialog.tsx` |
| Create | `src/services/appleIAPService.ts` |
| Create | `supabase/functions/verify-apple-receipt/index.ts` |
| Create | `supabase/functions/delete-account/index.ts` |
| Migration | Add `subscription_source` column to `subscribers` |
| Modify | `src/components/AIAssistantWidget.tsx` |
| Modify | `src/components/UpgradeModal.tsx` |
| Modify | `src/components/Settings.tsx` |
| Modify | `src/contexts/AuthContext.tsx` |
| Modify | `src/contexts/SubscriptionContext.tsx` |
| Modify | `src/pages/Support.tsx` |
| Modify | `package.json` |

## After Implementation

1. Create subscription product in App Store Connect: `com.hassanomar.stockmatcherai.premium.monthly` at $9.99/month
2. `git pull && npm install && npx cap sync ios`
3. Test account deletion flow end-to-end
4. Test IAP with StoreKit sandbox in Xcode
5. Record screen capture of account deletion for App Review notes

