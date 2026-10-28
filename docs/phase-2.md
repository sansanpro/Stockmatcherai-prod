# Phase 2: motion system

Built from the storyboard in `docs/phase-0.md` (section 5). Measured in Playwright only, as the owner decided (no real device yet).

## What changed

- **Shared motion values.** `src/lib/motion.ts` holds `spring.snappy` (stiffness 520, damping 38), `spring.gentle` (260, 30), `ease.out` = cubic-bezier(0.22, 1, 0.36, 1), and the durations 120, 240 and 400 ms. CSS has the same values as `--ease-out` and `--dur-fast|base|slow`, and Tailwind as `ease-out` and `duration-fast|base|slow`. The 6 one-off easing curves in `index.css` now use them. `spring.gentle` is nearly critically damped (damping ratio 0.93), so in CSS it is ease-out over 400 ms.
- **A tiny spring.** `animateSpring` is a damped spring stepped with `requestAnimationFrame`, about 1 KB. It returns a stop function, so a touch can grab whatever is moving. No animation library.
- **The swipe, rewritten** (`TinderStockCard.tsx`):
  - It uses pointer events and writes the transform straight to the card, so following the finger never re-renders React.
  - It follows the finger 1:1 and tilts 0.06° per pixel.
  - On release it exits if the card is past 35% of the width, or if the finger was moving faster than 0.5 px/ms (a flick). The exit carries the finger's speed on `spring.snappy`. Otherwise the card springs back.
  - A new touch grabs a card that is springing back. A press with no movement then lets it settle instead of opening it.
  - A mostly vertical touch scrolls the card's text instead of dragging it (`touch-action: pan-y`).
  - The swipe is recorded once the card is off screen, with no fixed 400 ms wait.
- **Buttons and the details modal** fly the card off the same way (`fling`). Before, the card just disappeared after 400 ms.
- **Like.** The heart pops 1 → 1.15 → 1 over 240 ms, and a coral ring spreads from the button.
- **The stack.** The card behind settles forward from 96% size with ease-out over 400 ms. New cards fade in at the back.
- **Drag labels.** "Like" (violet) and "Pass" (dark ink) fade in with the drag distance. They use palette tokens; the old version had hard-coded clay colors and a pulsing "MATCHED!".
- **Haptics.** All haptics now go through `src/lib/haptics.ts`: light for a pass and for each recap slide, medium for a like. The success haptic is ready for the tip thank-you in Phase 3.
- **Onboarding.** Answers now stagger 40 ms apart, as storyboarded (was 70 ms), and use the shared curve.
- **Reduced motion: every animation has a fallback.**
  - Each animation becomes a 150 ms fade. Its delay is kept, so content still arrives in order.
  - The floating art loops stop.
  - Like is a color change only.
  - Sheets and dialogs fade instead of sliding.
  - Transitions keep their color and opacity changes but drop movement.
  - The swipe doesn't tilt. A pass or like slides the card at most 40 px and fades it out.
  - Spring-backs become 150 ms eases.
  - The setting is read live, so changing it in iOS takes effect without a restart.
- **Leftover cream-era colors.** 9 brown or clay `rgba()` shadows and one peach gradient now use Daybreak tokens.
- **Fixed a web bug.** With a mouse, releasing a drag used to swipe the card and also open its details sheet, so the swipe never registered. The old code had a stale handler; pointer capture replaced it.

## Measurements against the hard goals

| Goal | Before | After |
|---|---|---|
| 60 frames per second while swiping, CPU slowed 4× (Chromium) | 99.8% of frames on time (95th percentile 16.7 ms, worst 33 ms) | **99.8%** of frames on time (95th percentile 16.8 ms, worst 33 ms) |
| Touch response under 100 ms (finger move → card on screen), CPU slowed 4× | median 16.7 ms, worst 18.9 ms (one frame late, waiting for React) | median **0.7 ms**, worst **1.4 ms** (same frame) |
| The same in WebKit, unthrottled | 85% on time; idle is 87% | 85% on time |
| Every animation has a reduced-motion fallback | partial (5 classes) | **yes** (tested) |
| Initial bundle growth under 150 KB compressed | | **+1.3 KB** JS (350.98 → 352.27 KB), +0.15 KB CSS |
| Existing tests | 29 passed | **33 passed** (4 new), deck rules pass |

How the numbers were taken: `e2e/motion-perf.spec.ts` (`PERF_OUT=… npx playwright test e2e/motion-perf.spec.ts --project=perf-throttled`) runs a spring-back, two drag passes and a flick, and records every frame and every finger-move-to-screen time. Raw results: `docs/phase2/perf-*.json`.

**What these numbers mean.** WebKit is the iPhone's engine, but it can't slow its CPU, and its frame timer jitters by itself: only 87% of frames land on time with nothing moving at all. So the frame-time verdict comes from Chromium with the CPU slowed 4×. There, the old and new swipes both hold 60 fps, and the gain is touch response: the card now moves in the same frame as the finger, instead of one frame later. Neither run is an iPhone 12, and 120 Hz ProMotion can't be measured without a device.

New tests (`e2e/motion.spec.ts`):
- A slow, short drag springs back, and a long drag and a flick both pass.
- The tilt is 0.06° per pixel, and a card can be grabbed mid-spring and held.
- A tap opens the card, and the pass button flies it off.
- Under reduced motion: no tilt, a pass moves the card at most 40 px, animations become a fade, and sheets don't slide.

Screens: [`phase2/screens/drag-like.png`](phase2/screens/drag-like.png), [`phase2/screens/drag-pass.png`](phase2/screens/drag-pass.png).

## Still open

- **A real iPhone.** Frame times and 120 Hz ProMotion on a real iPhone 12 or newer, when you're ready for device testing.
- **Haptics on a device.** They can't be felt in a browser. The calls go through the existing Capacitor plugin.
- **ESLint** crashes on this repo's config (`@typescript-eslint/no-unused-expressions`), on files I didn't touch too, so lint wasn't run. The type check passes, apart from an older error in Apple sign-in.
- **Phases 3 and 5 moments.** The upgrade sheet and the tip thank-you bloom get their motion in Phase 3. Dynamic Type and the onboarding fold are in Phase 5.
