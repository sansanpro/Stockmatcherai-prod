import type { MatchedCause } from '@/types/stock-matcher';

export const EXPOSURE_LABEL: Record<MatchedCause['exposure'], string> = {
  core: 'core business',
  partial: 'part of the business',
  peripheral: 'minor link',
};

// Each cause's colors: a soft tint for headers and a deep tone for text and chip borders.
// Deep on tint and on white are all above 5:1; ink text on the tints is above 14:1.
interface CauseTone { header: string; text: string; border: string }
const CAUSE_TONES: Record<string, CauseTone> = {
  beat_cancer: { header: 'bg-[#FBE4E7]', text: 'text-[#A3304A]', border: 'border-[#F0C2CB]' },
  live_healthier: { header: 'bg-[#FCE6DC]', text: 'text-[#A33A22]', border: 'border-[#F0C6B3]' },
  clean_energy: { header: 'bg-[#E6EFDB]', text: 'text-[#3B6A2A]', border: 'border-[#C7DAB2]' },
  keeping_safe: { header: 'bg-[#E2EAF5]', text: 'text-[#2C5288]', border: 'border-[#C0D1E8]' },
  clean_food: { header: 'bg-[#F6EDD6]', text: 'text-[#735512]', border: 'border-[#E8D6A8]' },
  mental_health: { header: 'bg-[#DDF0EC]', text: 'text-[#1D6359]', border: 'border-[#B5DCD3]' },
  clean_water: { header: 'bg-[#DDEEF7]', text: 'text-[#1B5A7A]', border: 'border-[#B4D6E8]' },
};
const DEFAULT_TONE: CauseTone = { header: 'bg-[#F0E8DD]', text: 'text-[#6B4F3A]', border: 'border-[#DCCBB6]' };
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
      <p className="text-[11px] font-semibold uppercase tracking-wide mb-1.5 text-ink-faint">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {causes.map(c => {
          const tone = causeTone(c.cause);
          return (
            <span key={c.cause} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold bg-white border ${tone.border} ${tone.text}`}>
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
