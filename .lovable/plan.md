

# App Store Compliance Improvements

Based on the Apple Review Guidelines, here are the changes needed to maximize approval chances.

## What We're Building

Three in-app changes to address common rejection reasons: a Restore Purchases button, proper subscription legal text, and a financial disclaimer.

---

## 1. Add "Restore Purchases" Button (Guideline 3.1.1)

Apple requires a restore mechanism for restorable IAPs. Without it, reviewers will reject.

**Modify `src/components/Settings.tsx`**
- Add a "Restore Purchases" button in the Account section (visible only on iOS native)
- Calls `restoreApplePurchases()` from `appleIAPService.ts`, then refreshes subscription status
- Shows success/failure toast

---

## 2. Add Subscription Legal Text (Guideline 3.1.2(c))

The UpgradeModal must disclose auto-renewal terms near the purchase button, per Apple's requirements.

**Modify `src/components/UpgradeModal.tsx`**
- Add small legal text below the iOS purchase button:
  - "Subscription auto-renews monthly at [price] until cancelled."
  - "Payment will be charged to your Apple ID account."
  - "Manage or cancel anytime in Settings > Apple ID > Subscriptions."
- Keep existing "Payment managed by Apple" text but expand it

---

## 3. Add Financial Disclaimer to Main Screen (Guideline 3.2.1(viii))

The app deals with stocks/investing. A visible disclaimer on the swiping screen (not just FAQ) strengthens the "educational tool" positioning and avoids issues with the financial services guideline.

**Modify `src/components/StockMatcher.tsx`** (or equivalent main swiping component)
- Add a small, non-intrusive disclaimer footer: "For educational purposes only. Not financial advice."

---

## 4. Add Terms of Service to Support Page

**Modify `src/pages/Support.tsx`**
- Add a "Terms of Service" section below Privacy Policy covering: educational-only purpose, no trading execution, subscription terms, user responsibilities

---

## Files Summary

| Action | File |
|--------|------|
| Modify | `src/components/Settings.tsx` — Restore Purchases button |
| Modify | `src/components/UpgradeModal.tsx` — Subscription legal text |
| Modify | `src/components/StockMatcher.tsx` — Financial disclaimer |
| Modify | `src/pages/Support.tsx` — Terms of Service section |

## Additional Non-Code Actions (Manual)

- Set Privacy Policy URL to `https://stockmatcherai.lovable.app/support` in App Store Connect
- Provide a demo account in App Review notes
- Consider adding Sign in with Apple if you ever add social login providers

