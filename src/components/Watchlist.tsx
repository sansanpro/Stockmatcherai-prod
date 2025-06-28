
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import StockCard from '@/components/StockCard';
import { Eye, Trash2 } from 'lucide-react';
import { StockRecommendation } from '@/types/stock-matcher';

interface WatchlistProps {
  onViewDetails?: (stock: StockRecommendation) => void;
}

const Watchlist = ({ onViewDetails }: WatchlistProps) => {
  const { watchlist, removeFromWatchlist } = useApp();

  const handleRemove = (ticker: string) => {
    removeFromWatchlist(ticker);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Eye className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Watchlist</h2>
        <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-sm font-medium">
          {watchlist.length}
        </span>
      </div>

      {watchlist.length === 0 ? (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-8 text-center">
            <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Stocks in Watchlist</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Add stocks to your watchlist by swiping right on the stock matcher or clicking the heart icon.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {watchlist.map((stock) => (
            <div key={stock.id} className="relative">
              <StockCard 
                stock={stock} 
                onViewDetails={onViewDetails}
              />
              <Button
                onClick={() => handleRemove(stock.ticker)}
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 w-8 h-8 p-0 bg-red-500/80 hover:bg-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Watchlist;
