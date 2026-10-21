import type { CauseInfo } from '@/lib/matchFeed';
import { MAX_CAUSES } from '@/lib/onboarding';

interface CausePickerProps {
  causes: CauseInfo[];
  selected: string[]; // ranked: index 0 is the user's #1
  onChange: (selected: string[]) => void;
}

// Tap order sets the rank; tapping a picked cause removes it and moves the others up
const CausePicker = ({ causes, selected, onChange }: CausePickerProps) => {
  const toggle = (id: string) => {
    if (selected.includes(id)) onChange(selected.filter(c => c !== id));
    else if (selected.length < MAX_CAUSES) onChange([...selected, id]);
  };
  const full = selected.length >= MAX_CAUSES;

  return (
    <div className="grid grid-cols-2 gap-3" role="group" aria-label="Causes">
      {causes.map(cause => {
        const rank = selected.indexOf(cause.id) + 1;
        const isOn = rank > 0;
        return (
          <button
            key={cause.id}
            type="button"
            aria-pressed={isOn}
            aria-label={`${cause.label}${isOn ? `, pick ${rank}` : ''}`}
            onClick={() => toggle(cause.id)}
            disabled={!isOn && full}
            className={`relative min-h-[150px] rounded-3xl border-2 p-4 text-left flex flex-col transition-all duration-150 active:scale-[0.97] disabled:opacity-40 ${
              isOn ? 'border-primary bg-gradient-to-br from-primary/30 to-purple-600/20 shadow-lg shadow-primary/20' : 'border-white/10 bg-white/5 hover:border-white/25'
            }`}
          >
            {isOn && (
              <span className="absolute top-3 right-3 w-7 h-7 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center shadow">
                {rank}
              </span>
            )}
            <span className="text-4xl mb-2" aria-hidden>{cause.icon}</span>
            <span className="text-white font-semibold leading-snug">{cause.label}</span>
            <span className="text-white/50 text-xs mt-1 leading-snug">{cause.tagline}</span>
            {isOn && (
              <span className="text-white/90 text-xs font-medium mt-auto pt-2">
                {cause.companies} companies are working on this
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default CausePicker;
