import type { CauseInfo } from '@/lib/matchFeed';
import { MAX_CAUSES } from '@/lib/onboarding';
import { CAUSE_ART } from '@/lib/art';

interface CausePickerProps {
  causes: CauseInfo[];
  selected: string[]; // ranked: index 0 is the user's #1
  onChange: (selected: string[]) => void;
}

// One row per cause. Tap order sets the rank; tapping a picked cause removes it and moves the
// others up. A picked cause shows how many companies work on it in place of its description.
const CausePicker = ({ causes, selected, onChange }: CausePickerProps) => {
  const toggle = (id: string) => {
    if (selected.includes(id)) onChange(selected.filter(c => c !== id));
    else if (selected.length < MAX_CAUSES) onChange([...selected, id]);
  };
  const full = selected.length >= MAX_CAUSES;

  return (
    <div className="space-y-2.5" role="group" aria-label="Causes">
      {causes.map(cause => {
        const rank = selected.indexOf(cause.id) + 1;
        const isOn = rank > 0;
        const art = CAUSE_ART[cause.id];
        return (
          <button
            key={cause.id}
            type="button"
            aria-pressed={isOn}
            aria-label={`${cause.label}${isOn ? `, pick ${rank}` : ''}`}
            onClick={() => toggle(cause.id)}
            disabled={!isOn && full}
            className={`w-full min-h-[76px] rounded-2xl border px-3.5 py-3 text-left flex items-center gap-3.5 shadow-sm transition-all duration-150 active:scale-[0.98] disabled:opacity-40 ${
              isOn ? 'border-primary bg-clay-tint ring-1 ring-primary' : 'border-line bg-white hover:border-clay-soft'
            }`}
          >
            {art
              ? <img key={isOn ? 'on' : 'off'} src={art} alt="" aria-hidden draggable={false}
                  className={`w-11 h-11 flex-shrink-0 drop-shadow-[0_6px_8px_rgba(120,72,40,0.18)] ${isOn ? 'art-3d-pop' : ''}`} />
              : <span className="w-11 text-4xl text-center flex-shrink-0" aria-hidden>{cause.icon}</span>}
            <span className="flex-1 min-w-0">
              <span className="block text-ink text-[16px] font-semibold leading-snug">{cause.label}</span>
              {isOn
                ? <span className="block text-clay-ink text-[13px] font-semibold leading-snug mt-0.5">{cause.companies} companies are working on this</span>
                : <span className="block text-ink-faint text-[13px] leading-snug mt-0.5">{cause.tagline}</span>}
            </span>
            <span className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold transition-colors ${
              isOn ? 'bg-primary text-white' : 'border border-line bg-white'
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
