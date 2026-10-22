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
        <p className="text-[15px] leading-snug font-medium text-gray-900 dark:text-white">{missionStory}</p>
      )}
      {proof && (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/25 border border-emerald-200/70 dark:border-emerald-700/40 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
            <BadgeCheck className="w-3.5 h-3.5" /> Proof
          </p>
          <p className="text-sm text-gray-800 dark:text-gray-200 mt-1 leading-snug">
            {proof}{' '}
            {proofSourceUrl && (
              <a href={proofSourceUrl} target="_blank" rel="noopener noreferrer"
                className="font-semibold text-emerald-700 dark:text-emerald-400 underline whitespace-nowrap">
                Source ↗
              </a>
            )}
          </p>
        </div>
      )}
      {thingsToKnow.length > 0 && (
        <div className="rounded-xl bg-amber-50 dark:bg-amber-900/25 border border-amber-200/70 dark:border-amber-700/40 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 flex items-center gap-1">
            <Scale className="w-3.5 h-3.5" /> Things to know
          </p>
          <ul className="mt-1 space-y-1 text-sm text-gray-800 dark:text-gray-200 list-disc pl-4 leading-snug">
            {thingsToKnow.map(t => <li key={t}>{t}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ValuesSummary;
