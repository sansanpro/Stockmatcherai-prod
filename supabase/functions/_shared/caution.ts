// The "big swings" caution on a company's card: the researched one from the stocks table, or,
// for a one-day jump nobody has explained yet, an automatic one that says so.

export interface Caution {
  headline: string;
  reason: string | null; // null: the move hasn't been explained yet
  sourceUrl: string | null;
}

export interface PriceMove { ticker: string; move_date: string; pct: number }

// Unexplained moves older than this stop showing
export const MOVE_WINDOW_DAYS = 30;

const shortDate = (isoDate: string) =>
  new Date(`${isoDate}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

export const moveHeadline = (move: PriceMove) =>
  `${move.pct >= 0 ? 'Jumped' : 'Fell'} ${Math.round(Math.abs(move.pct))}% in one day (${shortDate(move.move_date)})`;

export function cautionFor(stock: Record<string, unknown>, latestMove?: PriceMove): Caution | null {
  const checkedOn = typeof stock.caution_checked_on === 'string' ? stock.caution_checked_on : null;
  // A move after the last research wins: the researched caution may not cover it
  if (latestMove && (!checkedOn || latestMove.move_date > checkedOn)) {
    return { headline: moveHeadline(latestMove), reason: null, sourceUrl: null };
  }
  if (typeof stock.caution_headline === 'string' && stock.caution_headline) {
    return {
      headline: stock.caution_headline,
      reason: typeof stock.caution_reason === 'string' ? stock.caution_reason : null,
      sourceUrl: typeof stock.caution_source_url === 'string' ? stock.caution_source_url : null,
    };
  }
  return null;
}

// Each ticker's most recent big move within the window
export function latestMoves(moves: PriceMove[]): Map<string, PriceMove> {
  const latest = new Map<string, PriceMove>();
  for (const m of moves) {
    const seen = latest.get(m.ticker);
    if (!seen || m.move_date > seen.move_date) latest.set(m.ticker, { ...m, pct: Number(m.pct) });
  }
  return latest;
}

export const moveWindowStart = () =>
  new Date(Date.now() - MOVE_WINDOW_DAYS * 86_400_000).toISOString().slice(0, 10);
