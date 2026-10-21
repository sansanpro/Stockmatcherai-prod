import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CausePicker from '@/components/onboarding/CausePicker';
import RevealScreen from '@/components/onboarding/RevealScreen';
import { ChipGroup, ChoiceList } from '@/components/onboarding/Choices';
import { fetchCauses, type CauseInfo } from '@/lib/matchFeed';
import {
  DEALBREAKERS, EXPERIENCE_OPTIONS, GOAL_OPTIONS, MOTIVATIONS, RISK_OPTIONS, STARTING_AMOUNTS,
  emptyAnswers, saveAnswers, type OnboardingAnswers,
} from '@/lib/onboarding';
import { requestTrackingOnce } from '@/lib/att';
import { track } from '@/lib/analytics';

type Step = 'hook' | 'intro' | 'why' | 'causes' | 'dealbreakers' | 'risk' | 'goal' | 'reveal';

// new: first launch, before any account. new_signed_in: signed in but never onboarded.
// causes_only: existing users from before values matching (causes and dealbreakers only).
export type OnboardingMode = 'new' | 'new_signed_in' | 'causes_only';

const STEPS: Record<OnboardingMode, Step[]> = {
  new: ['hook', 'why', 'causes', 'dealbreakers', 'risk', 'goal', 'reveal'],
  new_signed_in: ['why', 'causes', 'dealbreakers', 'risk', 'goal', 'reveal'],
  causes_only: ['intro', 'causes', 'dealbreakers'],
};
// Screens that show progress dots
const QUESTION_STEPS: Step[] = ['why', 'causes', 'dealbreakers', 'risk', 'goal'];

interface OnboardingFlowProps {
  mode: OnboardingMode;
  initial?: OnboardingAnswers | null;
  onComplete: (answers: OnboardingAnswers) => void | Promise<void>;
  onSignIn?: () => void;
}

