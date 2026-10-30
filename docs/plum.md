# Plum and coral, light and dark (2026-10-30)

From the owner's two mockups (light and dark swipe card) and palette notes:
- a plum card header with a coral glow;
- coral as the one brand color (Like, Ask AI, the selected tab);
- warm white with a peach glow, and light-peach tiles;
- warm plum-black in dark mode, with a lighter coral;
- green only for gains.

## What changed

- **Colors:** `scripts/build-plum-tokens.mjs` writes `src/styles/tokens.css` with light values, and dark values under `prefers-color-scheme: dark`.
  - Before writing, it checks 100 text pairings per mode against WCAG AA (4.5:1). Lowest results: light 4.78, dark 6.18.
  - The previous palette can be restored with `scripts/build-cream-tokens.mjs`.
- **Dark mode:** follows the iPhone's Appearance setting.
  - `UIUserInterfaceStyle` was removed from `Info.plist`.
  - The fixed Capacitor background color was removed.
  - `index.html` declares `color-scheme: light dark` and has a `theme-color` for each mode.
  - About 40 hard-coded whites and browns moved onto tokens. Text on coral buttons uses `primary-foreground`, which is white in light mode and plum in dark.
- **Card layout:**
  - **Header:** plum header showing the share price and a past-year pill (green ↑ for a gain; a fall is shown plainly, never in red).
  - **Values match:** chips use cause line icons, and the top cause's symbol sits faint in the corner.
  - **Proof and To know:** light-peach tiles with round icons. The full view still says "Things to know".
  - **The numbers:** the card face no longer repeats the price.
- **Deck:**
  - Pass, a coral-gradient Like, and an Ask AI pill that fills in a question about the card's company. Nothing is sent until the user sends it.
  - The floating Ask AI button steps aside while cards are showing, and stays on Likes and the end-of-deck screen.
  - The cause chips share one row, so Proof and To know fit on an iPhone 15.
- **Unchanged:** the swipe itself (`TinderStockCard` touch and mouse code), the disclaimers, and the swipe hint.

## Checks

- **Sweep:** `e2e/redteam.spec.ts` in light and dark (`REDTEAM_SCHEME=dark`). 15 screens each, 0 contrast failures and 0 serious axe findings in both modes.
  - Results: `docs/plum/sweep-light.json` and `sweep-dark.json`. Screens: `docs/plum/light/` and `docs/plum/dark/`.
- **New guards:** `e2e/plum.spec.ts` checks:
  - the header price and pill;
  - that green means a gain only;
  - that Proof and To know are fully on screen at the app's iPhone 15 size (393 × 759);
  - that the Ask AI pill fills in the question without sending;
  - that the floating button is hidden on the deck;
  - that dark mode follows the system.
- **Mockup comparison:** `docs/plum/deck-light-390x844.png` and `deck-dark-390x844.png`, at the mockups' size.
- **iOS Simulator (iPhone 16):** Light and Dark appearance. The status bar follows the mode, with no light flash when launching in dark mode.

## Known

- **Light-mode coral buttons** ("Find my matches", Save) use the deeper coral (#B8441F), because white text on the bright coral (#E8643C) is 3.3:1, below AA. The bright coral is used for the Like button's gradient, where the white heart only needs 3:1.
- **Likes and the details sheet** keep their cause-tinted headers: pale in light mode, deep in dark. The mockups showed only the swipe card.
