import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Art3D from '@/components/onboarding/Art3D';
import ValuesCard from '@/components/onboarding/ValuesCard';
import { previewMatches, type CauseInfo } from '@/lib/matchFeed';
import type { OnboardingAnswers } from '@/lib/onboarding';
import { CAUSE_ART } from '@/lib/art';

const joinLabels = (labels: string[]) =>
  labels.length <= 1 ? labels.join('')
    : labels.length === 2 ? `${labels[0]} and ${labels[1]}`
    : `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`;

interface RevealScreenProps {
  answers: OnboardingAnswers;
  causes: CauseInfo[]; // the user's picks, in rank order
  onContinue: () => void;
}

// The payoff: their causes pull in matching companies, then the count and their values card
const RevealScreen = ({ answers, causes, onContinue }: RevealScreenProps) => {
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const [phase, setPhase] = useState(reduceMotion ? 2 : 0);
  const [preview, setPreview] = useState<{ count: number; logos: string[] } | null>(null);
  const [shownCount, setShownCount] = useState(0);

  useEffect(() => {
    previewMatches(answers.causes, answers.dealbreakers)
      .then(setPreview)
      .catch(() => setPreview({ count: 0, logos: [] }));
    if (reduceMotion) return;
    const t1 = setTimeout(() => setPhase(1), 900);
    const t2 = setTimeout(() => setPhase(2), 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Count up once the number is known and the build animation has finished
  useEffect(() => {
    if (phase < 2 || !preview?.count) return;
    if (reduceMotion) { setShownCount(preview.count); return; }
    let n = 0;
    const step = Math.max(1, Math.ceil(preview.count / 20));
    const timer = setInterval(() => {
      n = Math.min(preview.count, n + step);
      setShownCount(n);
      if (n >= preview.count) clearInterval(timer);
    }, 35);
    return () => clearInterval(timer);
  }, [phase, preview, reduceMotion]);

  const labels = joinLabels(causes.map(c => c.label));
  const logos = preview?.logos ?? [];

  return (
    <div className="flex-1 min-h-0 flex flex-col max-w-md w-full mx-auto">
      <div className="flex-1 overflow-y-auto -mx-6 px-6">
        <div className="min-h-full flex flex-col">
          <div className="my-auto py-4">
            {/* Build animation: the causes in 3D, then company logos fanning out under them */}
            <div className="relative h-60 flex items-center justify-center mb-2" aria-hidden>
              <div className="absolute top-0 inset-x-0 flex justify-center gap-2">
                {causes.map((c, i) => CAUSE_ART[c.id]
                  ? <Art3D key={c.id} src={CAUSE_ART[c.id]} size={72} delay={i * 160} />
                  : <span key={c.id} className="text-5xl">{c.icon}</span>)}
              </div>
              <div className="absolute top-32 left-1/2 w-0">
                {logos.map((src, i) => {
                  const offset = (i - (logos.length - 1) / 2) * 22; // fanned out around the center
                  const LOGO_HALF_WIDTH = 28; // w-14
                  return (
                    <img
                      key={src}
                      src={src}
                      alt=""
                      className="w-14 h-14 max-w-none rounded-2xl bg-white object-contain p-1.5 shadow-lg shadow-ink/15 border border-line absolute transition-all ease-out"
                      style={{
                        transitionDuration: '600ms',
                        transitionDelay: `${i * 110}ms`,
                        transform: phase >= 1
                          ? `translateX(${offset - LOGO_HALF_WIDTH}px) rotate(${offset / 6}deg)`
                          : `translateX(-${LOGO_HALF_WIDTH}px) translateY(120px) scale(0.6)`,
                        opacity: phase >= 1 ? 1 : 0,
                        zIndex: i,
                      }}
                    />
                  );
                })}
              </div>
            </div>

            <div className={`transition-all duration-500 ${phase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <h1 className="text-[1.75rem] font-bold text-ink leading-[1.15] tracking-tight text-center">
                {preview && preview.count > 0
                  ? <>We found <span className="text-primary">{shownCount}</span> companies working on {labels}.</>
                  : <>Your matches are ready: companies working on {labels}.</>}
              </h1>
              <p className="text-ink-soft mt-3 text-center">Now your money can say what you believe.</p>
              <div className="mt-6">
                <ValuesCard causes={causes} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`pt-4 transition-opacity duration-500 ${phase >= 2 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <Button
          onClick={onContinue}
          className="w-full h-14 text-[1.0625rem] font-semibold rounded-2xl bg-primary hover:bg-clay-ink text-white shadow-lg shadow-brand/25 flex items-center justify-center gap-2"
        >
          See my first 7 matches <ArrowRight className="w-4 h-4" />
        </Button>
        <p className="text-center text-ink-faint text-xs mt-3">Educational only, not investment advice.</p>
      </div>
    </div>
  );
};

export default RevealScreen;
