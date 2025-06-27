
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/contexts/AppContext';
import { Heart, TrendingUp, TrendingDown, Eye, Star } from 'lucide-react';
import SocialSharing from '@/components/SocialSharing';

const Matches = () => {
  const { watchlist } = useApp();

  if (watchlist.length === 0) {
    return (
      <div className="text-center py-8">
        <Heart className="w-16 h-16 mx-auto text-pink-300 dark:text-pink-600 mb-4 fill-current" />
        <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">
          No matches yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Start swiping to find your perfect stock matches!
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
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Heart className="w-8 h-8 text-pink-500 fill-current" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Your Matches
          </h2>
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          {watchlist.length} stock{watchlist.length !== 1 ? 's' : ''} you've matched with
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {watchlist.map((stock) => (
          <Card key={stock.ticker} className="dark:bg-gray-800 dark:border-gray-700 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl dark:text-white flex items-center gap-2">
                    {stock.ticker}
                    <Heart className="w-4 h-4 text-pink-500 fill-current" />
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {stock.companyName}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    className={`${
                      stock.riskLevel === 'low' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      stock.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}
                  >
                    {stock.riskLevel.toUpperCase()}
                  </Badge>
                  <SocialSharing stock={stock} />
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Performance */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-2">
                  {stock.oneYearReturn >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                  )}
                  <span className="text-sm text-gray-600 dark:text-gray-300">1-Year Return</span>
                </div>
                <span className={`font-bold ${
                  stock.oneYearReturn >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {stock.oneYearReturn > 0 ? '+' : ''}{stock.oneYearReturn.toFixed(1)}%
                </span>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Price</p>
                  <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
                    {formatNumber(stock.pricePerShare)}
                  </p>
                </div>
                <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">P/E</p>
                  <p className="text-sm font-bold text-purple-700 dark:text-purple-300">
                    {stock.peRatio}
                  </p>
                </div>
              </div>

              {/* Sector */}
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Star className="w-4 h-4" />
                <span>{stock.sector}</span>
              </div>

              {/* Why it matches */}
              <div className="p-3 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  {stock.whyItFits.substring(0, 100)}...
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Matches;
