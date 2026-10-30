import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import Disclaimer from '@/components/values/Disclaimer';
import heart3d from '@/assets/3d/red-heart.png';
import { haptic } from '@/lib/haptics';
import { purchaseTip, TIP_PRICE } from '@/lib/support';
import { track } from '@/lib/analytics';

interface SupportSheetProps {
  isOpen: boolean;
  onClose: () => void;
  // Where it was opened from, for analytics: Profile or the recap's last slide
  source: 'profile' | 'recap';
}

// The optional tip. Copy approved 2026-10-28: says plainly where the money goes (StockMatcherAI,
// not a charity), that it unlocks nothing, and offers an equal-weight way out.
export const TIP_COPY = {
  title: 'Help keep StockMatcherAI going',
  body: `StockMatcherAI is a small, independent app. A ${TIP_PRICE} tip helps pay for the research, data and servers that let us keep finding companies working on causes like yours. It goes to StockMatcherAI, not to a charity, and it doesn't unlock anything. Thank you for being here.`,
  thanks: "Thank you. You're helping more people find companies working on the causes they care about.",
};

const SupportSheet = ({ isOpen, onClose, source }: SupportSheetProps) => {
  const [state, setState] = useState<'ask' | 'paying' | 'thanks'>('ask');

  useEffect(() => {
    if (isOpen) { setState('ask'); track('tip_shown', { source }); }
  }, [isOpen, source]);

  const tip = async () => {
    setState('paying');
    track('tip_started', { source });
    try {
      await purchaseTip();
      haptic('success');
      track('tip_completed', { source });
      setState('thanks');
    } catch {
      setState('ask');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      {/* Above the full-screen recap (z-95) */}
      <DialogContent
        overlayClassName="z-[100]"
        className="z-[101] max-w-sm bg-surface border-support-line rounded-3xl duration-slow ease-out"
        // Focus the sheet itself, not the Tip button, so neither choice is pre-selected
        onOpenAutoFocus={(e) => { e.preventDefault(); (e.currentTarget as HTMLElement).focus(); }}
      >
        {state === 'thanks' ? (
          <div className="text-center pt-4 pb-2">
            <div className="relative mx-auto w-24 h-24 mb-5">
              <span aria-hidden className="support-bloom absolute inset-0 rounded-full" />
              <img src={heart3d} alt="" aria-hidden className="relative w-24 h-24" />
            </div>
            <DialogTitle className="text-2xl font-bold text-ink">Thank you</DialogTitle>
            <DialogDescription className="text-ink-soft text-[1.0625rem] mt-2 leading-snug">{TIP_COPY.thanks}</DialogDescription>
            <button onClick={onClose} className="mt-7 w-full h-12 rounded-xl bg-support hover:bg-support/90 text-primary-foreground font-semibold">
              Done
            </button>
          </div>
        ) : (
          <div className="text-center pt-2">
            <img src={heart3d} alt="" aria-hidden className="mx-auto w-16 h-16 mb-4" />
            <DialogTitle className="text-2xl font-bold text-ink leading-tight">{TIP_COPY.title}</DialogTitle>
            <DialogDescription className="text-ink text-[0.9375rem] mt-3 leading-snug text-left">{TIP_COPY.body}</DialogDescription>
            <div className="mt-6 space-y-3">
              <button onClick={tip} disabled={state === 'paying'}
                className="w-full h-12 rounded-xl bg-support hover:bg-support/90 text-primary-foreground font-semibold disabled:opacity-70">
                {state === 'paying' ? 'One moment…' : `Tip ${TIP_PRICE}`}
              </button>
              <button onClick={onClose} className="w-full h-12 rounded-xl border border-line bg-surface text-ink font-semibold hover:bg-surface-2">
                Not now
              </button>
            </div>
            <p className="text-xs text-ink-soft mt-4">A one-time In-App Purchase through your Apple ID.</p>
          </div>
        )}
        <Disclaimer className="pt-1" />
      </DialogContent>
    </Dialog>
  );
};

export default SupportSheet;
