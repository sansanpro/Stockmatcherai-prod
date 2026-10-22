import type { MatchedCause } from '@/types/stock-matcher';

export const EXPOSURE_LABEL: Record<MatchedCause['exposure'], string> = {
  core: 'core business',
  partial: 'part of the business',
  peripheral: 'minor link',
};

// Header color for a company's (first) cause
export const CAUSE_GRADIENT: Record<string, string> = {
  beat_cancer: 'from-pink-500 to-rose-600',
  live_healthier: 'from-red-500 to-orange-500',
  clean_energy: 'from-emerald-500 to-teal-600',
  keeping_safe: 'from-blue-600 to-indigo-700',
};
export const causeGradient = (cause?: string) => CAUSE_GRADIENT[cause ?? ''] ?? 'from-indigo-500 to-purple-600';

interface CauseChipsProps {
  causes?: MatchedCause[];
  label?: string;
  // light: on a colored header; muted: on the page background
  tone?: 'light' | 'muted';
}

// "Values match" chips: each cause the company works on, and how central it is to the business
const CauseChips = ({ causes, label = 'Values match', tone = 'light' }: CauseChipsProps) => {
  if (!causes?.length) return null;
  const chip = tone === 'light'
    ? 'bg-white/20 text-white border border-white/25'
    : 'bg-primary/10 text-foreground border border-primary/20';
  return (
    <div>
      <p className={`text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${tone === 'light' ? 'text-white/75' : 'text-muted-foreground'}`}>
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {causes.map(c => (
          <span key={c.cause} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${chip}`}>
            <span aria-hidden>{c.icon}</span>
            {c.label}
            <span className="font-normal opacity-80">· {EXPOSURE_LABEL[c.exposure]}</span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default CauseChips;
