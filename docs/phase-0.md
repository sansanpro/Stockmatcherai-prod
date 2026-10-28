# Phase 0: audit, signals, color, Premium and support, motion, 3D

For the plan in `docs/brief.md`. Nothing here changes the app. Decisions from 2026-10-28: keep committing to main, dark mode is not a priority, the palette should feel positive and vibrant (not cream), Premium needs more value on the matching side, and support is an optional $1.99 tip to StockMatcherAI.

**What a top studio would add, in four lines.** It would start from real sessions (recordings and event funnels of first-time users), not from screens. It would work from device traces and the five-screen screenshot set below, using Playwright, Safari Web Inspector, a contrast and color-blindness script, and a production bundle report. It would add a 5-person hallway test with nervous first-time investors. And it would prove the result with outside checks: those scripts, frame-time traces, and whether testers can say in their own words what Premium adds and what "Big swings" means.

## 1. Current app audit

Measured on 2026-10-27/28 with Playwright (WebKit, iPhone 15), a contrast script and a production build.

What works against "calm and curious":

- **Counterpoints are less visible than proof.** On the swipe card the green Proof box is above the fold, while "Things to know" is cut off below it. Likes shows no counterpoints at all.
- **Stock-ticker cues.** Returns show red "▼" badges and green/red bars, Likes shows a green "+40.0%", and the Details "Returns" tab (5D, MTD) feels like a trading screen.
- **The disclaimer is missing** on Likes, Settings, Details, the paywall and sign-in.
- **Flat, pale color.** White cards on pale tints, with one accent color. Cards in different causes look alike apart from a light header tint. Pale tints can't be told apart under color blindness (see section 3).
- **Onboarding.** With 7 causes, the last two sit below the fold.
- **Motion** is a set of one-off CSS animations with at least 6 different easing curves. The swipe exit is a fixed 0.4 s transition that ignores gesture speed and can't be interrupted. Reduced motion covers only the onboarding art and recap pops.
- **Type** uses 44 fixed pixel sizes (down to 9 to 11 px), so it ignores iOS Dynamic Type.
- **Contrast** (light mode): 6 uses fail WCAG AA (4.5:1): the light orange `clay` text (3.4:1), `ink-muted` placeholders and the "?" icon (3.6 to 3.9:1), white at 80% on orange (4.0:1), and the toast close button (3.3:1).
- **Bundle:** one JavaScript file, 1,193 KB, **350.8 KB compressed**, plus 15.8 KB of CSS. There's no code splitting. This is the baseline for the "under 150 KB growth" goal.
- **Not measured:** frame rate and touch latency. No device is available for now (decision 4), so Phase 2 will use simulator and WebKit traces and label them as such.

What already meets the brief: the paywall is honest (clear close button and "Maybe Later", real perks only, opens at the end of the deck, after free questions run out, or from Settings, never mid-swipe). The daily allowance is always visible ("11 of 12 matches left today", "x of 5 questions left"), and every claim on a card is sourced.

## 2. Signals to watch

The events already exist in `analytics_events`. Test runs are tagged (`anonymous_id` starts with `e2e-`) and excluded. Real usage today is about 2 people, so there's no baseline yet. These are set up to read as soon as real users arrive.

| Signal | How it's measured with what exists | Gap to close (UI layer only) |
|---|---|---|
| Time to first swipe | Per `session_id`: first `app_open` to first `swipe` | none (measure within a session, not across days) |
| Deck completion | `deck_finished` / people with `deck_loaded`, per day | none |
| Recap viewed to the end | `recap_shown` / `deck_finished` | add `recap_completed` (last slide reached) |
| Free to Premium | `paywall_shown` to new `subscribers` rows | add `purchase_started` / `purchase_completed` events |
| Support opt-in | none yet | add `tip_shown` / `tip_completed` |

## 3. Color discovery

**Brief.** Feel: calm, trust, curiosity, honesty, hope, and per the owner, *positive and vibrant*. Seven causes: cancer and disease, health, clean energy, safety, mental health, food and farming, clean water. Audience: people in their 20s and 30s, new to investing. Avoid: casino and trading-floor energy, money-green, red/green ticker cues, hype.

**Category audit.** I screenshotted 13 sites at phone size for analysis only; the screenshots aren't committed, since they're other brands' pages.

