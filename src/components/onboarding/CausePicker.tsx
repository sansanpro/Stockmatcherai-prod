import type { CauseInfo } from '@/lib/matchFeed';
import { MAX_CAUSES } from '@/lib/onboarding';
import { CAUSE_ART } from '@/lib/art';

interface CausePickerProps {
  causes: CauseInfo[];
  selected: string[]; // ranked: index 0 is the user's #1
  onChange: (selected: string[]) => void;
}

// One row per cause. Tap order sets the rank; tapping a picked cause removes it and moves the
// others up. A picked cause shows how many companies match it in place of its description.
const CausePicker = ({ causes, selected, onChange }: CausePickerProps) => {
  const toggle = (id: string) => {
    if (selected.includes(id)) onChange(selected.filter(c => c !== id));
    else if (selected.length < MAX_CAUSES) onChange([...selected, id]);
  };
  const full = selected.length >= MAX_CAUSES;

  return (
    <div className="space-y-1.5" role="group" aria-label="Causes">
      {causes.map(cause => {
        const rank = selected.indexOf(cause.id) + 1;
        const isOn = rank > 0;
        const art = CAUSE_ART[cause.id];
        return (
          <button
            key={cause.id}
            type="button"
            aria-pressed={isOn}
            onClick={() => toggle(cause.id)}
            disabled={!isOn && full}
            className={`w-full min-h-[52px] rounded-2xl border px-3 py-2 text-left flex items-center gap-3 shadow-sm transition-all duration-fast ease-out motion-safe:active:scale-[0.98] disabled:opacity-40 ${
              isOn ? 'border-primary bg-clay-tint ring-1 ring-primary' : 'border-line bg-surface hover:border-clay-soft'
            }`}
          >
            {art
              ? <img key={isOn ? 'on' : 'off'} src={art} alt="" aria-hidden draggable={false}
                  className={`w-8 h-8 flex-shrink-0 drop-shadow-[0_5px_6px_rgb(var(--shadow)/0.18)] ${isOn ? 'art-3d-pop' : ''}`} />
              : <span className="w-8 text-2xl text-center flex-shrink-0" aria-hidden>{cause.icon}</span>}
            <span className="flex-1 min-w-0">
              <span className="block text-ink text-[0.9375rem] font-semibold leading-snug">{cause.label}{isOn && <span className="sr-only">, pick {rank}</span>}</span>
              {isOn
                ? <span className="block text-clay-ink text-[0.78125rem] font-semibold leading-snug mt-0.5">{cause.companies} companies match</span>
                : <span className="block text-ink-faint text-[0.78125rem] leading-snug mt-0.5">{cause.tagline}</span>}
            </span>
            <span className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold transition-colors ${
              isOn ? 'bg-primary text-primary-foreground' : 'border border-line bg-surface'
            }`} aria-hidden>
              {isOn ? rank : ''}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default CausePicker;
