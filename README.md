# StockMatcherAI

**Find companies working on the causes you care about, one swipe at a time.**

StockMatcherAI is an iPhone app for first-time investors who want their money to stand for something. You tell it what you care about, such as beating cancer, clean energy or mental health, and it shows you a short daily deck of real public companies working on those causes. Each card explains in plain English what the company does, shows proof that the work is real, and is honest about the risks. You swipe right on the ones you'd be proud to own and build a list you can learn from.

The app is educational. It doesn't sell stocks, take orders or tell anyone what to buy, and every screen says so.

## Who it's for

People in their 20s and 30s who are new to investing, are put off by jargon and endless tickers, and want to start with companies whose work they believe in.

## How it works

1. **Five quick questions, no account needed.** Which causes matter most (up to three, ranked), any dealbreakers, how you'd react to a 20% drop, whether you've bought a stock before, and what the money is for.
2. **A daily deck.** The server builds 7 cards a day (12 with Premium) from companies that work on your causes. It skips any company tied to your dealbreakers, spreads the deck across your causes, and never shows a company that doesn't match one of them. Liked companies don't repeat; passed ones can come back after 21 days.
3. **Story-first cards.** Each card shows:
   - what the company does for the cause, in one sentence;
   - which of your causes it matches, and whether that's its core business or one part of it;
   - one proof fact with a link to its source;
   - "things to know": honest counterpoints such as losses, lawsuits, recalls or debt;
   - a **"Big swings"** caution when the stock has moved sharply, with the move, why it happened and a source;
   - the key numbers, explained in plain words if you're new.
4. **Likes, news and a daily recap.** Liked companies go to your list. Later decks include news about companies you liked, and finishing the day's deck plays a short recap of your likes and what they say about you, with your liked companies circling the emblem of your top cause.
5. **Ask AI.** A chat assistant answers questions about companies and investing basics, using your causes and the app's reviewed research. It never gives personal investment or medical advice.

## The causes

Seven causes are live, with 154 companies in total:

| Cause | What it covers |
|---|---|
| Beat cancer & disease | Cancer care, early detection, vaccines, serious diseases |
| Live longer & healthier | Prevention, medical devices, longevity, fitness |
| Clean energy & climate | Solar, wind, batteries, the grid, EVs, efficiency |
| Keeping people safe | Cybersecurity and safety technology |
| Mental health & wellbeing | Treatments, care and digital mental health |
| Healthy food & farming | Sustainable and precision farming, healthier food, food safety |
| Clean water | Water utilities, treatment, testing, pipes and meters |

Dealbreakers you can filter out: tobacco, weapons, fossil fuels, gambling and factory farming.

## What makes it different

- **Values first, not stock tips.** Matching is driven by the causes you pick, not by price momentum.
- **Every claim is sourced.** Each company's story, proof, things to know and caution cites the pages it was checked against, mostly SEC filings, company releases and established news outlets. A script opens every cited page and flags any number or name it can't find, and those get checked by hand.
- **Honest about risk.** Every card has counterpoints, and stocks with big swings get a dated, explained caution.
- **Curated, not scraped.** Companies must be listed on a major U.S. exchange, be worth at least $1 billion, not be in the middle of being bought out, and have the cause as a real part of their business. Companies with criminal convictions or settlements that would undercut a cause are left out.

## Business model

Free users get 7 matches a day and 5 Ask AI questions per 24 hours. Premium, sold through Apple in-app purchase, adds 12 matches a day, unlimited Ask AI, a step-by-step tutor mode in Ask AI, and side-by-side comparison of two liked companies. Premium adds learning and exploring; it never claims better picks. An optional $1.99 tip to StockMatcherAI is designed (`src/components/support/`) but stays hidden until its In-App Purchase is approved and set up.

---

## For developers

### Stack

- **App:** React, TypeScript, Vite, Tailwind and shadcn/ui, wrapped for iOS with Capacitor (`ios/`). The website is hosted on Vercel.
- **Backend:** Supabase (Postgres with row-level security, Auth, Edge Functions in Deno).
- **Data:** Finnhub for prices, metrics, logos and news. Frankfurter (ECB rates) converts market caps for companies that report in other currencies.
- **AI:** Google Gemini (Flash-Lite with fallbacks) for Ask AI.

### Key pieces

| Path | What it does |
|---|---|
| `supabase/functions/match-feed` | Builds the daily deck, records swipes, imports swipes made before sign-in |
| `supabase/functions/_shared/matching.ts` | Matching rules: cause fit, dealbreakers, scoring, deck composition |
| `supabase/functions/update-stock-data` | Scheduled price and metrics updates; records 15%+ one-day moves in `price_moves` |
| `supabase/functions/stock-assistant` | Ask AI |
| `supabase/functions/company-data` | Company profiles and news |
| `supabase/functions/verify-apple-receipt`, `check-subscription` | Premium via Apple in-app purchase |
| `src/components/onboarding/` | The five-question onboarding |
| `src/components/values/` | Card pieces: cause chips, story/proof/things to know, cautions, key numbers |

### The company universe

`supabase/seed/launch-universe.json` is the source of truth for which companies are in the app and everything their cards say, with sources for every claim.

```sh
node scripts/build-launch-seed.mjs <migration-name>.sql   # validate and write a migration + review doc
node scripts/build-launch-seed.mjs --check-only <file>    # validate only
node scripts/check-universe-sources.mjs <file.json>       # open every cited page and flag mismatches
```

The builder refuses to run if any claim lacks an https source. It writes a migration and `supabase/seed/launch-universe-review.md`, a readable review of every company with links.

### Running and testing

```sh
npm install
npm run dev                      # local app on :8080
npm run test:e2e                 # Playwright (WebKit, iPhone 15) against the real backend
node scripts/test-feed.mjs       # deck composition rules
node scripts/test-match-feed.mjs # live feed checks (swipes one of the test account's cards)
node scripts/check-permissions.mjs # row-level security and API checks
npm run test:chat                # Ask AI end to end
```

Tests use a test account whose credentials live in the git-ignored `.env.test.local`.
