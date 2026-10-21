import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ValuesCard from '@/components/onboarding/ValuesCard';
import { previewMatches, type CauseInfo } from '@/lib/matchFeed';
import { MOTIVATION_LINES, type OnboardingAnswers } from '@/lib/onboarding';

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
    const t1 = setTimeout(() => setPhase(1), 700);
    const t2 = setTimeout(() => setPhase(2), 2400);
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
    <div className="flex-1 flex flex-col">
      {/* Build animation: cause icons, then company logos stacking up */}
      <div className="relative h-52 flex items-center justify-center mb-2" aria-hidden>
        <div className={`absolute top-0 inset-x-0 flex justify-center gap-4 transition-all duration-500 ${phase >= 0 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          {causes.map((c, i) => (
            <span key={c.id} className="text-4xl animate-scale-in" style={{ animationDelay: `${i * 150}ms` }}>{c.icon}</span>
          ))}
        </div>
        <div className="absolute top-24 flex items-center justify-center">
          {logos.map((src, i) => {
            const offset = (i - (logos.length - 1) / 2) * 22; // fanned out around the center
            const LOGO_HALF_WIDTH = 28; // w-14
            return (
              <img
                key={src}
                src={src}
                alt=""
                className="w-14 h-14 max-w-none rounded-2xl bg-white object-contain p-1.5 shadow-xl border border-white/20 absolute transition-all ease-out"
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
        <h2 className="text-3xl font-bold text-white leading-tight">
          {preview && preview.count > 0
            ? <>We found <span className="text-primary">{shownCount}</span> companies working on {labels}.</>
            : <>Your matches are ready: companies working on {labels}.</>}
        </h2>
        {answers.motivation && MOTIVATION_LINES[answers.motivation] && (
          <p className="text-white/60 mt-3">{MOTIVATION_LINES[answers.motivation]}</p>
        )}
        <div className="mt-6">
          <ValuesCard causes={causes} />
        </div>
      </div>

      <div className={`mt-auto pt-6 transition-opacity duration-500 ${phase >= 2 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <Button
          onClick={onContinue}
          className="w-full h-14 text-base font-semibold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 rounded-2xl shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
        >
          See my first 7 matches <ArrowRight className="w-4 h-4" />
        </Button>
        <p className="text-center text-white/30 text-xs mt-3">Educational only, not investment advice.</p>
      </div>
    </div>
  );
};

export default RevealScreen;
