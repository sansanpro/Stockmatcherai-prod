import { Check } from 'lucide-react';

interface Option<T extends string> {
  id: T;
  label: string;
}

// Full-width answer buttons, one per row (single choice)
export function ChoiceList<T extends string>({ options, value, onSelect, name }: {
  options: readonly Option<T>[];
  value?: T;
  onSelect: (id: T) => void;
  name: string;
}) {
  return (
    <div role="radiogroup" aria-label={name} className="space-y-3">
      {options.map(o => {
        const selected = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onSelect(o.id)}
            className={`w-full min-h-[56px] px-4 py-3 rounded-2xl border-2 text-left text-base font-medium transition-all duration-150 flex items-center gap-3 active:scale-[0.98] ${
              selected ? 'border-primary bg-primary/15 text-white' : 'border-white/10 bg-white/5 text-white/90 hover:border-white/25'
            }`}
          >
            <span className="flex-1">{o.label}</span>
            {selected && (
              <span className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <Check className="w-3.5 h-3.5 text-white" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// Pill buttons that wrap; single or multiple choice
export function ChipGroup<T extends string>({ options, selected, onToggle, name, multiple = false }: {
  options: readonly Option<T>[];
  selected: readonly T[];
  onToggle: (id: T) => void;
  name: string;
  multiple?: boolean;
}) {
  return (
    <div role={multiple ? 'group' : 'radiogroup'} aria-label={name} className="flex flex-wrap gap-2.5">
      {options.map(o => {
        const isOn = selected.includes(o.id);
        return (
          <button
            key={o.id}
            type="button"
            role={multiple ? 'checkbox' : 'radio'}
            aria-checked={isOn}
            onClick={() => onToggle(o.id)}
            className={`min-h-[44px] px-4 py-2 rounded-full border-2 text-sm font-medium transition-all duration-150 active:scale-95 ${
              isOn ? 'border-primary bg-primary/15 text-white' : 'border-white/10 bg-white/5 text-white/80 hover:border-white/25'
            }`}
          >
            {isOn && multiple ? '✓ ' : ''}{o.label}
          </button>
        );
      })}
    </div>
  );
}
