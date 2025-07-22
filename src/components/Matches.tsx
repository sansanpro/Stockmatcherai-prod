
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';
import StockCard from '@/components/StockCard';
import { Heart } from 'lucide-react';
import { StockRecommendation } from '@/types/stock-matcher';

interface MatchesProps {
  onViewDetails?: (stock: StockRecommendation) => void;
}

const Matches = ({ onViewDetails }: MatchesProps) => {
  const { watchlist } = useApp();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1 sm:gap-2 mb-4 sm:mb-6">
        <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600 dark:text-pink-400 fill-current" />
        <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">Your Likes</h2>
      </div>

      {watchlist.length === 0 ? (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-6 sm:p-8 text-center">
            <Heart className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">No Likes Yet</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
              Start swiping on stocks to build your personalized likes list.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
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
