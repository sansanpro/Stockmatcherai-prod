import { useState } from 'react';
import Disclaimer from '@/components/values/Disclaimer';
import { useApp } from '@/contexts/AppContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import CompareSheet from '@/components/values/CompareSheet';
import UpgradeModal from '@/components/UpgradeModal';
import { track } from '@/lib/analytics';
import Art3D from '@/components/onboarding/Art3D';
import { CAUSE_ART } from '@/lib/art';
import StockCard from '@/components/StockCard';
import { Check, Columns2, Crown, Heart, Lock } from 'lucide-react';
import { StockRecommendation } from '@/types/stock-matcher';
import { FREE_LIKES_WITHOUT_ACCOUNT } from '@/components/SavePrompt';

interface MatchesProps {
  onViewDetails?: (stock: StockRecommendation) => void;
  // Signed out: likes are on this device only; past the first few, keeping them needs an account
  signedIn?: boolean;
  onSaveMatches?: () => void;
}

const Matches = ({ onViewDetails, signedIn = true, onSaveMatches }: MatchesProps) => {
  const { watchlist } = useApp();
  const shown = signedIn ? watchlist : watchlist.slice(0, FREE_LIKES_WITHOUT_ACCOUNT);
  const waiting = watchlist.length - shown.length;
  const { subscribed } = useSubscription();

  // Premium: pick two liked companies and see them side by side
  const [picking, setPicking] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [pair, setPair] = useState<[StockRecommendation, StockRecommendation] | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const canCompare = signedIn && shown.length >= 2;

  const startCompare = () => {
    track('compare_tapped', { subscribed });
    if (!subscribed) { setShowUpgrade(true); return; }
    setPicked([]);
    setPicking(true);
  };
  const pick = (stock: StockRecommendation) => {
    if (picked.includes(stock.ticker)) { setPicked(picked.filter(t => t !== stock.ticker)); return; }
    const next = [...picked, stock.ticker];
    if (next.length < 2) { setPicked(next); return; }
    const [a, b] = next.map(t => shown.find(s => s.ticker === t)!);
    setPair([a, b]);
    setPicking(false);
    setPicked([]);
    track('compare_opened', { tickers: next.join(',') });
  };

  return (
    <div className="space-y-6 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3 pt-4 px-1">
        <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-md shadow-brand/25">
          <Heart className="w-5 h-5 text-white fill-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Your Likes</h2>
          <p className="text-xs text-muted-foreground">
            {watchlist.length > 0 ? `${watchlist.length} ${watchlist.length !== 1 ? 'companies' : 'company'} saved` : 'Start swiping to build your list'}
          </p>
        </div>
        {canCompare && !picking && (
          <button onClick={startCompare} className="ml-auto min-h-[44px] px-4 rounded-full border border-premium-line bg-premium-tint text-premium-ink text-sm font-semibold flex items-center gap-1.5">
            <Columns2 className="w-4 h-4" aria-hidden /> Compare
            {!subscribed && <Crown className="w-3.5 h-3.5" aria-label="Premium" />}
          </button>
        )}
      </div>

      {picking && (
        <div role="status" className="sticky top-2 z-20 rounded-2xl border border-premium-line bg-premium-tint px-4 py-3 flex items-center gap-3 shadow-sm">
          <p className="flex-1 text-sm text-ink">
            <span className="font-semibold">Pick two to compare.</span> {picked.length} of 2 picked.
          </p>
          <button onClick={() => setPicking(false)} className="min-h-[44px] px-3 text-sm font-semibold text-premium-ink underline">Cancel</button>
        </div>
      )}

      {!signedIn && watchlist.length > 0 && onSaveMatches && waiting === 0 && (
        <button onClick={onSaveMatches} className="w-full text-left rounded-2xl border border-line bg-white shadow-sm p-4 text-sm text-ink">
          <span className="font-semibold">Saved on this device only.</span>{' '}
          <span className="text-ink-soft">Create a free account to keep your likes on any device.</span>
        </button>
      )}

      {watchlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center px-6">
          <Art3D src={CAUSE_ART.live_healthier} size={96} className="mb-6" />
          <h3 className="text-lg font-bold mb-2">No Likes Yet</h3>
          <p className="text-muted-foreground text-sm max-w-xs">
            Swipe right on companies you'd be proud to own a piece of. They'll show up here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shown.map((stock) => {
            const isPicked = picked.includes(stock.ticker);
            return (
              <div key={stock.id} className="relative">
                <StockCard stock={stock} onViewDetails={picking ? undefined : onViewDetails} />
                {picking && (
                  <button
                    onClick={() => pick(stock)}
                    aria-pressed={isPicked}
                    aria-label={`Compare ${stock.companyName}`}
                    className={`absolute inset-0 rounded-xl border-2 transition-colors ${isPicked ? 'border-premium bg-premium/10' : 'border-transparent'}`}
                  >
                    <span className={`absolute top-3 right-3 w-8 h-8 rounded-full border-2 flex items-center justify-center ${isPicked ? 'bg-premium border-premium text-white' : 'bg-white border-premium-line'}`}>
                      {isPicked && <Check className="w-4 h-4" strokeWidth={3} aria-hidden />}
                    </span>
                  </button>
                )}
              </div>
            );
          })}
          {waiting > 0 && (
            <div className="rounded-2xl border-2 border-dashed border-clay-soft bg-white p-6 flex flex-col items-center justify-center text-center text-ink">
              <Lock className="w-8 h-8 mb-3 opacity-80" />
              <p className="font-semibold">
                {waiting} more {waiting === 1 ? 'like is' : 'likes are'} waiting
              </p>
              <p className="text-sm opacity-70 mt-1 mb-4">Create a free account to keep them all.</p>
              {onSaveMatches && (
                <button onClick={onSaveMatches} className="min-h-[44px] px-5 rounded-full bg-primary text-white font-semibold text-sm">
                  Keep my likes
                </button>
              )}
            </div>
          )}
        </div>
      )}
      <Disclaimer className="pt-6 pb-24" />
      <CompareSheet pair={pair} onClose={() => setPair(null)} />
      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} reason="compare" />
    </div>
  );
};

export default Matches;
