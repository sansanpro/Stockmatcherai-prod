
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/contexts/AppContext';
import { Trash2, TrendingUp, TrendingDown, Eye } from 'lucide-react';

const Watchlist = () => {
  const { watchlist, removeFromWatchlist } = useApp();
  const [selectedStock, setSelectedStock] = useState<string | null>(null);

  if (watchlist.length === 0) {
    return (
      <div className="text-center py-8">
        <Eye className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">
          Your watchlist is empty
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Start swiping to add stocks to your watchlist!
        </p>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(1)}B`;
    }
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    }
    return `$${num.toFixed(2)}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Your Watchlist ({watchlist.length})
        </h2>
      </div>

      <div className="grid gap-4">
        {watchlist.map((stock) => (
          <Card key={stock.ticker} className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-lg dark:text-white">{stock.ticker}</h3>
                    <Badge 
                      className={`${
                        stock.riskLevel === 'low' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        stock.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}
                    >
                      {stock.riskLevel.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{stock.companyName}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">{stock.sector}</span>
                    <span className="text-gray-500 dark:text-gray-400">P/E: {stock.peRatio}</span>
                    <span className="text-gray-500 dark:text-gray-400">{formatNumber(stock.pricePerShare)}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className={`flex items-center gap-1 ${
                      stock.oneYearReturn >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {stock.oneYearReturn >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span className="font-semibold">
                        {stock.oneYearReturn > 0 ? '+' : ''}{stock.oneYearReturn.toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">1-year return</div>
                  </div>
                  
                  <Button
                    onClick={() => removeFromWatchlist(stock.ticker)}
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Watchlist;
