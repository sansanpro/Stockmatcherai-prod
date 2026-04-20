import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { trackRegistration } from '@/lib/metaPixel';

// Onboarding step types
type OnboardingStep = 'welcome' | 'style' | 'interests' | 'goal' | 'account' | 'signin';

interface OnboardingAnswers {
  style: string;
  interests: string[];
  goal: string;
}

const STYLES = [
  { id: 'low', emoji: '🛡️', label: 'Safe & Steady', desc: 'I sleep better with stable returns' },
  { id: 'medium', emoji: '⚖️', label: 'Balanced', desc: 'Some risk is fine for better returns' },
  { id: 'high', emoji: '🚀', label: 'Let it ride', desc: 'High risk, high reward — all in' },
];

const INTERESTS = [
  { id: 'technology', label: 'Tech' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'finance', label: 'Finance' },
  { id: 'energy', label: 'Energy' },
  { id: 'consumer', label: 'Consumer' },
  { id: 'any', label: 'Everything' },
];

const GOALS = [
  { id: 'growth', emoji: '📈', label: 'Grow wealth', desc: 'Long-term capital appreciation' },
  { id: 'income', emoji: '💸', label: 'Side income', desc: 'Dividends and steady cash flow' },
  { id: 'balance', emoji: '🎯', label: 'Stay balanced', desc: 'Mix of growth and income' },
  { id: 'none', emoji: '🎓', label: 'Just learning', desc: "I'm new to this — teach me" },
];

const STEP_ORDER: OnboardingStep[] = ['welcome', 'style', 'interests', 'goal', 'account'];

