import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Art3D from '@/components/onboarding/Art3D';
import CausePicker from '@/components/onboarding/CausePicker';
import RevealScreen from '@/components/onboarding/RevealScreen';
import { ChipGroup, ChoiceList } from '@/components/onboarding/Choices';
import { fetchCauses, type CauseInfo } from '@/lib/matchFeed';
import {
  DEALBREAKERS, EXPERIENCE_OPTIONS, GOAL_OPTIONS, RISK_OPTIONS,
  emptyAnswers, saveAnswers, type OnboardingAnswers,
} from '@/lib/onboarding';
import { STEP_ART } from '@/lib/art';
import { requestTrackingOnce } from '@/lib/att';
import { track } from '@/lib/analytics';

type Step = 'hook' | 'intro' | 'causes' | 'dealbreakers' | 'risk' | 'experience' | 'goal' | 'reveal';

// new: first launch, before any account. new_signed_in: signed in but never onboarded.
// causes_only: existing users from before values matching (causes and dealbreakers only).
export type OnboardingMode = 'new' | 'new_signed_in' | 'causes_only';

const STEPS: Record<OnboardingMode, Step[]> = {
  new: ['hook', 'causes', 'dealbreakers', 'risk', 'experience', 'goal', 'reveal'],
  new_signed_in: ['causes', 'dealbreakers', 'risk', 'experience', 'goal', 'reveal'],
  causes_only: ['intro', 'causes', 'dealbreakers'],
};
// One question per screen; these show the progress bar
const QUESTION_STEPS: Step[] = ['causes', 'dealbreakers', 'risk', 'experience', 'goal'];

