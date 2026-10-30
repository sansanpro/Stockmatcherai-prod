import { useState } from 'react';
import { Input } from '@/components/ui/input';

// Common endings, one tap each. The bare "@" also covers any other provider, and works even
// where typing "@" doesn't (e.g. a Mac keyboard driving the iOS Simulator).
const ENDINGS = ['@', '@gmail.com', '@icloud.com', '@outlook.com'];

interface EmailInputProps {
  id?: string;
  name?: string;
  placeholder?: string;
  className?: string;
}

// Email field that brings up the iPhone's email keyboard (with its own "@" key) and offers
// one-tap endings until the address has an "@"
const EmailInput = ({ id, name = 'email', placeholder, className }: EmailInputProps) => {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const showEndings = focused && value.length > 0 && !value.includes('@');

  return (
    <div>
      <Input
        id={id}
        name={name}
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="next"
        required
        value={value}
        onChange={e => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className={className}
      />
      {showEndings && (
        <div className="flex flex-wrap gap-2 mt-2" role="group" aria-label="Email endings">
          {ENDINGS.map(ending => (
            <button
              key={ending}
              type="button"
              // Keep the keyboard up: don't let the tap take focus away from the field
              onPointerDown={e => e.preventDefault()}
              onMouseDown={e => e.preventDefault()}
              onClick={() => setValue(v => `${v}${ending}`)}
              className="min-h-[36px] px-3 rounded-full border border-line bg-surface text-sm font-medium text-ink-soft hover:border-clay-soft active:scale-95 transition-transform"
            >
              {ending}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmailInput;
