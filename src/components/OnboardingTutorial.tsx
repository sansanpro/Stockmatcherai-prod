import { useState, useEffect } from 'react';
import { Heart, Sparkles, ChevronRight, X, TrendingUp, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TUTORIAL_KEY = 'stockmatch_onboarding_v1';

const steps = [
  {
    Icon: TrendingUp,
    gradient: 'from-pink-500 to-rose-600',
    title: 'Swipe to Discover',
    description: 'Swipe right on a stock card to like it and save it to your watchlist. Swipe left to pass.',
    hint: null,
  },
  {
    Icon: Heart,
    gradient: 'from-purple-500 to-indigo-600',
    title: 'Buttons Work Too',
    description: 'Use the X and heart buttons at the bottom to pass or like. Tap a card directly to see the full company breakdown.',
    hint: null,
  },
  {
    Icon: Sparkles,
    gradient: 'from-blue-500 to-cyan-500',
    title: 'Your AI Stock Analyst',
    description: 'Tap the glowing "Ask AI" button any time to ask questions about stocks. It fetches real-time data and explains concepts in plain English.',
    hint: 'Look for the sparkles button in the bottom-right corner',
  },
  {
    Icon: Star,
    gradient: 'from-amber-400 to-orange-500',
    title: 'Review Your Likes',
    description: 'Every stock you swipe right on is saved to your Likes tab so you can review and compare them later.',
    hint: 'Tap the heart icon in the bottom navigation bar',
  },
];

export default function OnboardingTutorial() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem(TUTORIAL_KEY);
    if (!seen) {
      const t = setTimeout(() => {
        setVisible(true);
        setTimeout(() => setMounted(true), 30);
      }, 900);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    setMounted(false);
    setTimeout(() => {
      setVisible(false);
      localStorage.setItem(TUTORIAL_KEY, 'true');
    }, 350);
  };

  const next = () => {
    if (step < steps.length - 1) {
      setStep(s => s + 1);
    } else {
      dismiss();
    }
  };

  if (!visible) return null;

  const { Icon, gradient, title, description, hint } = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}
        onClick={dismiss}
      />

      {/* Bottom sheet */}
      <div
        className={`relative bg-background rounded-t-3xl px-6 pt-6 pb-10 shadow-2xl transition-transform duration-350 ease-out ${
          mounted ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Skip button */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 p-2 rounded-full text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Skip tutorial"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-5 shadow-lg`}>
          <Icon className="w-8 h-8 text-white" />
        </div>

        {/* Content */}
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
        {hint && (
          <p className="text-xs text-primary font-medium mt-3">{hint}</p>
        )}

        {/* Progress dots */}
        <div className="flex gap-2 mt-6 mb-5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/25'
              }`}
            />
          ))}
        </div>

        {/* CTA */}
        <Button onClick={next} className="w-full h-12 rounded-xl text-base font-semibold">
          {isLast ? 'Start Swiping' : (
            <span className="flex items-center gap-2">
              Next <ChevronRight className="w-4 h-4" />
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
