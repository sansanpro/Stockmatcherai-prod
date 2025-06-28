
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
      <div className="flex items-center gap-2 mb-6">
        <Heart className="w-6 h-6 text-pink-600 dark:text-pink-400 fill-current" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Matches</h2>
      </div>

      {watchlist.length === 0 ? (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-8 text-center">
            <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Matches Yet</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Start swiping on stocks to build your personalized matches list.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
