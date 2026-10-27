import { useState, useEffect, useRef, useCallback } from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Button } from '@/components/ui/button';
import { StockRecommendation } from '@/types/stock-matcher';
import TinderStockCard from '@/components/TinderStockCard';
import UpgradeModal from '@/components/UpgradeModal';
import CoachMark from '@/components/CoachMark';
import { useApp } from '@/contexts/AppContext';
import { PLAN_LIMITS, useSubscription } from '@/contexts/SubscriptionContext';
import { Heart, X, RefreshCw, Crown, Pencil, Play } from 'lucide-react';
import DailyRecap from '@/components/DailyRecap';
import Art3D from '@/components/onboarding/Art3D';
import { STEP_ART } from '@/lib/art';
import { toast } from 'sonner';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { track, trackLike } from '@/lib/analytics';
import type { OnboardingAnswers } from '@/lib/onboarding';
import {
  FeedError, cardToRecommendation, feedDate, fetchCauses, fetchSignedInDeck, fetchSignedOutDeck,
  loadDeviceFeed, recordDeviceSwipe, recordSwipe, saveDeviceFeed, type CauseInfo, type FeedDeck,
} from '@/lib/matchFeed';

interface StockMatcherProps {
  answers: OnboardingAnswers;
  signedIn: boolean;
  // Changes when the user's causes change; reloads (and, signed in, rebuilds) today's deck
  causesVersion: number;
  onEditCauses: () => void;
  onNeedsCauses?: () => void;
  // Signed out: called after each like; returns true if it opened the save prompt
  onLikedOnDevice?: (likesOnDevice: number) => boolean;
  onSaveMatches?: () => void;
  // advance(liked) is called by the details modal's buttons so the card moves on without a swipe
  onViewDetails?: (stock: StockRecommendation, advance: (liked: boolean) => void) => void;
}

type Status = 'loading' | 'ready' | 'error';

