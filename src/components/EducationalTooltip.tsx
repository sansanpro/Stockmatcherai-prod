import { HelpCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface EducationalTooltipProps {
  content: string;
  className?: string;
  label?: string;
}

// A plain-English explanation behind a "?" button. A popover rather than a hover tooltip, so it
// opens on tap on phones. Drawn above sheets and dialogs (z-[80]/[81]).
const EducationalTooltip = ({ content, className = '', label = 'What does this mean?' }: EducationalTooltipProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className={`ml-1 text-ink-muted hover:text-ink-soft ${className}`}
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" className="z-[90] w-auto max-w-[min(18rem,85vw)] p-3 text-sm leading-snug">
        {content}
      </PopoverContent>
    </Popover>
  );
};

export default EducationalTooltip;
