import { BadgeCheck, Scale } from 'lucide-react';
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

// Proof, things to know and cautions share one box design, so the counterpoints are exactly as
// prominent as the proof (the design brief's rule). Each has its own color, icon and title.
const TONES = {
  // Titles and links use the darkest tone: small text on a tint needs the margin (7:1 and up, not 4.5)
  proof: { box: 'bg-positive-tint border-positive-line', title: 'text-positive-ink', link: 'text-positive-ink' },
  things: { box: 'bg-info-tint border-info-line', title: 'text-info-ink', link: 'text-info-ink' },
} as const;

const Box = ({ tone, icon, title, children, clamp }: { tone: keyof typeof TONES; icon: ReactNode; title: string; children: ReactNode; clamp?: boolean }) => (
  <div className={`rounded-xl border p-3 ${TONES[tone].box}`}>
    <p className={`text-[0.6875rem] font-semibold uppercase tracking-wide flex items-center gap-1 ${TONES[tone].title}`}>
      {icon} {title}
    </p>
    <div className={`text-sm text-ink mt-1 leading-snug ${clamp ? 'line-clamp-4' : ''}`}>{children}</div>
  </div>
);

const ValuesSummary = ({ stock, compact = false, className = '' }: ValuesSummaryProps) => {
  const { missionStory, proof, proofSourceUrl, thingsToKnow = [], caution } = stock;
  if (!missionStory && !proof && thingsToKnow.length === 0 && !caution) return null;

  const proofIcon = <BadgeCheck className="w-3.5 h-3.5" aria-hidden />;
  const thingsIcon = <Scale className="w-3.5 h-3.5" aria-hidden />;
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
              <Box tone="things" icon={thingsIcon} title="Things to know" clamp>
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
