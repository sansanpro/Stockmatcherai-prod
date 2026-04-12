

# Fix App Store Review Rejections

Two code changes + manual App Store Connect steps.

---

## 1. Create Dedicated Terms of Use Page (Guideline 3.1.2(c))

**New file: `src/pages/Terms.tsx`**
- Extract the Terms of Service content from `Support.tsx` into a standalone page
- Clean layout with back button, same content as currently in Support page

**Modify: `src/App.tsx`**
- Add `/terms` route in both native and web route groups

**Modify: `src/components/UpgradeModal.tsx`** (if it has terms links)
- Point any terms links to `/terms`

---

## 2. Remove ATT Interaction-Based Code (Guideline 5.1.2(i))

Since you're removing "Name" from tracking in App Store Connect, the ATT prompt is no longer needed for compliance. However, keeping the existing ATT code is still good practice since Meta Pixel does use cookies/identifiers. No code changes needed here — the fix is purely in App Store Connect.

---

## Manual Steps (You Do These)

1. **App Store Connect > App Privacy**: Remove "Name" from data collected for tracking
2. **App Store Connect > App Information**: Set Terms of Use URL to `https://stockmatcherai.lovable.app/terms`
3. **Reply to reviewer**: Explain privacy labels have been corrected — "Name" is not used for tracking

---

## Files Summary

| Action | File |
|--------|------|
| **New** | `src/pages/Terms.tsx` |
| **Modify** | `src/App.tsx` — add `/terms` route |

