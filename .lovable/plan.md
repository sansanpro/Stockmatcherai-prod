

# Fix Stock Matching - Lower Threshold and Stabilize Overlays

## Root Cause
The compatibility threshold of 75% is too strict. The scoring algorithm requires a stock to score well across all 6 dimensions (risk tolerance, sector, investment goals, age, affordability, and valuation), which is very difficult to achieve. As a result, every right-swipe falls below the threshold and only triggers "Liked!" instead of "Matched!".

There is also a secondary bug: the MatchOverlay's auto-dismiss timer resets on every parent re-render because the `onClose` callback is an inline function that changes reference each render.

## Changes

### 1. Lower the match threshold (src/utils/stockCompatibility.ts)
- Reduce `MATCH_THRESHOLD` from 75 to 65. This makes roughly 20-30% of stocks trigger "Matched!" instead of nearly 0%.
- Optionally, slightly boost base scores in categories where partial matches currently earn too few points (e.g., give 5 points in the sector category even when the sector doesn't match, instead of 0).

### 2. Fix MatchOverlay timer bug (src/components/MatchOverlay.tsx)
- Remove `onClose` from the useEffect dependency array and use a ref instead, so the auto-dismiss timer doesn't restart on every parent re-render.

### 3. Fix LikedOverlay timer bug (src/components/LikedOverlay.tsx)
- Apply the same ref-based fix to the LikedOverlay for consistency.

### 4. Add debug logging (src/components/StockMatcher.tsx)
- Log the compatibility score for each swiped stock so you can verify match/like decisions in the console.

## Expected Result
- Stocks that are a good (but not perfect) fit for the user will trigger the full-screen "It's a Match!" overlay with hearts, sparkles, and the compatibility score bar.
- Stocks that are a weaker fit will continue showing the "Liked!" overlay.
- Both overlays will reliably auto-dismiss without timer glitches.

