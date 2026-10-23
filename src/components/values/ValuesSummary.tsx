import { BadgeCheck, Scale } from 'lucide-react';
import type { StockRecommendation } from '@/types/stock-matcher';

interface ValuesSummaryProps {
  stock: Pick<StockRecommendation, 'missionStory' | 'proof' | 'proofSourceUrl' | 'thingsToKnow'>;
  className?: string;
}

// What the company is working on, one checkable fact (with its source), and the honest counterpoints
const ValuesSummary = ({ stock, className = '' }: ValuesSummaryProps) => {
  const { missionStory, proof, proofSourceUrl, thingsToKnow = [] } = stock;
  if (!missionStory && !proof && thingsToKnow.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {missionStory && (
        <p className="text-[15px] leading-snug font-medium text-ink">{missionStory}</p>
      )}
      {proof && (
        <div className="rounded-xl bg-[#EEF4E6] border border-[#CFE0BC] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#3B6A2A] flex items-center gap-1">
            <BadgeCheck className="w-3.5 h-3.5" /> Proof
          </p>
          <p className="text-sm text-ink mt-1 leading-snug">
            {proof}{' '}
            {proofSourceUrl && (
              <a href={proofSourceUrl} target="_blank" rel="noopener noreferrer"
                className="font-semibold text-[#3B6A2A] underline whitespace-nowrap">
                Source ↗
              </a>
            )}
          </p>
        </div>
      )}
      {thingsToKnow.length > 0 && (
        <div className="rounded-xl bg-[#FBF0DC] border border-[#EED9B0] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A5A12] flex items-center gap-1">
            <Scale className="w-3.5 h-3.5" /> Things to know
          </p>
          <ul className="mt-1 space-y-1 text-sm text-ink list-disc pl-4 leading-snug">
            {thingsToKnow.map(t => <li key={t}>{t}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ValuesSummary;