// Cream with a warm glow behind the art
const BACKDROP = 'bg-daybreak';
const PRIMARY_BUTTON = 'w-full h-14 text-[1.0625rem] font-semibold rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-brand/25 disabled:opacity-40 disabled:shadow-none flex items-center justify-center gap-2';

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
  // One tap per answer: single-choice screens move on by themselves, after the check shows
  // (a quick second tap replaces the pending move instead of skipping a screen)
  const advanceSoon = () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => { advanceTimer.current = undefined; advance(); }, 280);
  };
  useEffect(() => () => { if (advanceTimer.current) clearTimeout(advanceTimer.current); }, []);

  const back = () => {
    if (index > 0) setStep(steps[index - 1]);
  };

  const pickedCauses = useMemo(
    () => answers.causes.map(id => causes?.find(c => c.id === id)).filter((c): c is CauseInfo => !!c),
    [answers.causes, causes],
  );

  // Header (back + progress), the screen's content centered in the space left, and an optional
  // footer pinned to the bottom. Content scrolls on short phones; it remounts per step, which
  // replays the entrance animations.
  const shell = (content: React.ReactNode, footer?: React.ReactNode) => {
    const questionIndex = QUESTION_STEPS.indexOf(step);
    return (
      <div className={`h-[100dvh] ${BACKDROP} flex flex-col px-6 pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-[calc(env(safe-area-inset-top)+0.75rem)]`}>
        <div className="flex items-center gap-4 h-11 flex-shrink-0">
          {index > 0 && step !== 'reveal' ? (
            <button onClick={back} aria-label="Back" className="w-11 h-11 -ml-2 flex items-center justify-center rounded-full text-ink-soft hover:text-ink hover:bg-sand">
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : <div className="w-11" />}
          {questionIndex >= 0 && mode !== 'causes_only' && (
            <div className="flex gap-1.5 flex-1 justify-center" aria-hidden>
              {QUESTION_STEPS.map((s, i) => (
                <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${
                  i <= questionIndex ? 'bg-primary' : 'bg-sand-deep'
                } ${i === questionIndex ? 'w-9' : 'w-5'}`} />
              ))}
            </div>
          )}
          <div className="w-11" />
        </div>
        <div key={step} className="flex-1 overflow-y-auto -mx-6 px-6">
          <div className="min-h-full max-w-md mx-auto flex flex-col">
            <div className="my-auto py-6">{content}</div>
          </div>
        </div>
        {footer && <div className="max-w-md w-full mx-auto pt-4 flex-shrink-0">{footer}</div>}
      </div>
    );
  };

  // One question: its 3D art, the question, a short line under it, then the answers
  // compact: smaller art and title, for the screen with the longest list of answers
  const question = (art: string, title: string, subtitle: string | null, answersEl: React.ReactNode, artSize = 120, compact = false) => (
    <div className="text-center">
      <Art3D src={art} size={compact ? 56 : artSize} className={compact ? 'mb-3' : 'mb-5'} />
      <h1 className={`rise-in ${compact ? 'text-[1.5rem]' : 'text-[1.75rem]'} leading-[1.15] font-bold text-ink tracking-tight`} style={{ animationDelay: '120ms' }}>
        {title}
      </h1>
      {subtitle && (
        <p className="rise-in text-ink-faint text-[0.9375rem] mt-2" style={{ animationDelay: '190ms' }}>{subtitle}</p>
      )}
      {answersEl && <div className={`${compact ? 'mt-5' : 'mt-7'} text-left`}>{answersEl}</div>}
    </div>
  );

  const continueButton = (label: string, enabled: boolean, onClick = advance) => (
    <Button onClick={onClick} disabled={!enabled || finishing} className={PRIMARY_BUTTON}>
      {finishing ? 'Saving…' : <>{label} <ArrowRight className="w-4 h-4" /></>}
    </Button>
  );

  if (step === 'hook') {
    return (
      <div className={`min-h-[100dvh] ${BACKDROP} flex flex-col items-center justify-center px-6 text-center pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-[env(safe-area-inset-top)]`}>
        <Art3D src={STEP_ART.hook} size={150} className="mb-8" />
        <h1 className="rise-in text-[2rem] font-bold text-ink leading-[1.12] tracking-tight max-w-sm" style={{ animationDelay: '200ms' }}>
          Your money is already saying something. <span className="text-brand">Let's make it say what you believe.</span>
        </h1>
        <p className="rise-in text-ink-soft text-[1.0625rem] mt-4 max-w-sm" style={{ animationDelay: '300ms' }}>
          Find companies working on the things you care about. 60 seconds. No account needed.
        </p>
        <div className="rise-in w-full max-w-sm space-y-2 mt-10" style={{ animationDelay: '400ms' }}>
          <Button onClick={advance} className={PRIMARY_BUTTON}>Find my matches</Button>
          {onSignIn && (
            <button onClick={onSignIn} className="w-full min-h-[48px] text-ink-soft hover:text-ink text-[0.9375rem] font-medium">
              I already have an account
            </button>
          )}
        </div>
        <p className="text-xs text-ink-faint mt-8 max-w-xs">
          By continuing, you agree to our{' '}
          <Link to="/terms" className="text-primary underline-offset-2 hover:underline">Terms of Service</Link>{' '}and{' '}
          <a href="https://stockmatcherai.com/support" className="text-primary underline-offset-2 hover:underline">Privacy Policy</a>.
          Educational only, not investment advice.
        </p>
      </div>
    );
  }

  if (step === 'intro') {
    return shell(
      question(
        STEP_ART.intro,
        'New: match by what you care about.',
        'Pick the causes you want your money to support, and your daily matches will follow them. It takes 20 seconds.',
        null,
        130,
      ),
      continueButton('Pick my causes', true),
    );
  }

  if (step === 'causes') {
    return shell(
      question(
        STEP_ART.causes,
        'What do you want your money to fight for?',
        'Pick up to 3. Your first pick matters most.',
        causes ? (
          <div className="rise-in" style={{ animationDelay: '260ms' }}>
            <CausePicker causes={causes} selected={answers.causes} onChange={c => update({ causes: c })} />
            <p className="text-ink-faint text-xs text-center mt-4">More causes are on the way.</p>
          </div>
        ) : causesError ? (
          <div className="text-center text-ink-soft py-10">
            <p>We couldn't load the causes.</p>
            <button onClick={loadCauses} className="text-primary font-semibold mt-2 min-h-[44px]">Try again</button>
          </div>
        ) : (
          <div className="space-y-2" aria-busy>
            {[0, 1, 2, 3].map(i => <div key={i} className="h-[60px] rounded-2xl bg-sand animate-pulse" />)}
          </div>
        ),
        72,
        true,
      ),
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
      question(
        STEP_ART.dealbreakers,
        "Anything you'd never want your money to fund?",
        'Optional. Companies tied to these will never show up for you.',
        <div className="rise-in" style={{ animationDelay: '260ms' }}>
          <ChipGroup
            name="Dealbreakers"
            multiple
            center
            options={[...DEALBREAKERS, { id: none, label: 'None of these' }]}
            selected={answers.dealbreakers}
            onToggle={id => (id === none ? update({ dealbreakers: [] }) : toggle(id))}
          />
        </div>,
      ),
      continueButton(
        mode === 'causes_only' ? 'Show my matches' : answers.dealbreakers.length ? 'Continue' : 'Skip',
        true,
      ),
    );
  }

  if (step === 'risk') {
    return shell(
      question(
        STEP_ART.risk,
        'Imagine a company you own drops 20% in a month.',
        'What do you do?',
        <ChoiceList animated name="If a stock drops 20%" options={RISK_OPTIONS} value={answers.risk}
          onSelect={id => { update({ risk: id }); advanceSoon(); }} />,
      ),
    );
  }

  if (step === 'experience') {
    return shell(
      question(
        STEP_ART.experience,
        'Have you ever bought a stock?',
        'It helps us explain things at the right level.',
        <ChoiceList animated name="Experience" options={EXPERIENCE_OPTIONS} value={answers.experience}
          onSelect={id => { update({ experience: id }); advanceSoon(); }} />,
      ),
    );
  }

  if (step === 'goal') {
    return shell(
      question(
        STEP_ART.goal,
        "What's this money for?",
        'You can change this any time in your profile.',
        <ChoiceList animated name="Goal" options={GOAL_OPTIONS} value={answers.goal}
          onSelect={id => { update({ goal: id }); advanceSoon(); }} />,
      ),
    );
  }

  // Reveal: its own layout (the build animation, then the count and the button)
  return (
    <div className={`h-[100dvh] ${BACKDROP} flex flex-col px-6 pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-[calc(env(safe-area-inset-top)+0.75rem)]`}>
      <RevealScreen
        answers={answers}
        causes={pickedCauses}
        onContinue={async () => {
          await requestTrackingOnce();
          finish(answers);
        }}
      />
    </div>
  );
};

export default OnboardingFlow;