- **Trading:** black with neon (Robinhood's lime, next to a crypto sweepstakes).
- **Saving:** money-green (Acorns), or trust-blue with yellow (Betterment).
- **Editorial investing:** black and white serif (Public).
- **"Calm finance":** warm beige, close to what we ship today (Wealthsimple).
- **Wellbeing:** deep blue with nature photos (Calm), or round orange and blue (Headspace).
- **Learning:** one saturated green (Duolingo), navy and teal (Khan Academy).
- **Climate:** forest green (Ecosia).

**The gap:** no investing app owns a joyful, many-color system where color means *a cause*, not *money*.

**Three directions.** Tokens are in OKLCH in [`phase0/palettes.json`](phase0/palettes.json). The generated hex values are in [`phase0/tokens.json`](phase0/tokens.json), and the swatches are in [`phase0/swatches.png`](phase0/swatches.png).

- **A. Daybreak (violet sky, coral sun):** hope at the start of something. A dawn palette no investing app uses, far from money-green and trading black.
- **B. Lagoon (teal water, mango light):** calm and alive. The colors of healthy water and growing things, so causes feel like a living world, not a ticker.
- **C. Spark (electric blue, sunshine pop):** confident energy, playful like a learning game. It's the closest of the three to standard fintech blue.

**Instruments.** `node scripts/palette-check.mjs` checks 68 text pairings for WCAG AA. It also simulates protanopia, deuteranopia and tritanopia (Machado 2009, full severity), then reports the smallest OKLab ΔE between colors that must stay distinct: clear ≥ 0.10, fair 0.05 to 0.10, poor < 0.05. The cause and meaning colors were tuned by search (hue within 18° of the intended one, any lightness) to maximize that worst case. Full tables are in [`phase0/palette-report.md`](phase0/palette-report.md).

| | Current | A. Daybreak | B. Lagoon | C. Spark |
|---|---|---|---|---|
| Text pairings passing AA | 64/67 (lowest 3.24) | **68/68** (4.64) | **68/68** (4.62) | **68/68** (4.63) |
| Proof vs things to know vs Big swings, worst color-blind ΔE (text) | 0.027 poor | **0.145 clear** | **0.147 clear** | 0.132 clear |
| 7 causes, worst color-blind ΔE (chip text) | 0.008 poor | 0.077 fair | **0.084 fair** | 0.080 fair |
| Pale tints (card headers, boxes) | poor | poor | poor | poor |

Seven hues can't all be told apart by every type of color blindness, so the cause icon and label stay the main identifier. Pale tints are near-identical by nature in every direction, which is why Phase 1 should use stronger cause colors for headers and keep risk boxes distinct by icon, title and border, not tint alone.

**The same 5 screens in each direction** (real app, palette swapped into a throwaway copy by `scripts/apply-palette.mjs`, captured by `e2e/palette-screens.spec.ts`):

| Onboarding | Card | Big swings | Recap | Paywall |
|---|---|---|---|---|
| [compare](phase0/screens/compare-1-onboarding.png) | [compare](phase0/screens/compare-2-card.png) | [compare](phase0/screens/compare-3-caution.png) | [compare](phase0/screens/compare-4-recap.png) | [compare](phase0/screens/compare-5-paywall.png) |

This swap only recolors today's pale layout, so it *understates* vibrancy. The highlight colors (coral, mango, sunshine) have no place in today's layout yet. Phase 1 would give each cause a bold color band, use the highlight for celebration moments (reveal, like, recap), and keep risk boxes as prominent as proof.

**Recommendation: A. Daybreak.** It ties for the best contrast (68/68), keeps proof, counterpoints and cautions clearly apart for color-blind users (0.145), and is the farthest from category clichés: no money-green, no bank-blue, no neon on black. Violet with coral reads optimistic and young without hype. Lagoon is a close second with slightly better cause separation (0.084 vs 0.077), but teal is common in health apps and could make this read as a health app. Spark tests fine but sits closest to generic fintech blue. **You decide.**

## 4. Premium and support

**Premium: more learning and more exploration, never better picks.** Unlimited Ask AI already works (`PLAN_LIMITS.premium` has no question cap). For matching, all of these use data we already have. Server changes would come in Phase 3, with your approval.

1. **No daily cap.** Every company for your causes. Today a cause has 16 to 30 companies, so the honest copy is "every match for your causes, no daily limit," not "unlimited companies." Needs: the server's deck size for Premium, `PLAN_LIMITS`, README and paywall copy.
2. **Shape your deck.** Premium filters on existing fields: core business only (`exposure = core`), company size, how much the price swings (`risk_level`), pays a dividend, and hide a sector.
3. **Explore a cause.** Browse every company in a cause as a library, beyond the daily deck.
4. **Side by side.** Compare two liked companies: story, proof, things to know and cautions.
5. **Keep up.** Alerts when a liked company gets news or a new "Big swings" caution (`price_moves` already records them).
6. **AI tutor mode.** Ask AI explains any card step by step for beginners (prompting only, no new data).

Paywall copy direction: "Go deeper on the causes you care about." The perks are those above. No scarcity, timers or guilt, and a clear "Maybe later" stays.

**Support ($1.99 tip): Apple's rules** ([App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/), read 2026-10-28):

- 3.1.1: "Apps may use in-app purchase currencies to enable customers to 'tip' the developer." Money to StockMatcherAI itself is a **tip, so it must use In-App Purchase** (a consumable product). Apple keeps its usual 15 to 30%.
- 3.2.1(vi) and 3.2.2(iv): charitable fundraising inside an app is only for Apple-approved nonprofits; others must collect "outside of the app, such as via Safari or SMS." So the copy must never suggest the money goes to a charity or to the causes, and shouldn't call it a tax-deductible "donation."

**Draft copy** (UI only; payment code waits for your approval and a consumable product in App Store Connect):

> **Help keep StockMatcherAI going**
> StockMatcherAI is a small, independent app. A $1.99 tip helps pay for the research, data and servers that let us keep finding companies working on causes like yours. It goes to StockMatcherAI, not to a charity, and it doesn't unlock anything. Thank you for being here.
> [Tip $1.99]  [Not now]
>
> *Thank you:* "Thank you. You're helping more people find companies working on the causes they care about."

**Where it shows up:** a "Support StockMatcherAI" row in Profile, always available. One gentle card on the recap's last slide, at most once a week, never before the deck is finished, and gone for good after "Not now" twice. It never gates anything and gives no perks.

## 5. Motion storyboard

Shared values: `spring.snappy` (stiffness 520, damping 38), `spring.gentle` (stiffness 260, damping 30), `ease.out` = cubic-bezier(0.22, 1, 0.36, 1), durations 120 / 240 / 400 ms. Every moment has a reduced-motion version: the same change, a 150 ms cross-fade, no movement.

| Moment | Motion | Haptic | Reduced motion |
|---|---|---|---|
| Onboarding question | Art rises 12 px with `spring.gentle`, answers stagger 40 ms, 240 ms `ease.out` | none | fade only |
| Card appears | Next card scales 0.96 to 1 with `spring.gentle` as the top card leaves | none | instant swap |
| Swipe | Follows the finger 1:1, tilt is x × 0.06°. Release past 35% width or faster than 0.5 px/ms exits with the release speed on `spring.snappy`; otherwise springs back. A new touch grabs a card mid-flight. | light on release | buttons slide the card 40 px and fade |
| Like | Heart pops 1 to 1.15 to 1 in 240 ms, highlight-color ring | medium | color change only |
| Recap | Slides cross 400 ms `ease.out`, logos `spring.gentle`, tint fades 400 ms | light per slide | fade, no scale |
| Upgrade sheet | Rises with `spring.gentle`; never opens during a drag | none | fade |
| Tip thank-you | A soft highlight-colored bloom behind the heart, 600 ms, plays once | success | static thank-you |

Implementation plan: a tiny spring (about 1 KB, using requestAnimationFrame) for the swipe, so the card can be grabbed mid-flight, and CSS for everything else. No animation library unless measurement shows a need.

## 6. 3D: concept, two alternatives, prototype plan

**Concept: "cause emblems."** One 3D emblem per cause (drop, sun, ribbon, heart, shield, leaf, brain) that floats on onboarding and the recap. On the recap, your liked companies orbit the emblem for your top cause.

| Option | Tech | Expected cost | Risk |
|---|---|---|---|
| 1. Real-time 3D | three.js through react-three-fiber, one instanced scene, a texture atlas for logos, rendering paused off-screen | about 150 to 200 KB compressed, loaded only on those screens | battery and frame rate on older iPhones |
| 2. Rive | vector state machines, interactive | runtime about 70 to 150 KB plus small files | 2.5D, less "real" depth |
| 3. Today's approach, baseline | Fluent 3D emoji images with CSS 3D motion | 0 KB of code (about 40 KB per image) | not interactive |

**Prototype plan:** build the recap orbit in options 1 and 2 on a hidden route. Measure the chunk size from the build report, frame times over 10 seconds (Performance API: p50, p95, dropped frames) in WebKit and the iOS Simulator, and time to first frame. An option ships only if it keeps p95 under 16.7 ms (60 fps), adds nothing to the first download, and beats the baseline in a side-by-side preference check. Otherwise we keep option 3. Device numbers wait until a phone is available.

## 7. Server, copy and README items to approve before Phase 3

- **Premium daily cap:** remove it (`PLAN_LIMITS.premium`, the server's `PREMIUM_DECK_SIZE`, README, paywall and test copy).
- **Premium filters, cause library and compare:** read-only queries on existing tables.
- **The $1.99 tip:** a consumable In-App Purchase product you create in App Store Connect. Payment code only with your approval.

## Next

Approve a palette direction (or ask for changes), the Premium value list, and the support copy and placement. Then Phase 1: tokens, type and the card prominence fixes.
