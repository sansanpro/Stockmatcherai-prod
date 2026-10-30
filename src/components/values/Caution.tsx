import { AlertTriangle } from 'lucide-react';
import type { StockCaution } from '@/types/stock-matcher';

// Caution colors (plum palette; every pairing is checked in light and dark by scripts/build-plum-tokens.mjs).
// Same box design as Proof and Things to know, so a caution is never less visible than the proof.
const TONE = { box: 'bg-caution-tint border-caution-line', title: 'text-caution-ink', chip: 'bg-caution-soft border-caution-line text-caution-ink' };

// Small tag on a card header: this stock swings a lot
export const CautionChip = ({ caution, onPlum = false }: { caution?: StockCaution; onPlum?: boolean }) => {
  if (!caution) return null;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border ${onPlum ? 'bg-white/10 border-white/30 text-white' : TONE.chip}`}>
      <AlertTriangle className="w-3.5 h-3.5" aria-hidden /> Big swings
    </span>
  );
};

const Title = () => (
  <p className={`text-[0.6875rem] font-semibold uppercase tracking-wide flex items-center gap-1 ${TONE.title}`}>
    <AlertTriangle className="w-3.5 h-3.5" aria-hidden /> Heads up: big swings
  </p>
);

// On the swipe card's face: what moved, in one box beside the story (the reason is one tap away)
export const CautionStrip = ({ caution }: { caution?: StockCaution }) => {
  if (!caution) return null;
  return (
    <div className={`rounded-xl border p-3 ${TONE.box}`}>
      <Title />
      <p className="text-sm font-semibold text-ink mt-1 leading-snug">{caution.headline}</p>
    </div>
  );
};

// What moved, why (or that it isn't explained yet), and where that comes from
export const CautionNote = ({ caution }: { caution?: StockCaution }) => {
  if (!caution) return null;
  return (
    <div className={`rounded-xl border p-3 ${TONE.box}`}>
      <Title />
      <p className="text-sm font-semibold text-ink mt-1 leading-snug">{caution.headline}</p>
      <p className="text-sm text-ink mt-1 leading-snug">
        {caution.reason ?? "We haven't confirmed why yet. Moves this big can come from news that's still unfolding."}{' '}
        {caution.sourceUrl && (
          <a href={caution.sourceUrl} target="_blank" rel="noopener noreferrer" className={`tap-target font-semibold underline whitespace-nowrap ${TONE.title}`}>
            Source ↗
          </a>
        )}
      </p>
    </div>
  );
};
