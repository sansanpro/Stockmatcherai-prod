// The optional $1.99 tip to StockMatcherAI (docs/phase-0.md, section 4). Apple 3.1.1: a tip to the
// developer must be an In-App Purchase (a consumable). That purchase isn't wired up yet: it needs
// the owner's approval and a product in App Store Connect. Until then the tip screens stay hidden,
// except in preview (localStorage support_preview = 1) for design review and tests.
export const TIP_PRICE = '$1.99';
const TIP_PURCHASE_READY = false;

const PREVIEW_KEY = 'support_preview';
const RECAP_KEY = 'support_recap'; // { lastShown: 'YYYY-MM-DD', dismissals: number }
const WEEK_MS = 7 * 24 * 3600 * 1000;

const read = <T,>(key: string, fallback: T): T => {
  try { return JSON.parse(localStorage.getItem(key) ?? '') as T; } catch { return fallback; }
};
const write = (key: string, value: unknown) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage blocked */ }
};

export const isTipPreview = () => read<number>(PREVIEW_KEY, 0) === 1;
export const tipsAvailable = () => TIP_PURCHASE_READY || isTipPreview();

// The recap's gentle ask: at most once a week, and never again after "Not now" twice
export function shouldOfferTipOnRecap(now = new Date()) {
  if (!tipsAvailable()) return false;
  const { lastShown, dismissals = 0 } = read<{ lastShown?: string; dismissals?: number }>(RECAP_KEY, {});
  if (dismissals >= 2) return false;
  return !lastShown || now.getTime() - new Date(lastShown).getTime() >= WEEK_MS;
}
export function markTipOfferShown(now = new Date()) {
  const state = read<{ dismissals?: number }>(RECAP_KEY, {});
  write(RECAP_KEY, { ...state, lastShown: now.toISOString().slice(0, 10) });
}
export function dismissTipOffer() {
  const state = read<{ lastShown?: string; dismissals?: number }>(RECAP_KEY, {});
  write(RECAP_KEY, { ...state, dismissals: (state.dismissals ?? 0) + 1 });
}

// Placeholder until the consumable In-App Purchase is approved. In preview it pretends to succeed
// so the thank-you can be reviewed; otherwise it refuses.
export async function purchaseTip(): Promise<void> {
  if (isTipPreview()) { await new Promise(r => setTimeout(r, 600)); return; }
  throw new Error('Tips are not available yet');
}