const StockMatcher = ({
  answers, signedIn, causesVersion, onEditCauses, onNeedsCauses, onLikedOnDevice, onSaveMatches, onViewDetails,
}: StockMatcherProps) => {
  const [cards, setCards] = useState<StockRecommendation[]>([]); // still to swipe today, in order
  const [deckSize, setDeckSize] = useState(0);
  const [likedToday, setLikedToday] = useState(0);
  const [likedCards, setLikedCards] = useState<StockRecommendation[]>([]); // companies liked today, in order
  const [showRecap, setShowRecap] = useState(false);
  const [status, setStatus] = useState<Status>('loading');
  const [animatingCard, setAnimatingCard] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [causeInfo, setCauseInfo] = useState<CauseInfo[]>([]);
  const finishedTracked = useRef(false);
  const handleMatchRef = useRef<() => void>(() => {});
  const handlePassRef = useRef<() => void>(() => {});
  const loadedCausesVersion = useRef<number>();

  const { addToWatchlist, isInWatchlist, updateSwipeStats } = useApp();
  const { subscribed } = useSubscription();

  useEffect(() => {
    const timer = setTimeout(() => setShowSwipeHint(false), 5000);
    fetchCauses().then(setCauseInfo).catch(() => {});
    return () => clearTimeout(timer);
  }, []);

  // rebuild: the user's causes changed, so the rest of today's deck is refilled from them
  // (cards already swiped stay, and the day's size doesn't change)
  const loadDeck = useCallback(async (rebuild = false) => {
    setStatus('loading');
    try {
      let deck: FeedDeck;
      if (signedIn) {
        deck = await fetchSignedInDeck(rebuild);
      } else {
        const device = loadDeviceFeed();
        const today = feedDate();
        if (device.deck?.date === today && !rebuild) {
          deck = { deckDate: today, cards: device.deck.cards, swiped: device.deck.swiped, signedIn: false };
        } else {
          deck = await fetchSignedOutDeck(answers, [...device.liked, ...device.passed], device.liked);
          device.deck = { date: deck.deckDate, cards: deck.cards, swiped: [] };
          saveDeviceFeed(device);
        }
      }
      const swiped = new Map(deck.swiped.map(s => [s.ticker, s.liked]));
      const inDeck = deck.cards.filter(c => swiped.has(c.ticker));
      const remaining = deck.cards.filter(c => !swiped.has(c.ticker));
      setDeckSize(deck.cards.length);
      const likedInDeck = inDeck.filter(c => swiped.get(c.ticker) && c.type === 'company');
      setLikedToday(likedInDeck.length);
      setLikedCards(likedInDeck.map(cardToRecommendation));
      setCards(remaining.map(cardToRecommendation));
      finishedTracked.current = remaining.length === 0;
      setStatus('ready');
      track('deck_loaded', { cards: deck.cards.length, remaining: remaining.length, signed_in: signedIn });
      if (rebuild && signedIn) {
        toast.success(deck.rebuilt
          ? "Today's remaining matches now follow your new picks."
          : "You've seen today's matches. Your new picks start with tomorrow's deck.");
      }
    } catch (error) {
      if (error instanceof FeedError && error.status === 409) {
        onNeedsCauses?.();
        return;
      }
      console.error('[StockMatcher] deck failed:', error);
      setStatus('error');
    }
  }, [signedIn, answers]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load on mount, on sign-in/out, and when causes change
  useEffect(() => {
    const causesChanged = loadedCausesVersion.current !== undefined && loadedCausesVersion.current !== causesVersion;
    loadedCausesVersion.current = causesVersion;
    loadDeck(causesChanged);
  }, [signedIn, causesVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  const swipe = (liked: boolean) => {
    const card = cards[0];
    if (animatingCard || !card) return;
    setAnimatingCard(true);
    const position = deckSize - cards.length;

    if (signedIn) {
      recordSwipe(card.ticker, liked).catch(error => {
        if (!(error instanceof FeedError && error.status === 409)) {
          toast.error("Couldn't save that swipe. Check your connection.");
        }
      });
    } else {
      recordDeviceSwipe(card.ticker, liked);
    }

    if (card.cardType === 'update') {
      track('swipe', { ticker: card.ticker, card_type: 'update', position, liked });
    } else if (liked) {
      trackLike({ ticker: card.ticker, cause: card.cause, sector: card.sector, position, signed_in: signedIn });
      if (!isInWatchlist(card.ticker)) addToWatchlist(card);
      setLikedToday(n => n + 1);
      setLikedCards(prev => [...prev, card]);
      // The save prompt is its own confirmation; a toast would sit on top of its buttons
      const prompted = !signedIn && !!onLikedOnDevice?.(loadDeviceFeed().liked.length);
      if (!prompted) toast(`${card.companyName} saved to your likes`, { duration: 1800 });
    } else {
      track('swipe', { ticker: card.ticker, cause: card.cause, sector: card.sector, position, liked: false, signed_in: signedIn });
    }
    updateSwipeStats(liked);

    // Let the card's exit animation play first
    setTimeout(() => {
      setCards(prev => prev.slice(1));
      setAnimatingCard(false);
    }, 400);
  };
  const handleMatch = () => swipe(true);
  const handlePass = () => swipe(false);

  useEffect(() => { handleMatchRef.current = handleMatch; });
  useEffect(() => { handlePassRef.current = handlePass; });

  const isFinished = status === 'ready' && deckSize > 0 && cards.length === 0;
  useEffect(() => {
    if (isFinished && !finishedTracked.current) {
      finishedTracked.current = true;
      track('deck_finished', { cards: deckSize, liked: likedToday, signed_in: signedIn });
    }
  }, [isFinished]); // eslint-disable-line react-hooks/exhaustive-deps

  // The day's highlight reel plays once, when the last card is swiped (if anything was liked)
  useEffect(() => {
    if (!isFinished || likedCards.length === 0) return;
    const key = `recap_seen_${feedDate()}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, '1');
    } catch { /* storage blocked: still show it */ }
    setShowRecap(true);
  }, [isFinished, likedCards.length]);

  const myCauses = answers.causes
    .map(id => causeInfo.find(c => c.id === id))
    .filter((c): c is CauseInfo => !!c);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center" role="status">
        <div className="text-center space-y-6">
          <Art3D src={STEP_ART.causes} size={96} />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-ink">Finding today's matches</h2>
            <p className="text-ink-soft">Companies working on what you care about</p>
          </div>
        </div>
      </div>
    );
  }

  const centered = (content: React.ReactNode) => (
    <div className="min-h-screen bg-cream p-6 flex items-center justify-center" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="max-w-md w-full text-center text-ink pb-24">{content}</div>
    </div>
  );

  if (status === 'error') {
    return centered(
      <>
        <h1 className="text-2xl font-bold mb-2">We couldn't load your matches</h1>
        <p className="text-ink-soft mb-6">Check your connection and try again.</p>
        <Button onClick={() => loadDeck()} className="h-12 px-6 rounded-xl">
          <RefreshCw className="w-4 h-4 mr-2" /> Try again
        </Button>
      </>,
    );
  }

  if (deckSize === 0) {
    return centered(
      <>
        <h1 className="text-2xl font-bold mb-2">You've seen every company in your causes for now</h1>
        <p className="text-ink-soft mb-6">Add another cause to see more, or check back soon. New companies are added regularly.</p>
        <Button onClick={onEditCauses} className="h-12 px-6 rounded-xl font-semibold">
          <Pencil className="w-4 h-4 mr-2" /> Change my causes
        </Button>
      </>,
    );
  }

  if (isFinished) {
    return centered(
      <>
        <Art3D src={STEP_ART.reveal} size={112} className="mb-5" />
        <h1 className="text-3xl font-bold mb-2">That's today's matches</h1>
        <p className="text-ink-soft">
          {likedToday > 0 ? `You liked ${likedToday} ${likedToday === 1 ? 'company' : 'companies'} today. ` : ''}
          New matches arrive every morning.
        </p>
        {likedCards.length > 0 && (
          <button onClick={() => setShowRecap(true)} className="mt-4 inline-flex items-center gap-2 min-h-[44px] px-4 rounded-full bg-clay-tint text-clay-ink text-sm font-semibold border border-clay-soft">
            <Play className="w-4 h-4 fill-current" /> Replay today's recap
          </button>
        )}
        <div className="space-y-3 mt-8">
          {!signedIn && onSaveMatches && (
            <Button onClick={onSaveMatches} className="w-full h-12 rounded-xl font-semibold">
              Save my matches
            </Button>
          )}
          {signedIn && !subscribed && (
            <Button onClick={() => setShowUpgradeModal(true)} className="w-full h-12 rounded-xl font-semibold">
              <Crown className="w-4 h-4 mr-2" /> Get {PLAN_LIMITS.premium.dailyMatches} matches a day with Premium
            </Button>
          )}
          <Button onClick={onEditCauses} variant="outline" className="w-full h-12 rounded-xl bg-white border-line text-ink hover:bg-sand">
            <Pencil className="w-4 h-4 mr-2" /> Change my causes
          </Button>
        </div>
        <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} reason="deck" />
        {showRecap && (
          <DailyRecap liked={likedCards} deckSize={deckSize} myCauses={myCauses} onClose={() => setShowRecap(false)} />
        )}
      </>,
    );
  }

  const visibleCards = cards.slice(0, 3);
  const currentStock = cards[0];

  return (
    <div className="w-full h-full flex flex-col bg-cream" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl mx-auto flex flex-col flex-1 min-h-0 px-4 lg:px-2">
        {/* Header: the user's causes, in rank order (the one-time hint sits on top of it) */}
        <div className="relative text-center mb-2 pt-3 flex-shrink-0">
          <CoachMark
            id="first_card"
            text="Swipe right if you'd be proud to own a piece of this company."
            className="absolute top-1 left-1/2 -translate-x-1/2 w-[92%]"
          />
          <TooltipProvider>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {myCauses.map(c => (
                <Tooltip key={c.id}>
                  <TooltipTrigger asChild>
                    <button onClick={onEditCauses} className="min-h-[32px] px-3 rounded-full bg-white hover:bg-sand border border-line text-ink text-xs font-semibold shadow-sm transition-colors">
                      <span aria-hidden>{c.icon}</span> {c.label}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Tap to change your causes</TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
          <p className="text-ink-faint text-xs mt-2">{cards.length} of {deckSize} matches left today</p>
        </div>

        {/* Card stack */}
        <div className="flex-1 min-h-0 relative mb-2">
          {visibleCards.map((stock, stackIndex) => {
            const isActiveCard = stackIndex === 0;
            return (
              <TinderStockCard
                key={stock.ticker}
                stock={stock}
                onMatch={isActiveCard ? handleMatch : () => {}}
                onPass={isActiveCard ? handlePass : () => {}}
                onViewDetails={isActiveCard && onViewDetails
                  ? (s) => onViewDetails(s, (liked) => liked ? handleMatchRef.current() : handlePassRef.current())
                  : undefined}
                isVisible
                zIndex={visibleCards.length - stackIndex}
                scale={1 - stackIndex * 0.05}
                isHighMatch={isActiveCard && (stock.matchedCauses?.length ?? 0) > 1}
                isActive={isActiveCard}
                explain={answers.experience === 'never'}
              />
            );
          })}
        </div>

        {/* Pass / like */}
        {currentStock && (
          <div className="flex-shrink-0 px-4 pb-[max(env(safe-area-inset-bottom),6rem)]">
            <div className="flex justify-center gap-10 mb-2">
              <Button
                onClick={() => { Haptics.impact({ style: ImpactStyle.Light }).catch(() => {}); handlePass(); }}
                disabled={animatingCard}
                aria-label="Pass"
                className="w-16 h-16 rounded-full bg-white hover:bg-white border border-line text-ink-soft shadow-[0_8px_24px_rgba(60,40,20,0.14)] transform hover:scale-110 active:scale-90 transition-all duration-200 disabled:opacity-50 disabled:transform-none"
              >
                <X className="w-8 h-8" strokeWidth={2.5} />
              </Button>
              <Button
                onClick={() => { Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {}); handleMatch(); }}
                disabled={animatingCard}
                aria-label={currentStock.cardType === 'update' ? 'Interested' : 'Like this company'}
                className="w-16 h-16 rounded-full bg-primary hover:bg-primary border-0 text-white shadow-[0_10px_26px_rgba(181,74,34,0.35)] transform hover:scale-110 active:scale-90 transition-all duration-200 disabled:opacity-50 disabled:transform-none"
              >
                <Heart className="w-8 h-8 fill-current" />
              </Button>
            </div>
            {showSwipeHint && (
              <p className="text-center text-ink-faint text-xs">← Swipe left to pass · Swipe right to like →</p>
            )}
            <p className="text-center text-ink-faint text-xs mt-2">Educational only, not investment advice.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockMatcher;
