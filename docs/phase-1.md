# Phase 1: Daybreak tokens, type and the card fixes

Palette chosen 2026-10-28: **A. Daybreak (violet sky, coral sun)**. Light mode only. Dark mode is deprioritized by the owner.

## What changed

- **Tokens.** `docs/phase0/palettes.json` (OKLCH) → `node scripts/palette-check.mjs` (tests) → `node scripts/build-tokens.mjs` → `src/styles/tokens.css`: 100 tokens. Colors are stored as sRGB triplets because the iOS 15.0 web view doesn't support `oklch()`. Each OKLCH source is kept in a comment.
- **Names.** Tailwind names are base, surface, line, ink, highlight, plus families brand, positive, info, caution, premium, support and `cause.<id>`. Each family has the tones deep, ink, bright, vivid, soft, line and tint. Older names (cream, sand, clay) now point at Daybreak values, so every screen picked up the palette at once. The shadcn/ui variables point at the tokens too.
- **No hard-coded colors** remain in `src/` outside `tokens.css`.
- **Bolder color.** Card headers and recap slides use each cause's **vivid** tone. Onboarding and sign-in use a "daybreak" backdrop (violet glow plus a coral sun). Rule: on vivid fills, secondary text is `ink-soft`, never `ink-faint`. The coral highlight is for graphics only; white text on it fails at 2.65:1.
- **Equal prominence.** On the card face, Proof and Things to know sit **side by side in matching boxes**, both visible without scrolling, and a "Big swings" box sits above them when there's a caution. The full card and details view show all three with the same box design. The e2e test now asserts both are in view, on the same row and the same height.
- **No ticker colors.** Past moves are shown in neutral ink ("Up 47.2% past year" / "Down 2.7% past year"). Price bars are violet (up) and gray (down). The 52-week range bar is violet. The "Returns" tab is now "Price history".
- **The disclaimer** is now on every screen: Likes, Settings, Details, the paywall (with "Premium adds more learning and exploring. It doesn't pick stocks for you.") and sign-in, via a shared `values/Disclaimer.tsx`.
- **Type.** All 44 fixed pixel font sizes are now rem. They look identical today and are ready to follow iOS text size.

## Measurements against the hard goals

| Goal | Result |
|---|---|
| All text meets WCAG AA | **Palette:** 106/106 pairings pass (lowest 4.64:1). **Live screens:** 0 failures on onboarding, card, Big swings, recap and paywall (`e2e/contrast-audit.ts` measures every rendered text element against its real background; its own test, `e2e/contrast-audit.spec.ts`, proves it catches faint, tinted and translucent text). Light mode only. |
| Initial bundle growth under 150 KB compressed | **+1.0 KB** (JS 350.80 → 350.98 KB, CSS 15.84 → 16.65 KB) |
| Color-blind safety (from Phase 0) | proof vs things to know vs caution: clear (0.145); causes: fair (0.077), with icon and label always shown |
| 60 fps swipe, under 100 ms touch response | Not measured yet (Phase 2, motion) |
| Reduced motion for every animation | Unchanged (Phase 2) |
| Existing tests | 29 passed (`npx playwright test`), deck rules pass (`node scripts/test-feed.mjs`) |

Screens: [`phase1/screens/daybreak-5-screens.png`](phase1/screens/daybreak-5-screens.png) and [`phase1/screens/neutral-returns.png`](phase1/screens/neutral-returns.png). Per-screen contrast results are in `phase1/screens/*.contrast.json`.

## Still open

- **iOS text size.** The root doesn't follow iOS text size yet (`font: -apple-system-body`). Turning it on makes everything about 6% larger at the default setting, so it needs a layout pass at large sizes (Phase 5 accessibility).
- **Onboarding fold.** With 7 causes, the last two still sit below the fold on the causes screen.
- **Motion system, Premium/Ask AI/tip screens and 3D** are Phases 2 to 4.
