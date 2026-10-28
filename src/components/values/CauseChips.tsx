import type { MatchedCause } from '@/types/stock-matcher';

export const EXPOSURE_LABEL: Record<MatchedCause['exposure'], string> = {
  core: 'core business',
  partial: 'part of the business',
  peripheral: 'minor link',
};

// Each cause's colors (Daybreak tokens, tested in docs/phase0/palette-report.md):
//   header: a bold band for card headers and the recap (put ink or ink-soft text on it, never ink-faint)
//   soft: a calmer fill; text: the deep tone for chip labels on white; border: chip outlines.
// Cause tones are tuned so the deep tones stay apart under color blindness; the icon and label
// are always shown too, so color is never the only cue.
interface CauseTone { header: string; soft: string; text: string; border: string }
const CAUSE_TONES: Record<string, CauseTone> = {
  beat_cancer: { header: 'bg-cause-beat_cancer-vivid', soft: 'bg-cause-beat_cancer-soft', text: 'text-cause-beat_cancer', border: 'border-cause-beat_cancer-line' },
  live_healthier: { header: 'bg-cause-live_healthier-vivid', soft: 'bg-cause-live_healthier-soft', text: 'text-cause-live_healthier', border: 'border-cause-live_healthier-line' },
  clean_energy: { header: 'bg-cause-clean_energy-vivid', soft: 'bg-cause-clean_energy-soft', text: 'text-cause-clean_energy', border: 'border-cause-clean_energy-line' },
  keeping_safe: { header: 'bg-cause-keeping_safe-vivid', soft: 'bg-cause-keeping_safe-soft', text: 'text-cause-keeping_safe', border: 'border-cause-keeping_safe-line' },
  mental_health: { header: 'bg-cause-mental_health-vivid', soft: 'bg-cause-mental_health-soft', text: 'text-cause-mental_health', border: 'border-cause-mental_health-line' },
  clean_food: { header: 'bg-cause-clean_food-vivid', soft: 'bg-cause-clean_food-soft', text: 'text-cause-clean_food', border: 'border-cause-clean_food-line' },
  clean_water: { header: 'bg-cause-clean_water-vivid', soft: 'bg-cause-clean_water-soft', text: 'text-cause-clean_water', border: 'border-cause-clean_water-line' },
};
const DEFAULT_TONE: CauseTone = { header: 'bg-brand-vivid', soft: 'bg-brand-soft', text: 'text-brand', border: 'border-brand-line' };
export const causeTone = (cause?: string): CauseTone => CAUSE_TONES[cause ?? ''] ?? DEFAULT_TONE;

interface CauseChipsProps {
  causes?: MatchedCause[];
  label?: string;
}

// "Values match" chips: each cause the company works on, in its own color, and how central it is
const CauseChips = ({ causes, label = 'Values match' }: CauseChipsProps) => {
  if (!causes?.length) return null;
  return (
    <div>
      <p className="text-[0.6875rem] font-semibold uppercase tracking-wide mb-1.5 text-ink-soft">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {causes.map(c => {
          const tone = causeTone(c.cause);
          return (
            <span key={c.cause} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold bg-surface border ${tone.border} ${tone.text}`}>
              <span aria-hidden>{c.icon}</span>
              {c.label}
              <span className="font-normal text-ink-faint">· {EXPOSURE_LABEL[c.exposure]}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default CauseChips;
