import { AlertTriangle } from 'lucide-react';
import type { StockCaution } from '@/types/stock-matcher';

// Deep on tint 6.4:1, deep on white 7.9:1
const TONE = { bg: 'bg-[#FDE8E1]', border: 'border-[#F3C2B3]', text: 'text-[#9A3412]' };

// Small tag on a card header: this stock swings a lot
export const CautionChip = ({ caution }: { caution?: StockCaution }) => {
  if (!caution) return null;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border ${TONE.bg} ${TONE.border} ${TONE.text}`}>
      <AlertTriangle className="w-3.5 h-3.5" aria-hidden /> Big swings
    </span>
  );
};

// What moved, why (or that it isn't explained yet), and where that comes from
export const CautionNote = ({ caution }: { caution?: StockCaution }) => {
  if (!caution) return null;
  return (
    <div className={`rounded-xl border p-3 ${TONE.bg} ${TONE.border}`}>
      <p className={`text-[11px] font-semibold uppercase tracking-wide flex items-center gap-1 ${TONE.text}`}>
        <AlertTriangle className="w-3.5 h-3.5" aria-hidden /> Heads up: big swings
      </p>
      <p className="text-sm font-semibold text-ink mt-1 leading-snug">{caution.headline}</p>
      <p className="text-sm text-ink mt-1 leading-snug">
        {caution.reason ?? "We haven't confirmed why yet. Moves this big can come from news that's still unfolding."}{' '}
        {caution.sourceUrl && (
          <a href={caution.sourceUrl} target="_blank" rel="noopener noreferrer"
            className={`font-semibold underline whitespace-nowrap ${TONE.text}`}>
            Source ↗
          </a>
        )}
      </p>
    </div>
  );
};
