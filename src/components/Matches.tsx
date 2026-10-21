import { useApp } from '@/contexts/AppContext';
import StockCard from '@/components/StockCard';
import { Heart, Lock, Sparkles } from 'lucide-react';
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

  return (
    <div className="space-y-6 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3 pt-4 px-1">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/30">
          <Heart className="w-5 h-5 text-white fill-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Your Likes</h2>
          <p className="text-xs text-muted-foreground">
            {watchlist.length > 0 ? `${watchlist.length} ${watchlist.length !== 1 ? 'companies' : 'company'} saved` : 'Start swiping to build your list'}
          </p>
        </div>
      </div>

      {!signedIn && watchlist.length > 0 && onSaveMatches && waiting === 0 && (
        <button onClick={onSaveMatches} className="w-full text-left rounded-2xl border border-white/20 bg-white/10 p-4 text-sm">
          <span className="font-semibold">Saved on this device only.</span>{' '}
          <span className="text-white/70">Create a free account to keep your likes on any device.</span>
        </button>
      )}

      {watchlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center px-6">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center border border-pink-500/20">
              <Heart className="w-10 h-10 text-pink-400/60" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          </div>
          <h3 className="text-lg font-bold mb-2">No Likes Yet</h3>
          <p className="text-muted-foreground text-sm max-w-xs">
            Swipe right on companies you'd be proud to own a piece of. They'll show up here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shown.map((stock) => (
            <StockCard
              key={stock.id}
              stock={stock}
              onViewDetails={onViewDetails}
            />
          ))}
          {waiting > 0 && (
            <div className="rounded-2xl border-2 border-dashed border-white/30 bg-white/10 p-6 flex flex-col items-center justify-center text-center">
              <Lock className="w-8 h-8 mb-3 opacity-80" />
              <p className="font-semibold">
                {waiting} more {waiting === 1 ? 'like is' : 'likes are'} waiting
              </p>
              <p className="text-sm opacity-70 mt-1 mb-4">Create a free account to keep them all.</p>
              {onSaveMatches && (
                <button onClick={onSaveMatches} className="min-h-[44px] px-5 rounded-full bg-white text-purple-700 font-semibold text-sm">
                  Keep my likes
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Matches;
