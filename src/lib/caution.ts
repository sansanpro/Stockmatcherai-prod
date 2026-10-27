// The "big swings" caution for companies loaded straight from the database (Likes).
// Mirrors supabase/functions/_shared/caution.ts, which builds it for deck cards.
import type { StockCaution } from '@/types/stock-matcher';

export interface PriceMove { ticker: string; move_date: string; pct: number }

// Unexplained moves older than this stop showing
export const MOVE_WINDOW_DAYS = 30;

export const moveWindowStart = () =>
  new Date(Date.now() - MOVE_WINDOW_DAYS * 86_400_000).toISOString().slice(0, 10);

const shortDate = (isoDate: string) =>
  new Date(`${isoDate}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

export const moveHeadline = (move: PriceMove) =>
  `${move.pct >= 0 ? 'Jumped' : 'Fell'} ${Math.round(Math.abs(move.pct))}% in one day (${shortDate(move.move_date)})`;

export function latestMoves(moves: PriceMove[]): Map<string, PriceMove> {
  const latest = new Map<string, PriceMove>();
  for (const m of moves) {
    const seen = latest.get(m.ticker);
    if (!seen || m.move_date > seen.move_date) latest.set(m.ticker, { ...m, pct: Number(m.pct) });
  }
  return latest;
}

interface CautionColumns {
  caution_headline?: string | null;
  caution_reason?: string | null;
  caution_source_url?: string | null;
  caution_checked_on?: string | null;
}

export function cautionFor(stock: CautionColumns, latestMove?: PriceMove): StockCaution | undefined {
  // A move after the last research wins: the researched caution may not cover it
  if (latestMove && (!stock.caution_checked_on || latestMove.move_date > stock.caution_checked_on)) {
    return { headline: moveHeadline(latestMove), reason: null, sourceUrl: null };
  }
  if (stock.caution_headline) {
    return { headline: stock.caution_headline, reason: stock.caution_reason ?? null, sourceUrl: stock.caution_source_url ?? null };
  }
  return undefined;
}
