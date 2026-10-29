import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { capitalize } from '@/lib/utils';
import { useLiveQuote } from '@/hooks/useLiveQuote';
import { haptic } from '@/lib/haptics';
import { animateSpring, animateTween, DURATION, prefersReducedMotion, SPRING } from '@/lib/motion';
import { Card, CardContent } from '@/components/ui/card';
import { StockRecommendation } from '@/types/stock-matcher';
import { Heart, X, Eye, Minimize2, ThumbsUp } from 'lucide-react';
import DataFreshnessIndicator from '@/components/DataFreshnessIndicator';
import { Sheet, SheetContent, keepOpenForAIAssistant } from '@/components/ui/sheet';
import StockNewsPill from '@/components/StockNewsPill';
import CompanySnapshot from '@/components/CompanySnapshot';
import CompanyLogo from '@/components/values/CompanyLogo';
import CauseChips, { causeTone } from '@/components/values/CauseChips';
import ValuesSummary from '@/components/values/ValuesSummary';
import { CautionChip, CautionNote } from '@/components/values/Caution';
import KeyNumbers from '@/components/values/KeyNumbers';


const timeAgo = (iso?: string) => {
  if (!iso) return '';
  const hours = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 3_600_000));
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

interface TinderStockCardProps {
  stock: StockRecommendation;
  onMatch: () => void;
  onPass: () => void;
  onViewDetails?: (stock: StockRecommendation) => void;
  // A swipe or fling has started leaving (liked or passed); the swipe is recorded when it's off screen
  onRelease?: (liked: boolean) => void;
  isVisible?: boolean;
  zIndex?: number;
  scale?: number;
  isHighMatch?: boolean;
  // Only the top card refreshes its price on demand
  isActive?: boolean;
  // For people who have never bought a stock: a short meaning under each number
  explain?: boolean;
}

export interface SwipeCardHandle {
  // Sends the card off screen (pass/like buttons, the details modal), then calls onMatch/onPass
  fling: (liked: boolean) => void;
}

const TAP = 10; // px: less movement than this is a tap, which opens the card
const TILT = 0.06; // degrees per px dragged
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

