

# Fix Nested Button/Link and Touch Handler Issues Across the App

## Problem
Apple rejects the app because the "Get Started" button is unresponsive on iPad. There are two distinct anti-patterns causing tap issues on iPadOS WebViews:

1. **Nested interactive elements** in `src/pages/Index.tsx` — a `<Button>` inside a `<Link>` creates invalid `<a>` wrapping `<button>` HTML
2. **Dual touch handlers** in `src/pages/Landing.tsx` — buttons use both `onClick` and `onTouchEnd`, which can cause competing/cancelled events on iPadOS

## All Instances Found

| File | Line(s) | Issue |
|------|---------|-------|
| `src/pages/Index.tsx` | 245-249 | `<Link>` wrapping `<Button>` — nested interactive elements |
| `src/pages/Landing.tsx` | 46-54 | Hero CTA with redundant `onTouchEnd` handler |
| `src/pages/Landing.tsx` | 141-149 | Bottom CTA with redundant `onTouchEnd` handler |

No other instances of these patterns exist in the codebase. The `onTouchEnd` in `TinderStockCard.tsx` is a legitimate swipe gesture handler and should not be changed.

## Changes

### 1. Fix nested button/link in `src/pages/Index.tsx` (line 245-249)
Replace `<Link><Button>` with the `asChild` pattern — a single interactive element:
```tsx
<Button asChild className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105">
  <Link to="/auth">Get Started 🚀</Link>
</Button>
```

### 2. Remove `onTouchEnd` from Landing.tsx hero CTA (line 49)
Remove the `onTouchEnd` prop. Keep only `onClick={() => navigate("/waitlist")}`.

### 3. Remove `onTouchEnd` from Landing.tsx bottom CTA (line 144)
Same fix — remove the `onTouchEnd` prop, keep `onClick` only.

## After Implementation
1. Publish the updated app
2. Run `npx cap sync ios` and rebuild in Xcode
3. Update Support URL in App Store Connect to `https://stockmatcherai.com/support`
4. Resubmit with incremented build number

