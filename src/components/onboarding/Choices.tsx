import { Check } from 'lucide-react';

interface Option<T extends string> {
  id: T;
  label: string;
}

// Full-width answer buttons, one per row (single choice). animated: each rises in, one after another.
export function ChoiceList<T extends string>({ options, value, onSelect, name, animated = false }: {
  options: readonly Option<T>[];
  value?: T;
  onSelect: (id: T) => void;
  name: string;
  animated?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label={name} className="space-y-3">
      {options.map((o, i) => {
        const selected = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onSelect(o.id)}
            style={animated ? { animationDelay: `${260 + i * 40}ms` } : undefined}
            className={`${animated ? 'rise-in ' : ''}w-full min-h-[56px] px-5 py-3.5 rounded-2xl border text-left text-[1.0625rem] font-medium text-ink shadow-sm transition-all duration-fast ease-out flex items-center gap-3 motion-safe:active:scale-[0.98] ${
              selected ? 'border-primary bg-clay-tint ring-1 ring-primary' : 'border-line bg-white hover:border-clay-soft'
            }`}
          >
            <span className="flex-1">{o.label}</span>
            <span className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
              selected ? 'bg-primary border-primary' : 'bg-white border-line'
            }`}>
              {selected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// Pill buttons that wrap; single or multiple choice
export function ChipGroup<T extends string>({ options, selected, onToggle, name, multiple = false, center = false }: {
  options: readonly Option<T>[];
  selected: readonly T[];
  onToggle: (id: T) => void;
  name: string;
  multiple?: boolean;
  center?: boolean;
}) {
  return (
    <div role={multiple ? 'group' : 'radiogroup'} aria-label={name} className={`flex flex-wrap gap-2.5 ${center ? 'justify-center' : ''}`}>
      {options.map(o => {
        const isOn = selected.includes(o.id);
        return (
          <button
            key={o.id}
            type="button"
            role={multiple ? 'checkbox' : 'radio'}
            aria-checked={isOn}
            onClick={() => onToggle(o.id)}
            className={`min-h-[44px] px-4 py-2 rounded-full border text-[0.9375rem] font-medium shadow-sm transition-all duration-fast ease-out motion-safe:active:scale-95 ${
              isOn ? 'border-primary bg-primary text-white' : 'border-line bg-white text-ink-soft hover:border-clay-soft'
            }`}
          >
            {isOn && multiple ? '✓ ' : ''}{o.label}
          </button>
        );
      })}
    </div>
  );
}
