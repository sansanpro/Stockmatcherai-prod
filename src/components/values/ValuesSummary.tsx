import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import type { StockRecommendation } from '@/types/stock-matcher';
import { CautionNote, CautionStrip } from '@/components/values/Caution';

interface ValuesSummaryProps {
  stock: Pick<StockRecommendation, 'missionStory' | 'proof' | 'proofSourceUrl' | 'thingsToKnow' | 'caution'>;
  // The swipe card's face: the story, any caution, then proof and things to know side by side,
  // so both sides are seen together. The full text is one tap away.
  compact?: boolean;
  className?: string;
}

// Proof and things to know share one tile design (light peach, dark plum in dark mode), so the
// counterpoints are exactly as prominent as the proof (the design brief's rule). Each has its own
// round icon in its color, and its title.
const TONES = {
  proof: { badge: 'bg-positive-soft text-positive-deep', link: 'text-positive-deep' },
  things: { badge: 'bg-info-soft text-info-deep', link: 'text-info-deep' },
} as const;

const Box = ({ tone, icon, title, children, clamp }: { tone: keyof typeof TONES; icon: ReactNode; title: string; children: ReactNode; clamp?: boolean }) => (
  <div className="rounded-2xl bg-surface-2 border border-line/60 p-3">
    <p className="text-[0.6875rem] font-semibold uppercase tracking-wide flex items-center gap-2 text-ink-soft">
      <span aria-hidden className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${TONES[tone].badge}`}>{icon}</span>
      <span>{title}</span>
    </p>
    <div className={`text-sm text-ink mt-2 leading-snug ${clamp ? 'line-clamp-4' : ''}`}>{children}</div>
  </div>
);

const ValuesSummary = ({ stock, compact = false, className = '' }: ValuesSummaryProps) => {
  const { missionStory, proof, proofSourceUrl, thingsToKnow = [], caution } = stock;
  if (!missionStory && !proof && thingsToKnow.length === 0 && !caution) return null;

  const proofIcon = <Check className="w-3.5 h-3.5" strokeWidth={3} />;
  const thingsIcon = <span className="text-[0.8125rem] font-extrabold leading-none">!</span>;
  const source = proofSourceUrl && (
    <a href={proofSourceUrl} target="_blank" rel="noopener noreferrer" className={`tap-target font-semibold underline whitespace-nowrap ${TONES.proof.link}`}>
      Source ↗
    </a>
  );

  if (compact) {
    return (
      <div className={`space-y-3 ${className}`}>
        {missionStory && <p className="text-[0.9375rem] leading-snug font-medium text-ink line-clamp-3">{missionStory}</p>}
        <CautionStrip caution={caution} />
        {(proof || thingsToKnow.length > 0) && (
          <div className="grid grid-cols-2 gap-2">
            {proof ? <Box tone="proof" icon={proofIcon} title="Proof" clamp>{proof}</Box> : <div />}
            {thingsToKnow.length > 0 ? (
              // "To know" fits one line on the half-width tile, so both tiles line up (the full view says "Things to know")
              <Box tone="things" icon={thingsIcon} title="To know" clamp>
                {thingsToKnow[0]}
              </Box>
            ) : <div />}
          </div>
        )}
        {(proof || thingsToKnow.length > 0) && (
          <p className="text-xs text-ink-soft text-center">Tap the card for the full story, sources and {thingsToKnow.length > 1 ? `all ${thingsToKnow.length} things to know` : 'details'}.</p>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {missionStory && <p className="text-[0.9375rem] leading-snug font-medium text-ink">{missionStory}</p>}
      <CautionNote caution={caution} />
      {proof && <Box tone="proof" icon={proofIcon} title="Proof">{proof}{' '}{source}</Box>}
      {thingsToKnow.length > 0 && (
        <Box tone="things" icon={thingsIcon} title="Things to know">
          <ul className="space-y-1 list-disc pl-4">
            {thingsToKnow.map(t => <li key={t}>{t}</li>)}
          </ul>
        </Box>
      )}
    </div>
  );
};

export default ValuesSummary;