const TinderStockCard = forwardRef<SwipeCardHandle, TinderStockCardProps>(({
  stock,
  onMatch,
  onPass,
  onViewDetails,
  onRelease,
  isVisible = true,
  zIndex = 1,
  scale = 1,
  isHighMatch = false,
  isActive = false,
  explain = false,
}, ref) => {
  const live = useLiveQuote(stock.ticker, stock.pricePerShare, stock.lastUpdated, isActive);
  const [isExpanded, setIsExpanded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const likeRef = useRef<HTMLDivElement>(null);
  const passRef = useRef<HTMLDivElement>(null);

  // The gesture lives in refs and writes straight to the DOM, so following the finger never
  // re-renders the card
  const pos = useRef({ x: 0, y: 0, opacity: 1 });
  const stopAnim = useRef<(() => void) | null>(null);
  const exiting = useRef(false);
  const drag = useRef<{
    id: number; touch: boolean; startX: number; startY: number; originX: number; originY: number;
    axis: 'none' | 'x' | 'scroll'; grabbedMoving: boolean; samples: { t: number; x: number; y: number }[];
  } | null>(null);
  const callbacks = useRef({ onMatch, onPass, onRelease });
  callbacks.current = { onMatch, onPass, onRelease };

  const paint = () => {
    const { x, y, opacity } = pos.current;
    const tilt = prefersReducedMotion() ? 0 : x * TILT;
    if (cardRef.current) {
      cardRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${tilt}deg)`;
      cardRef.current.style.opacity = String(opacity);
    }
    if (likeRef.current) likeRef.current.style.opacity = String(clamp01((x - 20) / 80));
    if (passRef.current) passRef.current.style.opacity = String(clamp01((-x - 20) / 80));
  };

  const springBack = (velocity = [0, 0]) => {
    stopAnim.current?.();
    if (prefersReducedMotion()) {
      const { x, y } = pos.current;
      stopAnim.current = animateTween(DURATION.reduced, t => { pos.current.x = x * (1 - t); pos.current.y = y * (1 - t); paint(); });
      return;
    }
    stopAnim.current = animateSpring({
      from: [pos.current.x, pos.current.y], to: [0, 0], velocity, spring: SPRING.snappy,
      onUpdate: ([x, y]) => { pos.current.x = x; pos.current.y = y; paint(); },
    });
  };

  // dir: 1 = like, -1 = pass. Exits keep the finger's speed; the swipe is recorded once the card is off screen.
  const fling = (dir: 1 | -1, velocity = [0, 0]) => {
    if (exiting.current) return;
    exiting.current = true;
    stopAnim.current?.();
    haptic(dir > 0 ? 'medium' : 'light');
    callbacks.current.onRelease?.(dir > 0);
    const finish = () => (dir > 0 ? callbacks.current.onMatch() : callbacks.current.onPass());
    const { x, y } = pos.current;
    if (prefersReducedMotion()) {
      // Same change, no flying: a short slide and a cross-fade
      stopAnim.current = animateTween(DURATION.reduced, t => {
        pos.current.x = x + dir * 40 * t; pos.current.opacity = 1 - t; paint();
      }, finish);
      return;
    }
    const width = cardRef.current?.offsetWidth ?? 360;
    const vx = dir * Math.max(Math.abs(velocity[0]), 1); // at least 1 px/ms, so button flings feel brisk
    stopAnim.current = animateSpring({
      from: [x, y], to: [dir * (width * 1.6 + 100), y + velocity[1] * 120], velocity: [vx, velocity[1]], spring: SPRING.snappy,
      onUpdate: ([nx, ny]) => { pos.current.x = nx; pos.current.y = ny; paint(); },
      done: ([nx]) => Math.abs(nx) > width + 60,
      onComplete: finish,
    });
  };

  useImperativeHandle(ref, () => ({ fling: (liked: boolean) => fling(liked ? 1 : -1) }));
  useEffect(() => () => stopAnim.current?.(), []);

  // Taps on buttons/links inside the card (details, tooltips, news, carousel) shouldn't also
  // count as a tap on the card, which would expand it on top of whatever the button opens
  const startsOnControl = (target: EventTarget) =>
    target instanceof Element && !!target.closest('button, a, input, [role="button"]');

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isActive || exiting.current || drag.current || startsOnControl(e.target)) return;
    if (e.pointerType === 'mouse') {
      if (e.button !== 0) return;
      e.preventDefault(); // no text selection while dragging with a mouse
    }
    const moving = !!stopAnim.current && (Math.abs(pos.current.x) > 1 || Math.abs(pos.current.y) > 1);
    stopAnim.current?.(); // a new touch grabs the card wherever it is
    stopAnim.current = null;
    drag.current = {
      id: e.pointerId, touch: e.pointerType !== 'mouse', startX: e.clientX, startY: e.clientY,
      originX: pos.current.x, originY: pos.current.y, axis: 'none', grabbedMoving: moving,
      samples: [{ t: e.timeStamp, x: pos.current.x, y: pos.current.y }],
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId || d.axis === 'scroll') return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (d.axis === 'none') {
      if (Math.abs(dx) < TAP && Math.abs(dy) < TAP) return;
      // A mostly vertical touch scrolls the card's content instead (touch-action: pan-y)
      if (d.touch && Math.abs(dy) > Math.abs(dx)) { d.axis = 'scroll'; return; }
      d.axis = 'x';
      cardRef.current?.setPointerCapture(e.pointerId);
    }
    pos.current.x = d.originX + dx;
    pos.current.y = d.originY + dy;
    paint();
    d.samples.push({ t: e.timeStamp, x: pos.current.x, y: pos.current.y });
    if (d.samples.length > 8) d.samples.shift();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (d.axis === 'scroll') return;
    if (d.axis === 'none') {
      if (d.grabbedMoving) springBack();
      else setIsExpanded(true);
      return;
    }
    // Speed over the last ~80 ms of the drag, in px/ms
    const recent = d.samples.filter(s => e.timeStamp - s.t < 80);
    const first = recent[0] ?? d.samples[0];
    const span = Math.max(1, e.timeStamp - first.t);
    const vx = (pos.current.x - first.x) / span;
    const vy = (pos.current.y - first.y) / span;
    const width = cardRef.current?.offsetWidth ?? 360;
    if (Math.abs(vx) > 0.5) fling(vx > 0 ? 1 : -1, [vx, vy]);
    else if (Math.abs(pos.current.x) > width * 0.35) fling(pos.current.x > 0 ? 1 : -1, [vx, vy]);
    else springBack([vx, vy]);
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (d.axis === 'x' || d.grabbedMoving) springBack();
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(stock);
    }
  };

  const isUpdate = stock.cardType === 'update' && !!stock.update;
  const primaryCause = stock.cause ?? stock.matchedCauses?.[0]?.cause;

  // Logo, name and the causes it matches, on a soft tint of the cause's color
  const header = (large = false) => (
    <div className={`${causeTone(primaryCause).header} text-ink ${large ? 'p-5' : 'p-4'} flex-shrink-0`}>
      <div className="flex items-start gap-3">
        <CompanyLogo src={stock.logoUrl} name={stock.companyName} ticker={stock.ticker} className={large ? 'w-14 h-14' : 'w-12 h-12'} />
        <div className="flex-1 min-w-0">
          <h2 className={`${large ? 'text-2xl' : 'text-xl'} font-bold leading-tight truncate`}>{stock.companyName}</h2>
          <p className="text-ink-soft text-sm">{stock.ticker}{stock.sector ? ` · ${capitalize(stock.sector)}` : ''}</p>
        </div>
        {!large && onViewDetails && (
          <button
            onClick={handleViewDetails}
            aria-label="View stock details"
            className="bg-surface/85 hover:bg-surface text-ink-soft border border-ink/5 w-11 h-11 flex items-center justify-center rounded-full shadow-sm transition-colors flex-shrink-0"
          >
            <Eye className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="mt-3">
        {isUpdate ? (
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold bg-white border border-line text-ink">
            📰 News on a company you liked
          </span>
        ) : (
          <CauseChips causes={stock.matchedCauses} />
        )}
        {stock.caution && <div className="mt-2"><CautionChip caution={stock.caution} /></div>}
      </div>
    </div>
  );

  // Update cards: the news, and why the user liked the company in the first place
  const updateBody = isUpdate && (
    <div className="space-y-3">
      <CautionNote caution={stock.caution} />
      <div className="rounded-xl bg-sand border border-line p-3">
        <p className="text-[0.9375rem] font-semibold leading-snug text-ink">{stock.update!.headline}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {[stock.update!.source, timeAgo(stock.update!.publishedAt)].filter(Boolean).join(' · ')}
        </p>
        {stock.update!.url && (
          <a href={stock.update!.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center min-h-[44px] mt-1 text-sm font-semibold text-primary underline">
            Read it{stock.update!.source ? ` on ${stock.update!.source}` : ''} ↗
          </a>
        )}
      </div>
      {stock.missionStory && (
        <div>
          <p className="text-[0.6875rem] font-semibold uppercase tracking-wide text-muted-foreground">Why you liked it</p>
          <p className="text-sm text-ink mt-1 leading-snug">{stock.missionStory}</p>
        </div>
      )}
    </div>
  );

  // Each matched cause's one-line reason
  const whyLines = !isUpdate && (stock.matchedCauses ?? []).some(c => c.whyLine) && (
    <div>
      <p className="text-[0.6875rem] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Why it matches you</p>
      <ul className="space-y-1 text-sm text-ink">
        {(stock.matchedCauses ?? []).filter(c => c.whyLine).map(c => (
          <li key={c.cause}><span aria-hidden>{c.icon}</span> {c.whyLine}</li>
        ))}
      </ul>
    </div>
  );

  // Tapping the card opens everything, with the meaning of every number spelled out
  const renderExpandedContent = () => (
    <div className="flex flex-col h-full overflow-y-auto">
      {header(true)}
      <div className="p-5 space-y-5">
        {updateBody}
        <ValuesSummary stock={stock} />
        {whyLines}
        <KeyNumbers stock={stock} price={live.price} explain />
        <div className="flex flex-wrap items-center gap-2">
          <DataFreshnessIndicator lastUpdated={live.lastUpdated} variant="inline" className="bg-muted rounded-full px-3 py-1.5 text-sm" />
          <StockNewsPill ticker={stock.ticker} companyName={stock.companyName} />
        </div>
      </div>
      <CompanySnapshot ticker={stock.ticker} companyName={stock.companyName} sector={stock.sector} variant="expanded" />
      <p className="text-center text-xs text-muted-foreground py-4">Educational only, not investment advice.</p>
    </div>
  );

  return (
    <>
      {/* Expanded fullscreen sheet */}
      <Sheet open={isExpanded} onOpenChange={setIsExpanded} modal={false}>
        <SheetContent side="bottom" className="h-[95vh] p-0 rounded-t-3xl z-[65]" onInteractOutside={keepOpenForAIAssistant}>
          <div className="flex items-center justify-between p-4 border-b bg-background sticky top-0 z-10">
            <h3 className="font-semibold text-lg">Stock Details</h3>
            <button
              onClick={() => setIsExpanded(false)}
              aria-label="Collapse stock details"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 active:scale-95 transition-all"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>
          {renderExpandedContent()}
        </SheetContent>
      </Sheet>

      <div
        className={`absolute inset-0 card-enter stack-settle ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        style={{
          zIndex,
          transform: `scale(${scale})`,
          filter: isActive ? 'none' : 'brightness(0.94)', // only the cards behind are dimmed
        }}
      >
      <Card
        ref={cardRef}
        className={`w-full max-w-[min(95vw,400px)] md:max-w-[min(90vw,600px)] lg:max-w-[min(85vw,800px)] xl:max-w-[min(80vw,900px)] mx-auto shadow-[0_18px_40px_rgb(var(--primary-deep)/0.16)] border border-line bg-surface overflow-hidden cursor-grab active:cursor-grabbing select-none will-change-transform h-full max-h-[70vh] sm:max-h-[75vh] md:max-h-[80vh] lg:max-h-[calc(100vh-10rem)] rounded-2xl flex flex-col relative`}
        style={{ touchAction: 'pan-y' }}
        data-swipe-card={isActive ? 'top' : 'behind'}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        {/* Like / pass labels fade in with the drag distance */}
        <div ref={likeRef} aria-hidden className="absolute inset-0 z-10 flex items-center justify-center bg-brand-deep/90 text-white pointer-events-none" style={{ opacity: 0 }}>
          <div className="text-center">
            {isHighMatch
              ? <Heart className="w-16 h-16 mx-auto mb-2 fill-current" />
              : <ThumbsUp className="w-16 h-16 mx-auto mb-2" />}
            <div className="text-2xl font-bold">Like</div>
          </div>
        </div>
        <div ref={passRef} aria-hidden className="absolute inset-0 z-10 flex items-center justify-center bg-ink/80 text-white pointer-events-none" style={{ opacity: 0 }}>
          <div className="text-center">
            <X className="w-16 h-16 mx-auto mb-2" />
            <div className="text-2xl font-bold">Pass</div>
          </div>
        </div>
        <CardContent className="p-0 flex flex-col h-full overflow-y-auto">
          {/* Story first: who they are and what they work on, then proof, then the numbers */}
          {header()}
          <div className="px-4 pt-4 pb-8 space-y-4">
            {updateBody}
            {!isUpdate && <ValuesSummary stock={stock} compact />}
            <KeyNumbers stock={stock} price={live.price} explain={explain} />
            <div className="flex flex-wrap items-center gap-2">
              <DataFreshnessIndicator lastUpdated={live.lastUpdated} variant="inline" className="bg-muted rounded-full px-2.5 py-1 text-xs" />
              <StockNewsPill ticker={stock.ticker} companyName={stock.companyName} />
            </div>
            <p className="text-center text-xs text-muted-foreground pb-1">
              Tap for the full picture · Swipe right if you'd be proud to own a piece
            </p>
          </div>
          {/* A fade at the bottom while more of the card is below (at the end it covers only the padding above) */}
          <div aria-hidden className="sticky bottom-0 h-8 -mt-8 flex-shrink-0 bg-gradient-to-t from-surface to-surface/0 pointer-events-none" />
        </CardContent>
      </Card>
      </div>
    </>
  );
});
TinderStockCard.displayName = 'TinderStockCard';

export default TinderStockCard;
