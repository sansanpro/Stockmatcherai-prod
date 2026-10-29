# Phase 3: Premium screens, Ask AI and the optional tip (UI only)

Built on the Premium list and tip copy approved on 2026-10-28 (`docs/phase-0.md`, section 4). Phase 3 changed no server, matching, data or payment code. The Apple subscription code in `UpgradeModal.tsx` is untouched, apart from the layout around it.

## What changed

**The paywall** (`UpgradeModal.tsx`):
- It has a Premium accent header, with a title that matches why it opened: today's deck is done, the free questions are used, or you tapped Compare, tutor mode or Settings.
- It lists only perks that work today: 12 matches a day instead of 7, unlimited Ask AI instead of 5 questions a day, tutor mode, and Compare side by side.
- "Maybe later" is a full-size button, and the close button stays.
- There are no timers, scarcity or guilt. It still says: "Premium adds more learning and exploring. It doesn't pick stocks for you."

**Compare side by side** (Premium, `values/CompareSheet.tsx`):
- In Likes, "Compare" lets you pick two companies.
- One row per topic shows both companies: your causes, what it does, proof (with source), things to know, Big swings, how much the price moves, and the past year.
- Proof, things to know and cautions get equal space. There's no verdict or "winner", and the past-year row carries "Past moves don't tell you what happens next."
- Free users see the Compare button with a crown. Tapping it explains Premium.

**Ask AI** (`AIAssistantWidget.tsx`):
- The educational disclaimer is now inside the chat.
- Running out of free questions is said *before* typing. The input is replaced by "You've used today's 5 free questions. Each one frees up 24 hours after you asked it", with a "See Premium" link. The suggestions are hidden then, too.
- **Tutor mode (Premium):** a "Step by step" toggle asks for short numbered steps with every term explained. This is prompting only, and you still see your own words in the chat.
- **"Ask AI about \<company\>"** in company details opens the chat with a question filled in. It isn't sent, so you stay in control of your free questions.
- The icon buttons have labels ("Start a new chat", "Close Ask AI").
- One starter question that leaned toward advice ("…before buying my first stock?") became "How do people research a company before investing?".

**The optional tip** (`support/SupportSheet.tsx`, `lib/support.ts`):
- The sheet uses the approved copy word for word. It says where the money goes (StockMatcherAI, not a charity), that it unlocks nothing, and that it's a one-time In-App Purchase. "Tip $1.99" and "Not now" are the same size, and neither is focused when the sheet opens.
- The thank-you plays a highlight bloom once, with a success haptic.
- **Profile:** a "Support StockMatcherAI" row that's always there.
- **Recap:** a gentle card on the last slide, below Share and Done, so it can only appear after the day's deck is finished. It shows at most once a week and stops for good after "Not now" twice.
- **Hidden for now:** all of this stays hidden (`TIP_PURCHASE_READY = false`) until the In-App Purchase is approved. To preview it, set `localStorage.support_preview = 1`.

**Analytics:** 7 new events (compare tapped and opened, tutor mode, prefilled question, tip shown, started and completed).

## Measurements against the hard goals

| Goal | Result |
|---|---|
| All text meets WCAG AA | **0 failures** on the live audit of 6 new screens (paywall, compare, Ask AI when out of questions, tip, thank-you, recap tip card) |
| Initial bundle growth under 150 KB compressed | **+3.8 KB** JS (352.27 → 356.08 KB), +0.3 KB CSS. Phases 1 to 3 together: +6.1 KB |
| Every animation has a reduced-motion fallback | yes: the new bloom is off under reduced motion; sheets use the shared fade |
| Every screen keeps its disclaimer | yes: paywall, compare, Ask AI and tip (tested) |
| Premium never implies better picks | tested: no "better picks / returns / investments" or "beat the market" anywhere on the paywall |
| Existing tests | **41 passed** (8 new in `e2e/premium.spec.ts`), deck rules pass |

The new tests cover:
- Only real perks, with no outcome claims.
- Picking two companies and seeing every row.
- Tutor mode sends a step-by-step request and shows your own words.
- Out of questions is shown before typing.
- "Ask AI about" fills in the question without sending it.
- The tip stays hidden by default.
- In preview, the tip copy is plain (no "donate" or "tax"), the buttons are equal, and the thank-you appears.
- The recap card's rules: weekly at most, and gone after two "Not now".

Screens: `docs/phase3/screens/` (paywall-compare, compare, ask-ai, ask-ai-out, tip, tip-thanks, recap-tip).

## Waiting on your approval

1. **Server changes for the rest of the Premium list:**
   - Every match for your causes, with no daily cap (`match-feed` deck size, `PLAN_LIMITS`, README).
   - Deck filters: core business only, company size, price swings, dividend, hide a sector.
   - A cause library to browse every company in a cause.
   - Alerts for news and new Big swings on liked companies, which also needs push notifications.

   Each perk joins the paywall only once it works.
2. **Tip payment:**
   - You create a consumable In-App Purchase in App Store Connect (for example "Tip", $1.99).
   - With your yes, I write the purchase call. It goes beside the existing subscription code, without changing it.
   - Then I set `TIP_PURCHASE_READY` to true.
