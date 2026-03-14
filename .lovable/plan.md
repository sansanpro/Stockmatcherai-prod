

# Replace "Liked" Full-Screen Overlay with Pill Toast + Increase Match Rate to 50-60%

## Changes

### 1. Lower match threshold to ~50% (`src/utils/stockCompatibility.ts`)
- Reduce `MATCH_THRESHOLD` from 65 to **50**
- Boost base scores across scoring dimensions to make it easier to reach 50%:
  - Non-matching sector: 5 → **8** points
  - Add minimum base scores in investment goal and age categories so no dimension scores zero
- This should yield roughly 50-60% of stocks triggering "Matched!"

### 2. Replace LikedOverlay with pill toast (`src/components/StockMatcher.tsx`)
- Remove `likedOverlayStock` state and the `<LikedOverlay>` render
- Remove `LikedOverlay` import
- In `handleMatch`, when stock is NOT a high-compatibility match, call:
  ```ts
  toast(`👍 ${currentStock.ticker} liked`, {
    description: `${currentStock.companyName} added to watchlist`,
    duration: 2000,
    position: 'top-center',
  });
  ```
- The Sonner `<Toaster>` is already rendered in `App.tsx`, so toasts will work immediately

### 3. Safe-area positioning for iOS (`src/components/ui/sonner.tsx`)
- Add `style={{ top: 'env(safe-area-inset-top, 0px)' }}` to the Sonner component and set `position="top-center"` to ensure the pill notification doesn't overlap the notch/Dynamic Island on iPhones and iPads

### 4. No changes needed
- `MatchOverlay.tsx` stays as-is (full-screen overlay for matches)
- `LikedOverlay.tsx` file can remain but won't be used