const Auth = () => {
  const { user, signIn, signUp, resetPassword, loading } = useAuth();
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [answers, setAnswers] = useState<OnboardingAnswers>({ style: '', interests: [], goal: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (user && !loading) return <Navigate to="/app" replace />;

  if (loading) {
    return (
      <div className="dark min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary" />
      </div>
    );
  }

  const currentStepIndex = STEP_ORDER.indexOf(step);
  const progressSteps = STEP_ORDER.filter(s => s !== 'welcome');
  const progressIndex = progressSteps.indexOf(step);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const data = new FormData(e.currentTarget);
    await signIn(data.get('email') as string, data.get('password') as string);
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const data = new FormData(e.currentTarget);
    // Store onboarding answers so profile form can pre-populate
    localStorage.setItem('onboarding_answers', JSON.stringify(answers));
    await signUp(data.get('email') as string, data.get('password') as string, data.get('fullName') as string);
    trackRegistration('email');
    setIsLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const data = new FormData(e.currentTarget);
    await resetPassword(data.get('email') as string);
    setIsLoading(false);
  };

  const toggleInterest = (id: string) => {
    setAnswers(prev => ({
      ...prev,
      interests: prev.interests.includes(id)
        ? prev.interests.filter(i => i !== id)
        : [...prev.interests, id],
    }));
  };

  const canAdvance = () => {
    if (step === 'style') return !!answers.style;
    if (step === 'interests') return answers.interests.length > 0;
    if (step === 'goal') return !!answers.goal;
    return true;
  };

  const advance = () => {
    const idx = STEP_ORDER.indexOf(step);
    if (idx < STEP_ORDER.length - 1) setStep(STEP_ORDER[idx + 1]);
  };

  const back = () => {
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) setStep(STEP_ORDER[idx - 1]);
    else if (step === 'signin') setStep('welcome');
  };

  // ── WELCOME ──────────────────────────────────────────────────────────────
  if (step === 'welcome') {
    return (
      <div className="dark min-h-screen bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-primary to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/30 mb-8 animate-bounce">
          <span className="text-5xl">📈</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-3 leading-tight">
          Find stocks you'll<br />actually love
        </h1>
        <p className="text-gray-400 text-lg mb-2">It's like Tinder — but for your portfolio.</p>
        <p className="text-gray-500 text-sm mb-10">Swipe right on winners. AI does the research.</p>

        <div className="w-full max-w-sm space-y-3">
          <Button
            onClick={advance}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/30 rounded-2xl"
          >
            Get Started ✨
          </Button>
          <button
            onClick={() => setStep('signin')}
            className="w-full h-12 text-gray-400 hover:text-white transition-colors text-sm"
          >
            Already have an account? <span className="text-primary font-medium">Sign in →</span>
          </button>
        </div>

        <p className="text-xs text-gray-600 mt-8 max-w-xs">
          By continuing, you agree to our{' '}
          <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
          {' '}and Privacy Policy.
        </p>
      </div>
    );
  }

  // ── SIGN IN ───────────────────────────────────────────────────────────────
  if (step === 'signin') {
    return (
      <div className="dark min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col p-6 pt-[env(safe-area-inset-top)]">
        <button onClick={back} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 mt-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
          <h2 className="text-3xl font-bold text-white mb-2">Welcome back 👋</h2>
          <p className="text-gray-400 mb-8">Sign in to see your matches.</p>

          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signin-email" className="text-gray-300 text-sm">Email</Label>
              <Input id="signin-email" name="email" type="email" placeholder="you@example.com" required
                className="h-12 bg-gray-800/60 border-gray-700 text-white placeholder:text-gray-500 focus:border-primary rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signin-password" className="text-gray-300 text-sm">Password</Label>
              <div className="relative">
                <Input id="signin-password" name="password" type={showPassword ? 'text' : 'password'}
                  placeholder="Your password" required
                  className="h-12 bg-gray-800/60 border-gray-700 text-white placeholder:text-gray-500 focus:border-primary rounded-xl pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-primary transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-primary to-purple-600 rounded-xl text-base font-semibold mt-2">
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <button onClick={() => setShowReset(!showReset)}
            className="text-primary text-sm mt-4 hover:underline text-left">
            Forgot your password?
          </button>

          {showReset && (
            <form onSubmit={handleResetPassword} className="mt-4 space-y-3">
              <Input name="email" type="email" placeholder="Enter your email" required
                className="h-12 bg-gray-800/60 border-gray-700 text-white placeholder:text-gray-500 rounded-xl" />
              <Button type="submit" variant="outline" disabled={isLoading}
                className="w-full h-11 border-gray-600 text-white hover:bg-gray-800 rounded-xl">
                {isLoading ? 'Sending...' : 'Send Reset Email'}
              </Button>
            </form>
          )}

          <p className="text-center text-gray-500 text-sm mt-8">
            Don't have an account?{' '}
            <button onClick={() => setStep('welcome')} className="text-primary hover:underline font-medium">
              Get started →
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ── ONBOARDING STEPS (style / interests / goal / account) ─────────────────
  return (
    <div className="dark min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col p-6 pt-[env(safe-area-inset-top)]">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 mt-2">
        <button onClick={back} className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        {/* Progress dots */}
        <div className="flex gap-2 flex-1 justify-center">
          {progressSteps.map((s, i) => (
            <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${
              i < progressIndex ? 'bg-primary w-6' :
              i === progressIndex ? 'bg-primary w-8' : 'bg-gray-700 w-4'
            }`} />
          ))}
        </div>
        <div className="w-5" /> {/* spacer */}
      </div>

      <div className="flex-1 flex flex-col">
        {/* STYLE */}
        {step === 'style' && (
          <>
            <h2 className="text-3xl font-bold text-white mb-2">What's your vibe?</h2>
            <p className="text-gray-400 mb-8">We'll match you with stocks that suit your style.</p>
            <div className="space-y-3 flex-1">
              {STYLES.map(s => (
                <button key={s.id} onClick={() => setAnswers(prev => ({ ...prev, style: s.id }))}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all duration-200 flex items-center gap-4 ${
                    answers.style === s.id
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-700 bg-gray-800/40 hover:border-gray-500'
                  }`}>
                  <span className="text-3xl">{s.emoji}</span>
                  <div>
                    <div className="text-white font-semibold">{s.label}</div>
                    <div className="text-gray-400 text-sm">{s.desc}</div>
                  </div>
                  {answers.style === s.id && (
                    <div className="ml-auto w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        {/* INTERESTS */}
        {step === 'interests' && (
          <>
            <h2 className="text-3xl font-bold text-white mb-2">What excites you?</h2>
            <p className="text-gray-400 mb-8">Pick the sectors you're into. Tap as many as you want.</p>
            <div className="flex flex-wrap gap-3 flex-1 content-start">
              {INTERESTS.map(i => {
                const selected = answers.interests.includes(i.id);
                return (
                  <button key={i.id} onClick={() => toggleInterest(i.id)}
                    className={`px-5 py-3 rounded-full border-2 text-sm font-medium transition-all duration-200 ${
                      selected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-700 bg-gray-800/40 text-gray-300 hover:border-gray-500'
                    }`}>
                    {selected && '✓ '}{i.label}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* GOAL */}
        {step === 'goal' && (
          <>
            <h2 className="text-3xl font-bold text-white mb-2">What's the plan?</h2>
            <p className="text-gray-400 mb-8">Your goal shapes every recommendation we make.</p>
            <div className="space-y-3 flex-1">
              {GOALS.map(g => (
                <button key={g.id} onClick={() => setAnswers(prev => ({ ...prev, goal: g.id }))}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all duration-200 flex items-center gap-4 ${
                    answers.goal === g.id
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-700 bg-gray-800/40 hover:border-gray-500'
                  }`}>
                  <span className="text-3xl">{g.emoji}</span>
                  <div>
                    <div className="text-white font-semibold">{g.label}</div>
                    <div className="text-gray-400 text-sm">{g.desc}</div>
                  </div>
                  {answers.goal === g.id && (
                    <div className="ml-auto w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        {/* ACCOUNT CREATION */}
        {step === 'account' && (
          <>
            <h2 className="text-3xl font-bold text-white mb-2">Almost there! 🎉</h2>
            <p className="text-gray-400 mb-8">Create your account to save your matches.</p>
            <form onSubmit={handleSignUp} className="space-y-4 flex-1">
              <div className="space-y-2">
                <Label htmlFor="signup-name" className="text-gray-300 text-sm">First name</Label>
                <Input id="signup-name" name="fullName" type="text" placeholder="What should we call you?" required
                  className="h-12 bg-gray-800/60 border-gray-700 text-white placeholder:text-gray-500 focus:border-primary rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-gray-300 text-sm">Email</Label>
                <Input id="signup-email" name="email" type="email" placeholder="you@example.com" required
                  className="h-12 bg-gray-800/60 border-gray-700 text-white placeholder:text-gray-500 focus:border-primary rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-gray-300 text-sm">Password</Label>
                <div className="relative">
                  <Input id="signup-password" name="password" type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 6 characters" required minLength={6}
                    className="h-12 bg-gray-800/60 border-gray-700 text-white placeholder:text-gray-500 focus:border-primary rounded-xl pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-primary transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-primary to-purple-600 rounded-xl text-base font-semibold mt-2">
                {isLoading ? 'Creating account...' : 'Find My Matches 🚀'}
              </Button>
            </form>
            <p className="text-center text-gray-500 text-sm mt-4">
              Already have an account?{' '}
              <button onClick={() => setStep('signin')} className="text-primary hover:underline font-medium">
                Sign in →
              </button>
            </p>
          </>
        )}

        {/* Next button (not shown on account step — form has its own submit) */}
        {step !== 'account' && (
          <Button onClick={advance} disabled={!canAdvance()}
            className="w-full h-13 mt-6 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 rounded-2xl text-base font-semibold disabled:opacity-40 flex items-center justify-center gap-2">
            Continue <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default Auth;
