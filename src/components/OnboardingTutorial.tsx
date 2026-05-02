import { useState, useEffect } from 'react';
import { Heart, Sparkles, ChevronRight, X, RotateCcw, Home, User, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TUTORIAL_KEY = 'stockmatch_onboarding_v2';

// ─── Animated demos ──────────────────────────────────────────────────────────

const KEYFRAMES = `
  /* Step 1 – swipe right */
  @keyframes ob-card {
    0%,10%       { transform: translateX(0) rotate(0deg); opacity:1; }
    55%          { transform: translateX(95px) rotate(10deg); opacity:1; }
    65%,75%      { transform: translateX(110px) rotate(13deg); opacity:0; }
    76%          { transform: translateX(0) rotate(0deg); opacity:0; }
    88%,100%     { transform: translateX(0) rotate(0deg); opacity:1; }
  }
  @keyframes ob-like {
    0%,40%       { opacity:0; transform:scale(0.85); }
    52%,65%      { opacity:1; transform:scale(1); }
    74%,100%     { opacity:0; }
  }
  @keyframes ob-swipe-finger {
    0%,8%        { transform:translateX(-28px); opacity:0; }
    18%          { transform:translateX(-28px); opacity:1; }
    58%          { transform:translateX(82px); opacity:1; }
    68%,100%     { transform:translateX(82px); opacity:0; }
  }
  @keyframes ob-trail {
    0%,18%       { width:0; opacity:0.4; left:calc(50% - 28px); }
    58%          { width:110px; opacity:0.25; }
    68%,100%     { width:0; opacity:0; }
  }

  /* Step 2 – button tap */
  @keyframes ob-tap-finger {
    0%,18%       { transform:translateY(0); opacity:0; }
    28%          { transform:translateY(0); opacity:1; }
    43%          { transform:translateY(5px) scale(0.88); opacity:1; }
    58%          { transform:translateY(0) scale(1); opacity:1; }
    72%,100%     { transform:translateY(0); opacity:0; }
  }
  @keyframes ob-btn-glow {
    0%,35%       { box-shadow:0 0 0 0 rgba(34,197,94,0); transform:scale(1); }
    48%,58%      { box-shadow:0 0 0 10px rgba(34,197,94,0.35), 0 0 22px rgba(34,197,94,0.55); transform:scale(1.18); }
    72%,100%     { box-shadow:0 0 0 0 rgba(34,197,94,0); transform:scale(1); }
  }
  @keyframes ob-ripple {
    0%,38%       { transform:scale(0); opacity:0.5; }
    42%          { transform:scale(0.05); opacity:0.4; }
    72%          { transform:scale(3); opacity:0; }
    100%         { transform:scale(3); opacity:0; }
  }

  /* Step 3 – AI tap */
  @keyframes ob-ai-finger {
    0%,20%       { transform:translateY(0); opacity:0; }
    32%          { transform:translateY(0); opacity:1; }
    46%          { transform:translateY(5px) scale(0.88); opacity:1; }
    60%          { transform:translateY(0) scale(1); opacity:1; }
    74%,100%     { opacity:0; }
  }
  @keyframes ob-ai-glow {
    0%,40%       { box-shadow:0 0 0 0 rgba(139,92,246,0); }
    52%,62%      { box-shadow:0 0 0 10px rgba(139,92,246,0.4), 0 0 24px rgba(99,102,241,0.6); }
    76%,100%     { box-shadow:0 0 0 0 rgba(139,92,246,0); }
  }
  @keyframes ob-bubble {
    0%,50%       { opacity:0; transform:translateY(10px) scale(0.9); }
    64%,86%      { opacity:1; transform:translateY(0) scale(1); }
    96%,100%     { opacity:0; }
  }

  /* Step 4 – Likes tab */
  @keyframes ob-nav-finger {
    0%,20%       { transform:translateY(0); opacity:0; }
    30%          { transform:translateY(0); opacity:1; }
    44%          { transform:translateY(4px) scale(0.88); opacity:1; }
    57%          { transform:translateY(0) scale(1); opacity:1; }
    70%,100%     { opacity:0; }
  }
  @keyframes ob-tab-activate {
    0%,48%       { color:rgba(255,255,255,0.35); }
    60%,100%     { color:rgb(139,92,246); }
  }
  @keyframes ob-badge-pop {
    0%,52%       { transform:scale(0); opacity:0; }
    66%          { transform:scale(1.4); opacity:1; }
    76%,100%     { transform:scale(1); opacity:1; }
  }
`;

// Reusable touch-point cursor
const Finger = ({ style }: { style: React.CSSProperties }) => (
  <div
    className="pointer-events-none absolute z-20 flex items-center justify-center"
    style={style}
  >
    <div className="w-9 h-9 rounded-full bg-white/95 shadow-xl border border-white/60 flex items-center justify-center text-[18px] select-none">
      👆
    </div>
  </div>
);

// Step 1: Swipe demo
function SwipeDemo() {
  return (
    <div className="relative flex items-center justify-center h-44 overflow-hidden select-none">
      {/* Stack background cards */}
      <div className="absolute w-52 h-28 rounded-2xl bg-white/10" style={{ transform: 'scale(0.90) translateY(6px)' }} />
      <div className="absolute w-52 h-28 rounded-2xl bg-white/15" style={{ transform: 'scale(0.95) translateY(3px)' }} />

      {/* Swipe trail */}
      <div
        className="absolute rounded-full bg-white pointer-events-none"
        style={{
          height: 3,
          top: 'calc(50% - 1.5px)',
          animation: 'ob-trail 3s ease-in-out infinite',
        }}
      />

      {/* Active card */}
      <div
        className="absolute w-52 h-28 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 shadow-xl p-4 overflow-hidden"
        style={{ animation: 'ob-card 3s ease-in-out infinite' }}
      >
        <div className="flex justify-between items-start">
          <div>
            <p className="text-white font-bold text-lg leading-none">AAPL</p>
            <p className="text-white/80 text-xs mt-0.5">Apple Inc.</p>
          </div>
          <span className="text-xs font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full">LOW</span>
        </div>
        <p className="text-green-100 text-sm mt-2 font-medium">+18.3% this year</p>

        {/* LIKED overlay */}
        <div
          className="absolute inset-0 rounded-2xl bg-blue-500/90 flex items-center justify-center gap-2"
          style={{ animation: 'ob-like 3s ease-in-out infinite', opacity: 0 }}
        >
          <Heart className="w-7 h-7 text-white fill-white" />
          <span className="text-white font-bold text-xl tracking-wide">LIKED!</span>
        </div>
      </div>

      {/* Finger */}
      <Finger style={{
        bottom: 12,
        left: 'calc(50% - 18px)',
        animation: 'ob-swipe-finger 3s ease-in-out infinite',
      }} />
    </div>
  );
}

// Step 2: Button tap demo
function ButtonDemo() {
  return (
    <div className="relative flex flex-col items-center justify-center h-44 gap-6 select-none">
      {/* Button row */}
      <div className="flex items-center gap-6">
        <div className="w-14 h-14 rounded-full bg-red-500/80 flex items-center justify-center shadow-lg">
          <X className="w-7 h-7 text-white" />
        </div>
        <div className="w-11 h-11 rounded-full bg-gray-500/70 flex items-center justify-center shadow-md">
          <RotateCcw className="w-5 h-5 text-white" />
        </div>
        {/* Heart button — animates on tap */}
        <div className="relative">
          <div
            className="w-14 h-14 rounded-full bg-green-500/80 flex items-center justify-center shadow-lg"
            style={{ animation: 'ob-btn-glow 3s ease-in-out infinite' }}
          >
            <Heart className="w-7 h-7 text-white" />
          </div>
          {/* Ripple */}
          <div
            className="absolute inset-0 rounded-full border-2 border-green-400/60 pointer-events-none"
            style={{ animation: 'ob-ripple 3s ease-in-out infinite' }}
          />
        </div>
      </div>

      {/* Instruction label */}
      <p className="text-white/50 text-xs">Tap ♥ to like · Tap ✕ to pass</p>

      {/* Finger */}
      <Finger style={{
        bottom: 36,
        right: 'calc(50% - 68px)',
        animation: 'ob-tap-finger 3s ease-in-out infinite',
      }} />
    </div>
  );
}

// Step 3: AI tap demo
function AIDemo() {
  return (
    <div className="relative flex flex-col items-center justify-center h-44 gap-4 select-none">
      {/* AI pill button */}
      <div className="relative">
        <div
          className="flex items-center gap-2 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-5 shadow-xl"
          style={{ animation: 'ob-ai-glow 3s ease-in-out infinite' }}
        >
          <Sparkles className="h-5 w-5 text-white" />
          <span className="text-white font-semibold text-sm">Ask AI</span>
        </div>
      </div>

      {/* Chat bubble response */}
      <div
        className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl rounded-bl-sm px-4 py-2.5 max-w-[200px]"
        style={{ animation: 'ob-bubble 3s ease-in-out infinite', opacity: 0 }}
      >
        <p className="text-white text-xs leading-relaxed">
          NVDA has strong AI growth momentum with a 180% 1Y return...
        </p>
      </div>

      {/* Finger */}
      <Finger style={{
        top: 28,
        left: 'calc(50% + 10px)',
        animation: 'ob-ai-finger 3s ease-in-out infinite',
      }} />
    </div>
  );
}

// Step 4: Likes tab demo
function LikesDemo() {
  return (
    <div className="relative flex flex-col items-center justify-center h-44 gap-4 select-none">
      {/* Mock bottom nav */}
      <div className="flex items-center justify-around bg-black/70 backdrop-blur-xl border border-white/10 rounded-2xl w-64 py-3 px-4">
        {/* Match tab */}
        <div className="flex flex-col items-center gap-0.5 opacity-40">
          <Home className="w-5 h-5 text-white" />
          <span className="text-[9px] text-white font-semibold">Match</span>
        </div>

        {/* Likes tab — activates */}
        <div
          className="flex flex-col items-center gap-0.5 relative"
          style={{ animation: 'ob-tab-activate 3s ease-in-out infinite' }}
        >
          <div className="relative">
            <Heart className="w-5 h-5 fill-current" />
            {/* Badge */}
            <div
              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-pink-500 text-white text-[9px] font-bold flex items-center justify-center"
              style={{ animation: 'ob-badge-pop 3s ease-in-out infinite', transform: 'scale(0)', opacity: 0 }}
            >
              3
            </div>
          </div>
          <span className="text-[9px] font-semibold">Likes</span>
        </div>

        {/* Profile tab */}
        <div className="flex flex-col items-center gap-0.5 opacity-40">
          <User className="w-5 h-5 text-white" />
          <span className="text-[9px] text-white font-semibold">Profile</span>
        </div>
      </div>

      <p className="text-white/50 text-xs">Your saved stocks live here</p>

      {/* Finger */}
      <Finger style={{
        top: 30,
        left: 'calc(50% - 4px)',
        animation: 'ob-nav-finger 3s ease-in-out infinite',
      }} />
    </div>
  );
}

// ─── Step metadata ────────────────────────────────────────────────────────────

const STEPS = [
  {
    Demo: SwipeDemo,
    bgFrom: 'from-emerald-500/20',
    bgTo: 'to-green-600/10',
    title: 'Swipe to Discover',
    description: 'Swipe right to like a stock and save it to your watchlist. Swipe left to pass.',
  },
  {
    Demo: ButtonDemo,
    bgFrom: 'from-rose-500/20',
    bgTo: 'to-pink-600/10',
    title: 'Prefer Tapping?',
    description: 'Use the heart button to like, X to pass, or tap the card itself to read the full breakdown.',
  },
  {
    Demo: AIDemo,
    bgFrom: 'from-blue-500/20',
    bgTo: 'to-purple-600/10',
    title: 'Your AI Analyst',
    description: 'Tap Ask AI to get instant real-time answers about any stock — data fetched live.',
  },
  {
    Demo: LikesDemo,
    bgFrom: 'from-amber-500/20',
    bgTo: 'to-orange-600/10',
    title: 'Review Your Likes',
    description: 'Every stock you like is saved to the Likes tab, ready to review and compare any time.',
  },
];

// ─── Main component ───────────────────────────────────────────────────────────

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
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      dismiss();
    }
  };

  if (!visible) return null;

  const { Demo, bgFrom, bgTo, title, description } = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <>
      <style>{KEYFRAMES}</style>

      <div className="fixed inset-0 z-[70] flex flex-col justify-end">
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/65 backdrop-blur-sm transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}
          onClick={dismiss}
        />

        {/* Sheet */}
        <div
          className={`relative bg-background rounded-t-3xl shadow-2xl overflow-hidden transition-transform duration-300 ease-out ${
            mounted ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          {/* Demo area with gradient background */}
          <div key={step} className={`bg-gradient-to-br ${bgFrom} ${bgTo} relative`}>
            {/* Skip */}
            <button
              onClick={dismiss}
              className="absolute top-3 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
              aria-label="Skip tutorial"
            >
              <X className="w-4 h-4" />
            </button>
            <Demo />
          </div>

          {/* Content */}
          <div className="px-6 pt-5 pb-8">
            <h2 className="text-xl font-bold mb-1.5">{title}</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>

            {/* Progress dots */}
            <div className="flex gap-2 mt-5 mb-5">
              {STEPS.map((_, i) => (
                <button key={i} onClick={() => setStep(i)}>
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === step ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/25'
                    }`}
                  />
                </button>
              ))}
            </div>

            <Button onClick={next} className="w-full h-12 rounded-xl text-base font-semibold">
              {isLast ? (
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Start Swiping
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Next <ChevronRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
