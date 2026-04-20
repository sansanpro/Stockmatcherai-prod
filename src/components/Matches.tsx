import { useApp } from '@/contexts/AppContext';
import StockCard from '@/components/StockCard';
import { Heart, Sparkles } from 'lucide-react';
import { StockRecommendation } from '@/types/stock-matcher';

interface MatchesProps {
  onViewDetails?: (stock: StockRecommendation) => void;
}

const Matches = ({ onViewDetails }: MatchesProps) => {
  const { watchlist } = useApp();

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
            {watchlist.length > 0 ? `${watchlist.length} stock${watchlist.length !== 1 ? 's' : ''} saved` : 'Start swiping to build your list'}
          </p>
        </div>
      </div>

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
            Swipe right on stocks you love — they'll show up here for you to review anytime.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {watchlist.map((stock) => (
            <StockCard
              key={stock.id}
              stock={stock}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Matches;
