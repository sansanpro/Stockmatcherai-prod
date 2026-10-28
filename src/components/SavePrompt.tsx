import { useEffect, useState } from 'react';
import heart3d from '@/assets/3d/red-heart.png';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { track } from '@/lib/analytics';

// Account creation at the moment of value: after the first like, and again (to keep the list)
// at the third. Likes stay on the device until then.
export const FREE_LIKES_WITHOUT_ACCOUNT = 3;

interface SavePromptProps {
  open: boolean;
  likes: number;
  onClose: () => void;
  reason?: 'save' | 'ai'; // ai: opened from the Ask AI button
}

export const AppleIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={`${className} fill-current`} xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
  </svg>
);

const SavePrompt = ({ open, likes, onClose, reason = 'save' }: SavePromptProps) => {
  const { signInWithApple } = useAuth();
  const navigate = useNavigate();
  const [appleLoading, setAppleLoading] = useState(false);
  const required = reason === 'save' && likes >= FREE_LIKES_WITHOUT_ACCOUNT;

  useEffect(() => {
    if (open) track('save_prompt_shown', { likes, required, reason });
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const act = (action: 'apple' | 'email' | 'dismiss') => track('save_prompt_action', { action, likes, required });

  const apple = async () => {
    act('apple');
    setAppleLoading(true);
    await signInWithApple(); // signing in moves the device's answers and likes to the account
    setAppleLoading(false);
  };

  return (
    <Sheet open={open} onOpenChange={o => { if (!o) { act('dismiss'); onClose(); } }}>
      <SheetContent side="bottom" className="rounded-t-3xl border-line bg-cream text-ink px-6 pt-8 pb-[max(env(safe-area-inset-bottom),1.5rem)]">
        <div className="max-w-md mx-auto">
          <img src={heart3d} alt="" aria-hidden className="w-14 h-14 mb-3 art-3d-pop drop-shadow-[0_8px_10px_rgb(var(--primary-deep)/0.2)]" />
          <SheetTitle className="text-2xl font-bold text-ink">
            {reason === 'ai' ? 'Ask AI with a free account' : required ? 'Keep your matches' : 'Save your matches?'}
          </SheetTitle>
          <SheetDescription className="text-ink-soft mt-2 text-base">
            {reason === 'ai'
              ? 'Ask what a company does, how it connects to your causes, or what a number means. Free accounts get 5 questions a day, and your likes come with you.'
              : required
                ? `You've liked ${likes} companies. Create a free account to keep them all and get tomorrow's matches.`
                : 'Create a free account so your likes and causes are saved on any device.'}
          </SheetDescription>
          <div className="space-y-3 mt-6">
            <button
              onClick={apple}
              disabled={appleLoading}
              className="w-full h-14 bg-black hover:bg-black/85 text-white font-semibold rounded-2xl flex items-center justify-center gap-3 disabled:opacity-60"
            >
              {appleLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <AppleIcon />}
              Continue with Apple
            </button>
            <button
              onClick={() => { act('email'); navigate('/auth?mode=save'); }}
              className="w-full h-14 rounded-2xl border border-line bg-white text-ink font-semibold hover:bg-sand"
            >
              Use email
            </button>
            <button
              onClick={() => { act('dismiss'); onClose(); }}
              className="w-full min-h-[44px] text-ink-soft hover:text-ink text-sm"
            >
              {required ? 'Keep swiping without saving' : 'Not now'}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SavePrompt;