const OnboardingFlow = ({ mode, initial, onComplete, onSignIn }: OnboardingFlowProps) => {
  const steps = STEPS[mode];
  const [step, setStep] = useState<Step>(steps[0]);
  const [answers, setAnswers] = useState<OnboardingAnswers>(() => ({ ...emptyAnswers(), ...initial }));
  const [causes, setCauses] = useState<CauseInfo[] | null>(null);
  const [causesError, setCausesError] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout>>();

  const loadCauses = () => {
    setCausesError(false);
    fetchCauses().then(setCauses).catch(() => setCausesError(true));
  };
  useEffect(loadCauses, []);

  useEffect(() => {
    if (mode !== 'new') track('onboarding_started', { version: 2, mode });
  }, [mode]);

  // Signed-out answers live on the device until there's an account to save them to
  useEffect(() => {
    if (mode === 'new') saveAnswers(answers);
  }, [answers, mode]);

  const update = (patch: Partial<OnboardingAnswers>) => setAnswers(prev => ({ ...prev, ...patch }));
  const index = steps.indexOf(step);

  const finish = async (final: OnboardingAnswers) => {
    setFinishing(true);
    try {
      await onComplete(final);
    } finally {
      setFinishing(false);
    }
  };

  const goTo = (next: Step) => {
    track('onboarding_step', { version: 2, mode, step: next });
    if (next === 'reveal') track('onboarding_complete', { version: 2, mode, causes: answers.causes, dealbreakers: answers.dealbreakers });
    setStep(next);
    window.scrollTo(0, 0);
  };

  const advance = () => {
    if (step === 'hook') track('onboarding_started', { version: 2, mode });
    const next = steps[index + 1];
    if (next) goTo(next);
    else finish(answers); // causes_only ends after dealbreakers
  };
  // One tap per answer: single-choice screens move on by themselves (a quick second tap
  // replaces the pending move instead of skipping a screen)
  const advanceSoon = () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => { advanceTimer.current = undefined; advance(); }, 220);
  };
  useEffect(() => () => { if (advanceTimer.current) clearTimeout(advanceTimer.current); }, []);

  const back = () => {
    if (index > 0) setStep(steps[index - 1]);
  };

  const pickedCauses = useMemo(
    () => answers.causes.map(id => causes?.find(c => c.id === id)).filter((c): c is CauseInfo => !!c),
    [answers.causes, causes],
  );

  const shell = (content: React.ReactNode, footer?: React.ReactNode) => {
    const questionIndex = QUESTION_STEPS.indexOf(step);
    return (
      <div className="dark min-h-[100dvh] bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900 flex flex-col px-6 pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <div className="flex items-center gap-4 h-11 mb-4">
          {index > 0 && step !== 'reveal' ? (
            <button onClick={back} aria-label="Back" className="w-11 h-11 -ml-2 flex items-center justify-center text-white/60 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : <div className="w-11" />}
          {questionIndex >= 0 && mode !== 'causes_only' && (
            <div className="flex gap-2 flex-1 justify-center" aria-hidden>
              {QUESTION_STEPS.map((s, i) => (
                <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${
                  i < questionIndex ? 'bg-primary w-6' : i === questionIndex ? 'bg-primary w-8' : 'bg-white/15 w-4'
                }`} />
              ))}
            </div>
          )}
          <div className="w-11" />
        </div>
        <div className="flex-1 flex flex-col max-w-md w-full mx-auto">{content}</div>
        {footer && <div className="max-w-md w-full mx-auto pt-4">{footer}</div>}
      </div>
    );
  };

  const continueButton = (label: string, enabled: boolean, onClick = advance) => (
    <Button
      onClick={onClick}
      disabled={!enabled || finishing}
      className="w-full h-14 text-base font-semibold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 rounded-2xl disabled:opacity-40 flex items-center justify-center gap-2"
    >
      {finishing ? 'Saving…' : <>{label} <ArrowRight className="w-4 h-4" /></>}
    </Button>
  );

  if (step === 'hook') {
    return (
      <div className="dark min-h-[100dvh] bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900 flex flex-col items-center justify-center px-6 text-center pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-[env(safe-area-inset-top)]">
        <div className="w-20 h-20 bg-gradient-to-br from-primary to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/30 mb-8">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-[2rem] font-bold text-white leading-tight max-w-sm">
          Your money is already saying something. Let's make it say what you believe.
        </h1>
        <p className="text-white/60 text-lg mt-4 max-w-sm">
          Find companies working on the things you care about. 60 seconds. No account needed.
        </p>
        <div className="w-full max-w-sm space-y-3 mt-10">
          <Button onClick={advance}
            className="w-full h-14 text-base font-semibold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 rounded-2xl shadow-lg shadow-primary/30">
            Find my matches
          </Button>
          {onSignIn && (
            <button onClick={onSignIn} className="w-full min-h-[48px] text-white/60 hover:text-white text-sm">
              I already have an account
            </button>
          )}
        </div>
        <p className="text-xs text-white/30 mt-8 max-w-xs">
          By continuing, you agree to our{' '}
          <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>{' '}and{' '}
          <a href="https://stockmatcherai.com/support" className="text-primary hover:underline">Privacy Policy</a>.
          Educational only, not investment advice.
        </p>
      </div>
    );
  }

  if (step === 'intro') {
    return shell(
      <div className="flex-1 flex flex-col justify-center text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white">New: match by what you care about.</h1>
        <p className="text-white/60 mt-3">
          Pick the causes you want your money to support, and your daily matches will follow them. It takes 20 seconds.
        </p>
      </div>,
      continueButton('Pick my causes', true),
    );
  }

  if (step === 'why') {
    return shell(
      <>
        <h1 className="text-3xl font-bold text-white mb-8">What's finally pushing you to start?</h1>
        <ChoiceList name="Motivation" options={MOTIVATIONS} value={answers.motivation}
          onSelect={id => { update({ motivation: id }); advanceSoon(); }} />
      </>,
    );
  }

  if (step === 'causes') {
    return shell(
      <>
        <h1 className="text-3xl font-bold text-white">What do you want your money to fight for?</h1>
        <p className="text-white/60 mt-2 mb-6">Pick up to 3. Your first pick matters most.</p>
        {causes ? (
          <>
            <CausePicker causes={causes} selected={answers.causes} onChange={c => update({ causes: c })} />
            <p className="text-white/40 text-xs text-center mt-4">More causes are on the way.</p>
          </>
        ) : causesError ? (
          <div className="text-center text-white/60 py-10">
            <p>We couldn't load the causes.</p>
            <button onClick={loadCauses} className="text-primary font-medium mt-2 min-h-[44px]">Try again</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3" aria-busy>
            {[0, 1, 2, 3].map(i => <div key={i} className="h-[150px] rounded-3xl bg-white/5 animate-pulse" />)}
          </div>
        )}
      </>,
      continueButton('Continue', answers.causes.length > 0),
    );
  }

  if (step === 'dealbreakers') {
    const toggle = (id: string) => update({
      dealbreakers: answers.dealbreakers.includes(id)
        ? answers.dealbreakers.filter(d => d !== id)
        : [...answers.dealbreakers, id],
    });
    const none = 'none';
    return shell(
      <>
        <h1 className="text-3xl font-bold text-white">Anything you'd never want your money to fund?</h1>
        <p className="text-white/60 mt-2 mb-6">Optional. Companies tied to these will never show up for you.</p>
        <ChipGroup
          name="Dealbreakers"
          multiple
          options={[...DEALBREAKERS, { id: none, label: 'None of these' }]}
          selected={answers.dealbreakers}
          onToggle={id => (id === none ? update({ dealbreakers: [] }) : toggle(id))}
        />
      </>,
      continueButton(
        mode === 'causes_only' ? 'Show my matches' : answers.dealbreakers.length ? 'Continue' : 'Skip',
        true,
      ),
    );
  }

  if (step === 'risk') {
    const both = (patch: Partial<OnboardingAnswers>) => {
      const next = { ...answers, ...patch };
      update(patch);
      if (next.risk && next.experience) advanceSoon();
    };
    return shell(
      <>
        <h1 className="text-3xl font-bold text-white mb-6">Imagine a company you own drops 20% in a month. What do you do?</h1>
        <ChoiceList name="If a stock drops 20%" options={RISK_OPTIONS} value={answers.risk} onSelect={id => both({ risk: id })} />
        <h2 className="text-lg font-semibold text-white mt-8 mb-3">Have you ever bought a stock?</h2>
        <ChipGroup name="Experience" options={EXPERIENCE_OPTIONS}
          selected={answers.experience ? [answers.experience] : []}
          onToggle={id => both({ experience: id })} />
      </>,
      continueButton('Continue', !!answers.risk && !!answers.experience),
    );
  }

  if (step === 'goal') {
    return shell(
      <>
        <h1 className="text-3xl font-bold text-white mb-6">What's this money for?</h1>
        <ChoiceList name="Goal" options={GOAL_OPTIONS} value={answers.goal} onSelect={id => update({ goal: id })} />
        <h2 className="text-lg font-semibold text-white mt-8 mb-3">Thinking of starting with: <span className="text-white/40 font-normal text-sm">(optional)</span></h2>
        <ChipGroup name="Starting amount" options={STARTING_AMOUNTS}
          selected={answers.startingAmount ? [answers.startingAmount] : []}
          onToggle={id => update({ startingAmount: answers.startingAmount === id ? undefined : id })} />
        {answers.startingAmount && (
          <p className="text-white/50 text-sm mt-4">
            Any amount works. Many brokers let you buy a slice of a share for as little as $5.
          </p>
        )}
      </>,
      continueButton('Continue', !!answers.goal),
    );
  }

  // Reveal
  return shell(
    <RevealScreen
      answers={answers}
      causes={pickedCauses}
      onContinue={async () => {
        await requestTrackingOnce();
        finish(answers);
      }}
    />,
  );
};

export default OnboardingFlow;
