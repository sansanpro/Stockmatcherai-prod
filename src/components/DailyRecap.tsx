import { useEffect, useMemo, useState } from 'react';
import { X, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import Art3D from '@/components/onboarding/Art3D';
import CompanyLogo from '@/components/values/CompanyLogo';
import { causeTone } from '@/components/values/CauseChips';
import { recapInsights, recapShareText } from '@/lib/recap';
import { CAUSE_ART, STEP_ART } from '@/lib/art';
import { track } from '@/lib/analytics';
import type { CauseInfo } from '@/lib/matchFeed';
import type { StockRecommendation } from '@/types/stock-matcher';

const SITE_URL = 'https://stockmatcherai.com';
const SHOWN_ONE_BY_ONE = 5; // more likes than this share one collage slide

type Slide =
  | { kind: 'intro' }
  | { kind: 'company'; stock: StockRecommendation; index: number }
  | { kind: 'collage'; stocks: StockRecommendation[] }
  | { kind: 'insight' }
  | { kind: 'outro' };

// How long each slide stays before moving on (the last one waits for the user)
const DURATION: Record<Slide['kind'], number> = { intro: 3200, company: 3400, collage: 3600, insight: 6500, outro: 0 };

interface DailyRecapProps {
  liked: StockRecommendation[]; // today's likes, in the order they were made
  deckSize: number;
  myCauses: CauseInfo[]; // the user's causes, ranked
  onClose: () => void;
}

// End-of-day highlight reel: the companies liked today, one by one, then what those picks say
// about the person, then a share card. Tap the right side to skip ahead, the left to go back.
const DailyRecap = ({ liked, deckSize, myCauses, onClose }: DailyRecapProps) => {
  const insights = useMemo(() => recapInsights(liked, myCauses), [liked, myCauses]);
  const slides = useMemo<Slide[]>(() => {
    const list: Slide[] = [{ kind: 'intro' }];
    liked.slice(0, SHOWN_ONE_BY_ONE).forEach((stock, index) => list.push({ kind: 'company', stock, index }));
    if (liked.length > SHOWN_ONE_BY_ONE) list.push({ kind: 'collage', stocks: liked.slice(SHOWN_ONE_BY_ONE) });
    list.push({ kind: 'insight' }, { kind: 'outro' });
    return list;
  }, [liked]);
  const [at, setAt] = useState(0);
  const slide = slides[at];

  useEffect(() => { track('recap_shown', { likes: liked.length, persona: insights.persona.title }); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-advance (the outro stays until the user is done)
  useEffect(() => {
    const ms = DURATION[slide.kind];
    if (!ms) return;
    const timer = setTimeout(() => setAt(i => Math.min(i + 1, slides.length - 1)), ms);
    return () => clearTimeout(timer);
  }, [at, slide.kind, slides.length]);

  const next = () => setAt(i => Math.min(i + 1, slides.length - 1));
  const prev = () => setAt(i => Math.max(i - 1, 0));

  const share = async () => {
    const text = recapShareText(liked, insights.persona);
    try {
      if (navigator.share) {
        await navigator.share({ title: 'My StockMatcher day', text, url: SITE_URL });
        track('recap_shared', { method: 'share_sheet' });
      } else {
        await navigator.clipboard.writeText(`${text} ${SITE_URL}`);
        toast.success('Copied. Paste it anywhere to share.');
        track('recap_shared', { method: 'clipboard' });
      }
    } catch (error) {
      if ((error as Error)?.name !== 'AbortError') toast.error("Couldn't open sharing on this device.");
    }
  };

  const tint = slide.kind === 'company' ? causeTone(slide.stock.matchedCauses?.[0]?.cause).header : 'bg-cream';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Your day in values"
      className={`fixed inset-0 z-[95] ${tint} transition-colors duration-500 flex flex-col px-6 pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-[calc(env(safe-area-inset-top)+0.75rem)]`}
    >
      {/* Warm glow, as in onboarding */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_55%_at_50%_0%,rgba(251,231,220,0.9)_0%,rgba(250,246,239,0)_70%)]" aria-hidden />

      {/* Progress: one bar per slide; the current one fills over the slide's time */}
      <div className="relative z-20 flex items-center gap-3 h-11 flex-shrink-0">
        <div className="flex-1 flex gap-1.5" aria-hidden>
          {slides.map((s, i) => (
            <div key={i} className="h-1 flex-1 rounded-full bg-ink/15 overflow-hidden">
              <div
                key={i === at ? `run-${at}` : 'still'}
                className={`h-full bg-primary rounded-full ${i < at ? 'w-full' : i === at && DURATION[s.kind] ? 'reel-progress' : i === at ? 'w-full' : 'w-0'}`}
                style={i === at && DURATION[s.kind] ? { animationDuration: `${DURATION[s.kind]}ms` } : undefined}
              />
            </div>
          ))}
        </div>
        <button onClick={onClose} aria-label="Close recap" className="w-11 h-11 -mr-2 flex items-center justify-center rounded-full text-ink-soft hover:bg-white/60">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tap zones: left third goes back, the rest goes forward (not on the last slide) */}
      {slide.kind !== 'outro' && (
        <>
          <button aria-label="Previous" onClick={prev} className="absolute left-0 top-16 bottom-0 w-1/3 z-10" />
          <button aria-label="Next" onClick={next} className="absolute right-0 top-16 bottom-0 w-2/3 z-10" />
        </>
      )}

      <div key={at} className="relative flex-1 flex flex-col items-center justify-center text-center max-w-md w-full mx-auto" aria-live="polite">
        {slide.kind === 'intro' && (
          <>
            <Art3D src={STEP_ART.reveal} size={150} className="mb-7" />
            <h2 className="rise-in text-[34px] font-bold text-ink leading-[1.1] tracking-tight" style={{ animationDelay: '200ms' }}>
              Your day in values
            </h2>
            <p className="rise-in text-ink-soft text-[17px] mt-3" style={{ animationDelay: '320ms' }}>
              You liked {liked.length} of {deckSize} {deckSize === 1 ? 'company' : 'companies'} today.
            </p>
            <div className="flex justify-center -space-x-3 mt-8" aria-hidden>
              {liked.slice(0, 6).map((s, i) => (
                <div key={s.ticker} className="reel-pop" style={{ animationDelay: `${520 + i * 110}ms` }}>
                  <CompanyLogo src={s.logoUrl} name={s.companyName} ticker={s.ticker} className="w-14 h-14 border-2 border-white" />
                </div>
              ))}
            </div>
          </>
        )}

        {slide.kind === 'company' && (
          <>
            <p className="rise-in text-[13px] font-semibold uppercase tracking-wide text-ink-faint mb-6">
              Like {slide.index + 1} of {liked.length}
            </p>
            <div className="art-3d">
              <CompanyLogo src={slide.stock.logoUrl} name={slide.stock.companyName} ticker={slide.stock.ticker} className="w-28 h-28 rounded-3xl shadow-[0_18px_40px_rgba(60,40,20,0.2)]" />
            </div>
            <h2 className="rise-in text-[30px] font-bold text-ink leading-tight tracking-tight mt-8" style={{ animationDelay: '250ms' }}>
              {slide.stock.companyName}
            </h2>
            <div className="rise-in flex flex-wrap justify-center gap-1.5 mt-3" style={{ animationDelay: '340ms' }}>
              {(slide.stock.matchedCauses ?? []).map(c => {
                const tone = causeTone(c.cause);
                return (
                  <span key={c.cause} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold bg-white border ${tone.border} ${tone.text}`}>
                    <span aria-hidden>{c.icon}</span> {c.label}
                  </span>
                );
              })}
            </div>
            {(slide.stock.matchedCauses?.[0]?.whyLine || slide.stock.missionStory) && (
              <p className="rise-in text-ink-soft text-[17px] leading-snug mt-5 max-w-sm" style={{ animationDelay: '440ms' }}>
                {slide.stock.matchedCauses?.[0]?.whyLine || slide.stock.missionStory}
              </p>
            )}
          </>
        )}

        {slide.kind === 'collage' && (
          <>
            <h2 className="rise-in text-[28px] font-bold text-ink leading-tight tracking-tight">
              And {slide.stocks.length} more you liked
            </h2>
            <div className="grid grid-cols-3 gap-4 mt-8">
              {slide.stocks.slice(0, 9).map((s, i) => (
                <div key={s.ticker} className="reel-pop flex flex-col items-center gap-1.5" style={{ animationDelay: `${200 + i * 90}ms` }}>
                  <CompanyLogo src={s.logoUrl} name={s.companyName} ticker={s.ticker} className="w-16 h-16" />
                  <span className="text-xs text-ink-soft font-medium max-w-[90px] truncate">{s.companyName}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {slide.kind === 'insight' && (
          <>
            <Art3D src={(insights.topCause && CAUSE_ART[insights.topCause.id]) || STEP_ART.intro} size={120} className="mb-6" />
            <p className="rise-in text-[13px] font-semibold uppercase tracking-wide text-ink-faint" style={{ animationDelay: '150ms' }}>
              What your likes say about you
            </p>
            <h2 className="rise-in text-[34px] font-bold text-primary leading-[1.1] tracking-tight mt-2" style={{ animationDelay: '260ms' }}>
              {insights.persona.title}
            </h2>
            <p className="rise-in text-ink text-[17px] mt-3" style={{ animationDelay: '380ms' }}>{insights.persona.line}</p>
            <ul className="mt-7 space-y-2.5 w-full text-left">
              {insights.facts.map((fact, i) => (
                <li key={fact} className="rise-in flex gap-3 items-start rounded-2xl bg-white/85 border border-line px-4 py-3 shadow-sm text-[15px] text-ink leading-snug"
                  style={{ animationDelay: `${900 + i * 900}ms` }}>
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-clay-tint text-primary text-xs font-bold flex items-center justify-center flex-shrink-0" aria-hidden>{i + 1}</span>
                  {fact}
                </li>
              ))}
            </ul>
          </>
        )}

        {slide.kind === 'outro' && (
          <>
            <Art3D src={STEP_ART.intro} size={110} className="mb-6" />
            <h2 className="rise-in text-[30px] font-bold text-ink leading-tight tracking-tight" style={{ animationDelay: '150ms' }}>
              That's your day.
            </h2>
            <p className="rise-in text-ink-soft text-[17px] mt-3 max-w-xs" style={{ animationDelay: '260ms' }}>
              New companies arrive tomorrow morning. Your likes are saved in Likes.
            </p>
            <div className="rise-in w-full space-y-3 mt-10" style={{ animationDelay: '380ms' }}>
              <button onClick={share} className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white text-[17px] font-semibold shadow-lg shadow-[#B54A22]/25 flex items-center justify-center gap-2">
                <Share2 className="w-4 h-4" /> Share my day
              </button>
              <button onClick={onClose} className="w-full h-14 rounded-2xl border border-line bg-white text-ink text-[17px] font-semibold hover:bg-sand">
                Done
              </button>
            </div>
            <p className="text-ink-faint text-xs mt-6">Educational only, not investment advice.</p>
          </>
        )}
      </div>
    </div>
  );
};

export default DailyRecap;
