import { useState } from 'react';

// A one-time inline hint (replaces the old tutorial slides). Each id is shown once per install.
const seen = (id: string) => {
  try { return !!localStorage.getItem(`coach_${id}`); } catch { return true; }
};

interface CoachMarkProps {
  id: 'first_card' | 'first_details';
  text: string;
  className?: string;
}

const CoachMark = ({ id, text, className = '' }: CoachMarkProps) => {
  const [visible, setVisible] = useState(() => !seen(id));
  if (!visible) return null;

  const dismiss = () => {
    try { localStorage.setItem(`coach_${id}`, new Date().toISOString()); } catch { /* storage blocked */ }
    setVisible(false);
  };

  return (
    <div role="status" className={`z-30 max-w-sm flex items-center gap-3 rounded-2xl bg-surface text-ink border border-line shadow-[0_12px_30px_rgb(var(--shadow)/0.16)] pl-4 pr-2 py-1 animate-fade-in ${className}`}>
      <p className="flex-1 text-left text-[0.8125rem] font-medium leading-snug">{text}</p>
      <button onClick={dismiss} className="flex-shrink-0 min-h-[44px] min-w-[44px] px-2 whitespace-nowrap text-sm font-semibold text-primary">
        Got it
      </button>
    </div>
  );
};

export default CoachMark;
