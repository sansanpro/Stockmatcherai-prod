import { Brain, Droplet, HeartPulse, Ribbon, Shield, Sparkles, Wheat, Zap, type LucideIcon } from 'lucide-react';
import type { MatchedCause } from '@/types/stock-matcher';

export const EXPOSURE_LABEL: Record<MatchedCause['exposure'], string> = {
  core: 'core business',
  partial: 'part of the business',
  peripheral: 'minor link',
};

// Each cause's colors (plum palette, scripts/build-plum-tokens.mjs checks every pairing in light and dark):
//   header: a bold band (details sheet, recap; put ink or ink-soft text on it, never ink-faint)
//   soft: a calmer fill; text: the deep tone for chip labels on the page; border: chip outlines
//   onPlum: chip and symbol colors on the plum card header, the same in light and dark
// The icon and label are always shown too, so color is never the only cue.
interface CauseTone { header: string; soft: string; text: string; border: string; onPlum: string; symbol: string }
// Written out in full (not built from the cause id) so Tailwind finds every class
const CAUSE_TONES: Record<string, CauseTone> = {
  beat_cancer: { header: 'bg-cause-beat_cancer-vivid', soft: 'bg-cause-beat_cancer-soft', text: 'text-cause-beat_cancer', border: 'border-cause-beat_cancer-line', onPlum: 'bg-cause-beat_cancer-bright/20 border-cause-beat_cancer-bright/50 text-cause-beat_cancer-light', symbol: 'text-cause-beat_cancer-light' },
  live_healthier: { header: 'bg-cause-live_healthier-vivid', soft: 'bg-cause-live_healthier-soft', text: 'text-cause-live_healthier', border: 'border-cause-live_healthier-line', onPlum: 'bg-cause-live_healthier-bright/20 border-cause-live_healthier-bright/50 text-cause-live_healthier-light', symbol: 'text-cause-live_healthier-light' },
  clean_energy: { header: 'bg-cause-clean_energy-vivid', soft: 'bg-cause-clean_energy-soft', text: 'text-cause-clean_energy', border: 'border-cause-clean_energy-line', onPlum: 'bg-cause-clean_energy-bright/20 border-cause-clean_energy-bright/50 text-cause-clean_energy-light', symbol: 'text-cause-clean_energy-light' },
  keeping_safe: { header: 'bg-cause-keeping_safe-vivid', soft: 'bg-cause-keeping_safe-soft', text: 'text-cause-keeping_safe', border: 'border-cause-keeping_safe-line', onPlum: 'bg-cause-keeping_safe-bright/20 border-cause-keeping_safe-bright/50 text-cause-keeping_safe-light', symbol: 'text-cause-keeping_safe-light' },
  mental_health: { header: 'bg-cause-mental_health-vivid', soft: 'bg-cause-mental_health-soft', text: 'text-cause-mental_health', border: 'border-cause-mental_health-line', onPlum: 'bg-cause-mental_health-bright/20 border-cause-mental_health-bright/50 text-cause-mental_health-light', symbol: 'text-cause-mental_health-light' },
  clean_food: { header: 'bg-cause-clean_food-vivid', soft: 'bg-cause-clean_food-soft', text: 'text-cause-clean_food', border: 'border-cause-clean_food-line', onPlum: 'bg-cause-clean_food-bright/20 border-cause-clean_food-bright/50 text-cause-clean_food-light', symbol: 'text-cause-clean_food-light' },
  clean_water: { header: 'bg-cause-clean_water-vivid', soft: 'bg-cause-clean_water-soft', text: 'text-cause-clean_water', border: 'border-cause-clean_water-line', onPlum: 'bg-cause-clean_water-bright/20 border-cause-clean_water-bright/50 text-cause-clean_water-light', symbol: 'text-cause-clean_water-light' },
};
const DEFAULT_TONE: CauseTone = { header: 'bg-brand-vivid', soft: 'bg-brand-soft', text: 'text-brand', border: 'border-brand-line', onPlum: 'bg-white/10 border-white/25 text-white', symbol: 'text-white' };
export const causeTone = (cause?: string): CauseTone => CAUSE_TONES[cause ?? ''] ?? DEFAULT_TONE;

// Each cause's line icon: on chips and as the faint symbol on the card header
const CAUSE_ICONS: Record<string, LucideIcon> = {
  beat_cancer: Ribbon, live_healthier: HeartPulse, clean_energy: Zap, keeping_safe: Shield,
  mental_health: Brain, clean_food: Wheat, clean_water: Droplet,
};
export const CauseIcon = ({ cause, className = 'w-3.5 h-3.5' }: { cause?: string; className?: string }) => {
  const Icon = CAUSE_ICONS[cause ?? ''] ?? Sparkles;
  return <Icon className={className} aria-hidden />;
};

interface CauseChipsProps {
  causes?: MatchedCause[];
  label?: string;
  // On the plum card header: light text on a tint of the cause's color
  onPlum?: boolean;
}

// "Values match" chips: each cause the company works on, in its own color, and how central it is
const CauseChips = ({ causes, label = 'Values match', onPlum = false }: CauseChipsProps) => {
  if (!causes?.length) return null;
  return (
    <div>
      <p className={`text-[0.6875rem] font-semibold uppercase tracking-wide mb-1.5 ${onPlum ? 'text-white/75' : 'text-ink-soft'}`}>{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {causes.map(c => {
          const t = causeTone(c.cause);
          return (
            <span key={c.cause} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.8125rem] font-semibold border ${onPlum ? t.onPlum : `bg-surface ${t.border} ${t.text}`}`}>
              <CauseIcon cause={c.cause} />
              {c.label}
              <span className={`font-normal ${onPlum ? 'text-white/85' : 'text-ink-faint'}`}>· {EXPOSURE_LABEL[c.exposure]}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default CauseChips;
