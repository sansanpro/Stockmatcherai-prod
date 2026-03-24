

# Enhance Action Buttons and Filter Bar in StockMatcher

## Changes

### 1. Action button micro-animations (`src/components/StockMatcher.tsx`, lines 413-437)
- Add `active:scale-90` to X, undo, and heart buttons for tactile press feedback
- Add a pulsing ring glow to X (`ring-2 ring-red-400 animate-pulse`) and heart (`ring-2 ring-green-400 animate-pulse`) buttons
- Below the button row, add a swipe hint: `← Swipe left to pass · Swipe right to like →` in `text-white/40 text-xs`, auto-hidden after 5 seconds via `useState`/`useEffect`

### 2. Swipe direction chevrons on card area (`src/components/StockMatcher.tsx`, lines 386-408)
- Add `ChevronLeft` and `ChevronRight` icons positioned absolute on left/right edges of the card stack container
- Style: `opacity-30 animate-bounce`, hidden after the user's first swipe (track via a `hasSwipedOnce` state set in `handleMatch`/`handlePass`)

### 3. Redesign filter bar as profile chip bar (`src/components/StockMatcher.tsx`, lines 377-379)
- Add `Avatar`/`AvatarFallback` with user initial (from auth context email) to the left
- Replace plain text with colored `Badge` chips:
  - Age (blue): `{userProfile.age}yo`
  - Risk (red/yellow/green by level): `{userProfile.riskTolerance} risk`
  - Sector (purple): `{userProfile.sectorPreference}`
  - Goal (green): `{userProfile.investmentGoal}`
- Chips are tappable — clicking any chip calls `onReset` to edit profile, with a `Tooltip` saying "Tap to edit"
- Layout: `flex flex-wrap items-center justify-center gap-2`

### 4. Faint arrow indicators on card edges (`src/components/TinderStockCard.tsx`)
- When idle (not dragging), render faint `ChevronLeft`/`ChevronRight` at card edges with `opacity-20`
- Hide during drag (already handled by existing drag state)

### Technical details
- Import `Avatar`, `AvatarFallback` from `@/components/ui/avatar`
- Import `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider` from `@/components/ui/tooltip`
- Import `ChevronLeft`, `ChevronRight` from `lucide-react`
- Import `useAuth` from `@/contexts/AuthContext` for user email initials
- New state: `showSwipeHint` (boolean, default true, set false after 5s timer), `hasSwipedOnce` (boolean, set true on first swipe)
- All animations use existing Tailwind utilities — no custom keyframes needed

